import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Box, Typography } from "@mui/material";

const RealTimeGraph = ({ sensorData, sensorName }) => {
  const [readings, setReadings] = useState([]);
  const maxDataPoints = 20;

  useEffect(() => {
    if (!sensorData) return;

    const newReading = {
      time: new Date().toLocaleTimeString(),
      temperature: sensorData.Temperature || 0,
      gas: sensorData.GasValue || 0,
      alert: sensorData.alertTriggered ? 1 : 0,
    };

    setReadings((prev) => {
      const updated = [...prev, newReading].slice(-maxDataPoints);
      return updated;
    });
  }, [sensorData]);

  if (!readings.length) {
    return (
      <Box
        sx={{
          height: 400,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography>Waiting for sensor data...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: 4,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 3,
        height: "100%",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{ textAlign: "center", color: "gray" }}
      >
        <div className="font-bold">
          Live Data for {sensorName.replace("_", " ").toUpperCase()}
        </div>
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={readings}
          margin={{ top: 20, right: 1, left: 1, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="1 1" stroke="#e0e0e0" />
          <XAxis dataKey="time" tick={{ fill: "#757575" }} />
          <YAxis tick={{ fill: "#757575" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#f5f5f5",
              border: "none",
              borderRadius: 8,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
          <Legend verticalAlign="top" height={40} />
          <Line
            type="monotone"
            dataKey="temperature"
            name="Temperature (°C)"
            stroke="#3f51b5"
            strokeWidth={2}
            dot={{ fill: "#3f51b5", r: 3 }}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="gas"
            name="Gas Value (ppm)"
            stroke="#f44336"
            strokeWidth={2}
            dot={{ fill: "#f44336", r: 3 }}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="alert"
            name="Alert Status"
            stroke="#ff9800"
            strokeWidth={2}
            dot={{ fill: "#ff9800", r: 3 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default RealTimeGraph;
