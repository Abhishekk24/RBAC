import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { db, realtimeDb } from "../firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { useAccount } from "wagmi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const UserRequestAccess = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const processedTokens = useRef(new Set());

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
        toast.error("Failed to load admin list");
      }
    };

    fetchAdmins();
  }, []);

  useEffect(() => {
    if (!address) return;

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

          if (token.timestamp > Date.now() - 5000) {
            toast.success(`Access granted! Redirecting...`, {
              autoClose: 2000,
              onClose: () => navigate("/tokens"),
            });
          }
          processedTokens.current.add(token.tokenId);
        }
      });
    });

    return () => unsubscribe();
  }, [address, navigate]);

  useEffect(() => {
    processedTokens.current = new Set();
  }, [address]);

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
      const response = await axios.post(
        "http://127.0.0.1:5000/request_access",
        {
          user_address: address,
          resource: selectedSensor,
          duration: parseInt(duration),
        },
        {
          timeout: 5000,
        }
      );

      setSuccess("Access request submitted successfully!");
      setSelectedAdmin("");
      setSelectedSensor("");
      setDuration("");
    } catch (error) {
      let errorMsg = "Failed to submit request";
      if (error.response) {
        errorMsg = error.response.data.error || errorMsg;
      } else if (error.request) {
        errorMsg = "Network error - please check your connection";
      }
      setError(errorMsg);
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
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Connected as: <strong>{address}</strong>
                  </Typography>

                  <div className="mb-4">
                    <label
                      htmlFor="admin-select"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Select Admin
                    </label>
                    <select
                      id="admin-select"
                      value={selectedAdmin}
                      onChange={handleAdminSelect}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Admin</option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.first_name} {admin.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="sensor-select"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Select Sensor
                    </label>
                    <select
                      id="sensor-select"
                      value={selectedSensor}
                      onChange={(e) => setSelectedSensor(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      disabled={!sensors.length}
                    >
                      <option value="">Select Sensor</option>
                      {sensors.map((sensor, index) => (
                        <option key={index} value={sensor}>
                          {sensor}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="duration-input"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Duration (seconds)
                    </label>
                    <input
                      id="duration-input"
                      type="number"
                      placeholder="Duration in seconds"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>

                  <Button
                    onClick={requestAccess}
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Request Access"
                    )}
                  </Button>

                  {error && (
                    <Typography color="error" align="center" sx={{ mt: 2 }}>
                      {error}
                    </Typography>
                  )}
                  {success && (
                    <Typography
                      color="success.main"
                      align="center"
                      sx={{ mt: 2 }}
                    >
                      {success}
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default UserRequestAccess;
