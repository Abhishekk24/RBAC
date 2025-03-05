import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RevokeAccess = () => {
  const [tokenId, setTokenId] = useState("");
  const [loading, setLoading] = useState(false);

  const revokeAccess = async () => {
    if (!tokenId || isNaN(tokenId) || parseInt(tokenId) < 0) {
      toast.error("❌ Please enter a valid Token ID.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:5000/revoke_access", {
        tokenId: parseInt(tokenId),
      });

      toast.success(`✅ Transaction Hash: ${response.data.tx_hash}`);
    } catch (err) {
      console.error(
        "🔥 Error revoking access:",
        err.response?.data || err.message
      );

      // Extract error message from backend response
      const errorMessage =
        err.response?.data?.error ||
        "Failed to revoke access. Please try again.";
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Revoke Access
        </h2>
        <input
          type="number"
          placeholder="Enter Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="border p-2 w-full rounded-md mb-4"
        />
        <button
          onClick={revokeAccess}
          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
          disabled={loading}
        >
          {loading ? "Revoking..." : "Revoke"}
        </button>
      </div>
    </div>
  );
};

export default RevokeAccess;
