import React, { useState } from "react";
import axios from "axios";

const GrantAccess = () => {
  const [to, setTo] = useState("");
  const [resource, setResource] = useState("");
  const [duration, setDuration] = useState("");

  const grantAccess = async () => {
    const response = await axios.post("http://127.0.0.1:5000/grant_access", {
      user_address: to,
      resource,
      duration: parseInt(duration),
    });

    alert(`Transaction Hash: ${response.data.tx_hash}`);
  };

  return (
    <div>
      <h2>Grant Access</h2>
      <input
        type="text"
        placeholder="Recipient Address"
        onChange={(e) => setTo(e.target.value)}
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
      <button onClick={grantAccess}>Grant</button>
    </div>
  );
};

export default GrantAccess;
