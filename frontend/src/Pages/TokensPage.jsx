import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, realtimeDb } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";
import RealTimeGraph from "../Components/RealTimeGraph";
import { Card, Typography, Button, Box, CircularProgress } from "@mui/material";

const TokensPage = () => {
  const { address } = useAccount();
  const [activeToken, setActiveToken] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!address) {
      navigate("/");
      return;
    }

    const tokensRef = collection(db, "tokens");
    const q = query(
      tokensRef,
      where("userAddress", "==", address),
      where("expiryTimestamp", ">", Date.now())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLoading(false);
      if (snapshot.empty) {
        toast.error("No active access tokens found");
        navigate("/user");
        return;
      }

      snapshot.forEach((doc) => {
        const token = doc.data();
        setActiveToken(token);
      });
    });

    return () => unsubscribe();
  }, [address, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!activeToken && !loading) {
        navigate("/user");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeToken, loading, navigate]);

  useEffect(() => {
    if (!activeToken?.resource) return;

    const sensorRef = ref(realtimeDb, activeToken.resource);
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      setSensorData(snapshot.val());
    });

    const expiryTime = activeToken.expiryTimestamp - Date.now();
    const expiryTimer = setTimeout(() => {
      toast.info(`Access to ${activeToken.resource} has expired`);
      setActiveToken(null);
      navigate("/user");
    }, expiryTime);

    return () => {
      off(sensorRef);
      clearTimeout(expiryTimer);
    };
  }, [activeToken, navigate]);

  if (!activeToken) {
    return (
      <div className="flex">
        <Box sx={{ p: 4, width: "100%", textAlign: "center" }}>
          {loading ? (
            <CircularProgress />
          ) : (
            <>
              <Typography variant="h5" gutterBottom>
                No Active Sensor Access
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                You don't currently have access to any sensors.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/user")}
                sx={{ mt: 2 }}
              >
                Request Access Now
              </Button>
            </>
          )}
        </Box>
      </div>
    );
  }

  return (
    <div className="flex">
      <Box sx={{ p: 4, width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            {activeToken.resource.replace("_", " ").toUpperCase()} Dashboard
          </Typography>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Refresh Data
          </Button>
        </Box>

        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            Access expires in:{" "}
            <strong>
              {Math.floor((activeToken.expiryTimestamp - Date.now()) / 1000)}{" "}
              seconds
            </strong>
          </Typography>
        </Card>

        {sensorData ? (
          <RealTimeGraph
            sensorData={sensorData}
            sensorName={activeToken.resource}
            height={500}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 300,
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>
    </div>
  );
};

export default TokensPage;
