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
    if (selected && selected.Sensors) {
      setSensors(selected.Sensors);
    } else {
      setSensors([]);
    }
  };

  const requestAccess = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/request_access", {
        user_address: userAddress,
        resource: selectedSensor,
        duration: parseInt(duration),
      });
      alert("Access request submitted!");
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request.");
    }
  };

  return (
    <div>
      <h2>Request Access</h2>
      <input
        type="text"
        placeholder="Your Address"
        value={userAddress}
        onChange={(e) => setUserAddress(e.target.value)}
      />

      <select value={selectedAdmin} onChange={handleAdminSelect}>
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
      />

      <button onClick={requestAccess}>Request</button>
    </div>
  );
};

export default UserRequestAccess;
