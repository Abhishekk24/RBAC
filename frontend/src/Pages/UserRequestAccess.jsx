import React, { useState, useEffect } from "react";
import axios from "axios";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const UserRequestAccess = () => {
  const [userAddress, setUserAddress] = useState("");
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  const handleAdminSelect = (e) => {
    const adminId = e.target.value;
    setSelectedAdmin(adminId);

    const selected = admins.find((admin) => admin.id === adminId);
    setSensors(selected?.Sensors || []);
    setSelectedSensor(""); // Reset sensor selection when changing admin
  };

  const requestAccess = async () => {
    if (!userAddress || !selectedAdmin || !selectedSensor || !duration || isNaN(duration) || parseInt(duration) <= 0) {
      setError("Please fill in all fields correctly.");
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post("http://127.0.0.1:5000/request_access", {
        user_address: userAddress,
        resource: selectedSensor,
        duration: parseInt(duration),
      });

      setSuccess("Access request submitted successfully!");
      setUserAddress("");
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
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Request Access</h2>

        <input
          type="text"
          placeholder="Your Address"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          className="border p-2 w-full rounded-md mb-4"
        />

        <select value={selectedAdmin} onChange={handleAdminSelect} className="border p-2 w-full rounded-md mb-4">
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
          className={`w-full text-white px-4 py-2 rounded-md transition ${loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"}`}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Request"}
        </button>

        {/* Status Messages */}
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
      </div>
    </div>
  );
};

export default UserRequestAccess;
