import React, { useState } from "react";
import axios from "axios";
import HashLoader from "react-spinners/HashLoader";

const CheckAccess = () => {
  const [tokenId, setTokenId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkAccess = async () => {
    if (!tokenId || isNaN(tokenId) || parseInt(tokenId) < 0) {
      setError("Please enter a valid Token ID.");
      setStatus(null);
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/check_access/${parseInt(tokenId)}`
      );
      setStatus(response.data.valid ? "Valid" : "Invalid");
    } catch (err) {
      console.error("Error checking access:", err.response?.data || err.message);
      setError("Failed to check access. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Check Access</h2>
        <input
          type="number"
          placeholder="Enter Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="border p-2 w-full rounded-md mb-4"
        />
        <button
          onClick={checkAccess}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition"
          disabled={loading}
        >
          {loading ? 
        <HashLoader size={30} />
       : "Check"}
        </button>

        {/* Status Messages */}
        {status && (
          <p className={`mt-4 text-lg font-medium ${status === "Valid" ? "text-green-600" : "text-red-600"}`}>
            Access: {status}
          </p>
        )}
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default CheckAccess;
