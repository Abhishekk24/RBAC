import React, { useState, useEffect } from "react";
import axios from "axios";
import { db } from "../firebase"; // Import Firebase
import { collection, addDoc, getDocs } from "firebase/firestore";

const AdminPanel = () => {
  const [requests, setRequests] = useState([]);
  const [tokenId, setTokenId] = useState("");
  const [issuedTokens, setIssuedTokens] = useState([]);

  useEffect(() => {
    fetchRequests();
    fetchIssuedTokens(); // Fetch token IDs from Firestore
  }, []);

  const fetchRequests = async () => {
    const response = await axios.get("http://127.0.0.1:5000/get_requests");
    setRequests(response.data);
  };

  const fetchIssuedTokens = async () => {
    const querySnapshot = await getDocs(collection(db, "tokens"));
    const tokens = [];
    querySnapshot.forEach((doc) => {
      tokens.push(doc.data().tokenId);
    });
    setIssuedTokens(tokens);
  };

  const grantAccess = async (userAddress, resource, duration) => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/grant_access", {
        user_address: userAddress,
        resource,
        duration,
      });

      // Store the token ID in Firestore
      await addDoc(collection(db, "tokens"), {
        tokenId: response.data.token_id,
      });

      alert(`Access granted! Token ID: ${response.data.token_id}`);
      fetchIssuedTokens(); // Refresh the list of issued tokens
      fetchRequests(); // Refresh the list of requests
    } catch (error) {
      console.error(
        "Error granting access:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const revokeAccess = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/revoke_access", {
        tokenId: parseInt(tokenId),
      });
      alert("Access revoked!");
    } catch (error) {
      console.error(
        "Error revoking access:",
        error.response ? error.response.data : error.message
      );
    }
  };
  

  return (
    <div>
      <h2>Admin Panel</h2>
      <h3>Pending Requests</h3>
      <ul>
        {requests.map((req, index) => (
          <li key={index}>
            User: {req.user_address}, Resource: {req.resource}, Duration:{" "}
            {req.duration}
            <button
              onClick={() =>
                grantAccess(req.user_address, req.resource, req.duration)
              }
            >
              Grant Access
            </button>
          </li>
        ))}
      </ul>
      <h3>Revoke Access</h3>
      <input
        type="number"
        placeholder="Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
      />
      <button onClick={revokeAccess}>Revoke</button>
      <h3>Issued Tokens</h3>
      <ul>
        {issuedTokens.map((id, index) => (
          <li key={index}>Token ID: {id}</li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPanel;
