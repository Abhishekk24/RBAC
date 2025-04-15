import React, { useState, useEffect } from "react";
import axios from "axios";
import { db } from "../firebase";
import { collection, addDoc, getDocs, onSnapshot } from "firebase/firestore";
import { CheckIcon, XCircleIcon } from "@heroicons/react/solid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminPanel = () => {
  const [requests, setRequests] = useState([]);
  const [tokenId, setTokenId] = useState("");
  const [issuedTokens, setIssuedTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    fetchRequests();
    setupTokenListener();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/get_requests");
      setRequests(response.data);
    } catch (error) {
      toast.error("Error fetching requests: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener for tokens
  const setupTokenListener = () => {
    const tokensRef = collection(db, "tokens");
    return onSnapshot(tokensRef, (snapshot) => {
      const tokens = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch token status for all tokens
      axios
        .post("http://127.0.0.1:5000/get_token_status", {
          tokens: tokens.map((t) => t.tokenId),
        })
        .then((response) => {
          const updatedTokens = tokens.map((token, index) => ({
            ...token,
            ...response.data[index],
            expiryTimestamp: token.timestamp + token.duration * 1000,
          }));
          setIssuedTokens(updatedTokens);
        })
        .catch((error) => {
          console.error("Error fetching token status:", error);
        });
    });
  };

  // Update remaining time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setIssuedTokens((prevTokens) =>
        prevTokens.map((token) => ({
          ...token,
          remaining_time: Math.max(
            0,
            Math.floor((token.expiryTimestamp - Date.now()) / 1000)
          ),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const grantAccess = async (userAddress, resource, duration) => {
    try {
      setLoading(true);
      const response = await axios.post("http://127.0.0.1:5000/grant_access", {
        user_address: userAddress,
        resource,
        duration,
      });

      await addDoc(collection(db, "tokens"), {
        tokenId: response.data.token_id,
        userAddress,
        resource,
        duration,
        timestamp: Date.now(),
        expiryTimestamp: Date.now() + duration * 1000, // Add expiry timestamp
      });

      toast.success(
        `Access granted to ${userAddress}! Token ID: ${response.data.token_id}`
      );
      fetchRequests();
    } catch (error) {
      toast.error("Error granting access: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async () => {
    if (!tokenId) {
      toast.warning("Please enter a valid Token ID");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("http://127.0.0.1:5000/revoke_access", {
        tokenId: parseInt(tokenId),
      });

      toast.success(`Access revoked! Tx Hash: ${response.data.tx_hash}`);
      setTokenId("");
    } catch (error) {
      toast.error(
        "Error revoking access: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-3xl font-bold text-center mb-6">Admin Panel</h2>

      {/* Pending Requests Section */}
      <div className="mb-6 p-6 bg-white shadow-lg rounded-lg">
        <h3 className="text-xl font-semibold border-b pb-3 mb-3">
          Pending Requests
        </h3>
        {loading ? (
          <p className="text-gray-500">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500">No pending requests.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req, index) => (
              <li
                key={index}
                className="flex justify-between items-center p-3 border rounded-lg bg-gray-50"
              >
                <div>
                  <p className="font-medium">User: {req.user_address}</p>
                  <p className="text-gray-600">Resource: {req.resource}</p>
                  <p className="text-gray-600">
                    Duration: {formatTime(req.duration)}
                  </p>
                </div>
                <button
                  onClick={() =>
                    grantAccess(req.user_address, req.resource, req.duration)
                  }
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                  disabled={loading}
                >
                  <CheckIcon className="h-5 w-5 mr-2" /> Grant Access
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Revoke Access Section */}
      <div className="mb-6 p-6 bg-white shadow-lg rounded-lg">
        <h3 className="text-xl font-semibold border-b pb-3 mb-3">
          Revoke Access
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter Token ID"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="border p-2 rounded-lg w-full"
          />
          <button
            onClick={revokeAccess}
            className="bg-black hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center"
            disabled={loading}
          >
            <XCircleIcon className="h-5 w-5 mr-2" /> Revoke
          </button>
        </div>
      </div>

      {/* Issued Tokens Section */}
      <div className="p-6 bg-white shadow-lg rounded-lg">
        <h3 className="text-xl font-semibold border-b pb-3 mb-3">
          Issued Tokens
        </h3>
        <input
          type="text"
          placeholder="Search Token ID or User"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg w-full mb-4"
        />
        {issuedTokens.length === 0 ? (
          <p className="text-gray-500">No issued tokens.</p>
        ) : (
          <ul className="space-y-2">
            {issuedTokens
              .filter(
                (token) =>
                  token.tokenId.toString().includes(search) ||
                  (token.userAddress && token.userAddress.includes(search))
              )
              .map((token) => (
                <li
                  key={token.tokenId}
                  className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-semibold">Token ID:</p>
                      <p>{token.tokenId}</p>
                    </div>
                    <div>
                      <p className="font-semibold">User:</p>
                      <p className="truncate">{token.userAddress}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Resource:</p>
                      <p>{token.resource}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Status:</p>
                      <p
                        className={
                          token.status === "Valid"
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {token.status}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Time Remaining:</p>
                      <p>{formatTime(token.remaining_time)}</p>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
