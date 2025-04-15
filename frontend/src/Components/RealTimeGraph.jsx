import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, Typography } from "@mui/material";

const RealTimeGraph = ({ sensorData, sensorName, height = 400 }) => {
  const [data, setData] = useState([]);
  const maxDataPoints = 20;

  useEffect(() => {
    if (!sensorData) return;

    const newEntry = {
      time: new Date().toLocaleTimeString(),
      temperature: sensorData.Temperature || 0,
      gas: sensorData.GasValue || 0,
      alert: sensorData.alertTriggered ? 1 : 0,
    };

    setData((prev) => [...prev.slice(-maxDataPoints + 1), newEntry]);
  }, [sensorData]);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom align="center">
          Live Data for {sensorName.replace("_", " ").toUpperCase()}
        </Typography>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                label={{
                  value: "Time",
                  position: "insideBottomRight",
                  offset: -10,
                }}
              />
              <YAxis
                label={{ value: "Value", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.96)",
                  border: "none",
                  borderRadius: 8,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#3f51b5"
                strokeWidth={2}
                name="Temperature (°C)"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="gas"
                stroke="#f44336"
                strokeWidth={2}
                name="Gas Value (ppm)"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="alert"
                stroke="#ff9800"
                strokeWidth={2}
                name="Alert Status"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Typography variant="caption" display="block" align="center" mt={2}>
          Last updated: {new Date().toLocaleTimeString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RealTimeGraph;
