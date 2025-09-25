import React from "react";
import { Box, Grid, Card, CardContent, Typography } from "@mui/material";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ProviderDashboard() {
  // --- Demo Data ---
  const bookingData = [
    { month: "Jan", bookings: 10 },
    { month: "Feb", bookings: 25 },
    { month: "Mar", bookings: 18 },
    { month: "Apr", bookings: 32 },
    { month: "May", bookings: 20 },
    { month: "Jun", bookings: 40 },
  ];

  const revenueData = [
    { month: "Jan", revenue: 200 },
    { month: "Feb", revenue: 500 },
    { month: "Mar", revenue: 350 },
    { month: "Apr", revenue: 800 },
    { month: "May", revenue: 450 },
    { month: "Jun", revenue: 1000 },
  ];

  const roleData = [
    { name: "Completed", value: 400 },
    { name: "Pending", value: 200 },
    { name: "Cancelled", value: 100 },
  ];

  const COLORS = ["#0088FE", "#FFBB28", "#FF4444"];

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Provider Dashboard
      </Typography>

      {/* Top Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid size = { {xs:12, md:4 } }>
          <Card sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6">Total Bookings</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                125
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size = { {xs:12, md:4 } }>
          <Card sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6">Total Revenue</Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                ₹ 50,000
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size = { {xs:12, md:4 } }>
          <Card sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6">Active Customers</Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                78
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphs Section */}
      <Grid container spacing={3} >
        {/* Line Chart - Bookings */}
        <Grid size = { {xs:12, md:6 } }>
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Monthly Bookings
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={bookingData}>
                  <Line type="monotone" dataKey="bookings" stroke="#0066CC" />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Bar Chart - Revenue */}
        <Grid size = { {xs:12, md:6 } }>
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Monthly Revenue
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart - Booking Status */}
        <Grid size = { {xs:12, md:6 } }>
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={4}>
                Booking Status
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
