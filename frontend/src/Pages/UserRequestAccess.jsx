import React, { useState } from "react";
import axios from "axios";

const UserRequestAccess = () => {
  const [userAddress, setUserAddress] = useState("");
  const [resource, setResource] = useState("");
  const [duration, setDuration] = useState("");

  const requestAccess = async () => {
    await axios.post("http://127.0.0.1:5000/request_access", {
      user_address: userAddress,
      resource,
      duration: parseInt(duration),
    });
    alert("Access request submitted!");
  };

  return (
    <div>
      <h2>Request Access</h2>
      <input
        type="text"
        placeholder="Your Address"
        onChange={(e) => setUserAddress(e.target.value)}
      />
      <input
        type="text"
        placeholder="Resource Name"
        onChange={(e) => setResource(e.target.value)}
      />
      <input
        type="number"
        placeholder="Duration (seconds)"
        onChange={(e) => setDuration(e.target.value)}
      />
      <button onClick={requestAccess}>Request</button>
    </div>
  );
};

export default UserRequestAccess;
