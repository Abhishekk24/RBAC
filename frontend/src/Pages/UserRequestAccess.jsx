import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { db, realtimeDb } from "../firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore"; // Added imports
import { ref, onValue, off } from "firebase/database";
import { useAccount } from "wagmi";
import { toast, ToastContainer } from "react-toastify"; // Added for notifications
import "react-toastify/dist/ReactToastify.css";
import RealTimeGraph from "../Components/RealTimeGraph";
import { Card, CardContent, Typography, Grid } from "@mui/material";

const UserRequestAccess = () => {
  const { address, isConnected } = useAccount();
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [activeToken, setActiveToken] = useState(() => {
    const savedToken = localStorage.getItem("activeToken");
    return savedToken && JSON.parse(savedToken).expiryTimestamp > Date.now()
      ? JSON.parse(savedToken)
      : null;
  });
  const processedTokens = useRef(new Set());

  useEffect(() => {
    if (activeToken) {
      localStorage.setItem("activeToken", JSON.stringify(activeToken));
    } else {
      localStorage.removeItem("activeToken");
    }
  }, [activeToken]);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const adminList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAdmins(adminList);
      } catch (error) {
        console.error("Error fetching admins:", error);
      }
    };

    fetchAdmins();
  }, []);

  useEffect(() => {
    if (!address) return; // Skip if address is not available

    const tokensRef = collection(db, "tokens");
    const q = query(
      tokensRef,
      where("userAddress", "==", address),
      where("expiryTimestamp", ">", Date.now())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const token = change.doc.data();
          if (processedTokens.current.has(token.tokenId)) return;
          console.log("New token detected:", token);
          if (token.timestamp > Date.now() - 5000) {
            // 5 second buffer
            toast.success(`Access granted! Token ID: ${token.tokenId}`);
            setActiveToken(token);
          }
          processedTokens.current.add(token.tokenId);
        }
      });
      snapshot.docs.forEach((doc) => {
        const token = doc.data();
        const savedToken = JSON.parse(
          localStorage.getItem("activeToken") || "null"
        );
        if (!activeToken && savedToken?.tokenId === token.tokenId) {
          setActiveToken(token);
        }
      });
    });

    return () => unsubscribe();
  }, [address]);
  useEffect(() => {
    processedTokens.current = new Set();
  }, [address]);

  useEffect(() => {
    if (!activeToken?.resource) return;

    const sensorRef = ref(realtimeDb, activeToken.resource);
    console.log("Listening to path:", activeToken.resource);
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      setSensorData(data);
    });

    const expiryTime = activeToken.expiryTimestamp - Date.now();
    const expiryTimer = setTimeout(() => {
      toast.info(`Access to ${activeToken.resource} has expired`);
      setActiveToken(null);
      setSensorData(null);
    }, expiryTime);

    return () => {
      off(sensorRef);
      clearTimeout(expiryTimer);
    };
  }, [activeToken]);

  const handleAdminSelect = (e) => {
    const adminId = e.target.value;
    setSelectedAdmin(adminId);
    const selected = admins.find((admin) => admin.id === adminId);
    setSensors(selected?.Sensors || []);
    setSelectedSensor("");
  };

  const requestAccess = async () => {
    if (
      !address ||
      !selectedAdmin ||
      !selectedSensor ||
      !duration ||
      isNaN(duration) ||
      parseInt(duration) <= 0
    ) {
      setError("Please fill in all fields correctly.");
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post("http://127.0.0.1:5000/request_access", {
        user_address: address,
        resource: selectedSensor,
        duration: parseInt(duration),
      });

      setSuccess("Access request submitted successfully!");
      setSelectedAdmin("");
      setSelectedSensor("");
      setDuration("");
    } catch (error) {
      console.error("Error submitting request:", error);
      setError("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Grid container spacing={3} justifyContent="center">
        {/* Form Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography
                variant="h5"
                component="div"
                gutterBottom
                align="center"
              >
                Request Sensor Access
              </Typography>

              {!isConnected ? (
                <div className="w-full">
                  <appkit-button />
                </div>
              ) : (
                <>
                  <div className="mb-4 text-gray-600">
                    Connected as: <span className="font-mono">{address}</span>
                  </div>

                  <select
                    value={selectedAdmin}
                    onChange={handleAdminSelect}
                    className="border p-2 w-full rounded-md mb-4"
                  >
                    <option value="">Select Admin</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.first_name} {admin.last_name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedSensor}
                    onChange={(e) => setSelectedSensor(e.target.value)}
                    className="border p-2 w-full rounded-md mb-4"
                    disabled={!sensors.length}
                  >
                    <option value="">Select Sensor</option>
                    {sensors.map((sensor, index) => (
                      <option key={index} value={sensor}>
                        {sensor}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Duration (seconds)"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="border p-2 w-full rounded-md mb-4"
                  />

                  <button
                    onClick={requestAccess}
                    className={`w-full text-white px-4 py-2 rounded-md transition ${
                      loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Request"}
                  </button>

                  {error && (
                    <p className="mt-4 text-red-500 text-center">{error}</p>
                  )}
                  {success && (
                    <p className="mt-4 text-green-500 text-center">{success}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Graph Card - Only shows when there's active data */}
        {activeToken && sensorData && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <RealTimeGraph
                  sensorData={sensorData}
                  sensorName={activeToken.resource}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mt: 2 }}
                >
                  Access expires in:{" "}
                  {Math.floor(
                    (activeToken.expiryTimestamp - Date.now()) / 1000
                  )}
                  seconds
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default UserRequestAccess;
