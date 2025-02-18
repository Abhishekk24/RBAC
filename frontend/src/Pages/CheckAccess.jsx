import React, { useState } from "react";
import axios from "axios";

const CheckAccess = () => {
  const [tokenId, setTokenId] = useState("");
  const [status, setStatus] = useState(null);

  const checkAccess = async () => {
    const response = await axios.get(
      `http://127.0.0.1:5000/check_access/${parseInt(tokenId)}`
    );
    setStatus(response.data.valid ? "Valid" : "Invalid");
  };

  return (
    <div>
      <h2>Check Access</h2>
      <input
        type="number"
        placeholder="Token ID"
        onChange={(e) => setTokenId(e.target.value)}
      />
      <button onClick={checkAccess}>Check</button>
      {status !== null && <p>Access: {status}</p>}
    </div>
  );
};

export default CheckAccess;
