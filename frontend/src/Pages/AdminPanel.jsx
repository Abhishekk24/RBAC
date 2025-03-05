import React, { useState, useEffect } from "react";
import axios from "axios";
import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { CheckIcon, XCircleIcon } from "@heroicons/react/solid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminPanel = () => {
  const [requests, setRequests] = useState([]);
  const [tokenId, setTokenId] = useState("");
  const [issuedTokens, setIssuedTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRequests();
    fetchIssuedTokens();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/get_requests");
      setRequests(response.data);
    } catch (error) {
      toast.error("Error fetching requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchIssuedTokens = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "tokens"));
      const tokens = querySnapshot.docs.map((doc) => doc.data().tokenId);

      const response = await axios.post(
        "http://127.0.0.1:5000/get_token_status",
        {
          tokens: tokens,
        }
      );
      const updatedTokens = response.data.map((token) => ({
        ...token,
        expiryTimestamp: Date.now() + token.remaining_time * 1000,
      }));

      setIssuedTokens(updatedTokens);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIssuedTokens((prevTokens) =>
        prevTokens.map((token) => {
          const remainingTime = Math.max(
            0,
            Math.floor((token.expiryTimestamp - Date.now()) / 1000)
          );
          return { ...token, remaining_time: remainingTime };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const grantAccess = async (userAddress, resource, duration) => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/grant_access", {
        user_address: userAddress,
        resource,
        duration,
      });

      await addDoc(collection(db, "tokens"), {
        tokenId: response.data.token_id,
      });
      toast.success(`Access granted! Token ID: ${response.data.token_id}`);
      fetchIssuedTokens();
      fetchRequests();
    } catch (error) {
      toast.error("Error granting access");
    }
  };

  const revokeAccess = async () => {
    if (!tokenId) {
      toast.warning("Please enter a valid Token ID");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5000/revoke_access", {
        tokenId: parseInt(tokenId),
      });

      toast.success(`Access revoked! Tx Hash: ${response.data.tx_hash}`);
      fetchIssuedTokens();
    } catch (error) {
      toast.error("Error revoking access");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-3xl font-bold text-center mb-6">Admin Panel</h2>

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
                  <p className="text-gray-600">Duration: {req.duration}</p>
                </div>
                <button
                  onClick={() =>
                    grantAccess(req.user_address, req.resource, req.duration)
                  }
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <CheckIcon className="h-5 w-5 mr-2" /> Grant Access
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
          >
            <XCircleIcon className="h-5 w-5 mr-2" /> Revoke
          </button>
        </div>
      </div>

      <div className="p-6 bg-white shadow-lg rounded-lg">
        <h3 className="text-xl font-semibold border-b pb-3 mb-3">
          Issued Tokens
        </h3>
        <input
          type="text"
          placeholder="Search Token ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg w-full mb-4"
        />
        {issuedTokens.length === 0 ? (
          <p className="text-gray-500">No issued tokens.</p>
        ) : (
          <ul className="space-y-2">
            {issuedTokens
              .filter((token) => token.tokenId.toString().includes(search))
              .map((token, index) => (
                <li key={index} className="p-2 border rounded-lg bg-gray-50">
                  <p>
                    <strong>Token ID:</strong> {token.tokenId}
                  </p>
                  <p>
                    <strong>Status:</strong> {token.status}
                  </p>
                  <p>
                    <strong>Remaining Time:</strong> {token.remaining_time}{" "}
                    seconds
                  </p>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
