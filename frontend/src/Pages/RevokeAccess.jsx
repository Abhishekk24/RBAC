import React, { useState } from "react";
import axios from "axios";

const RevokeAccess = () => {
  const [tokenId, setTokenId] = useState("");

  const revokeAccess = async () => {
    const response = await axios.post("http://127.0.0.1:5000/revoke_access", {
      tokenId: parseInt(tokenId),
    });

    alert(`Transaction Hash: ${response.data.tx_hash}`);
  };

  return (
    <div>
      <h2>Revoke Access</h2>
      <input
        type="number"
        placeholder="Token ID"
        onChange={(e) => setTokenId(e.target.value)}
      />
      <button onClick={revokeAccess}>Revoke</button>
    </div>
  );
};

export default RevokeAccess;
