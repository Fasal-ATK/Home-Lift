import React, { useEffect, useState } from "react";
import { 
  Box, 
  Grid, 
  Typography, 
  CircularProgress,
  Stack,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
} from "@mui/material";
import { 
  BookOnline, 
  AccountBalanceWallet, 
  Group 
} from '@mui/icons-material';
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
import api from "../../API/apiConfig";
import apiEndpoints from "../../API/apiEndpoints";

const COLORS = ["#0088FE", "#FFBB28", "#FF4444", "#00C49F", "#9c27b0"];

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 4,
      border: "1px solid #e0e0e0",
      height: "100%",
      transition: "transform 0.2s",
      "&:hover": { transform: "translateY(-4px)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="overline" color="text.secondary" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="800" sx={{ my: 0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ display: 'block', fontSize: '0.7rem', mt: 0.5, opacity: 0.8 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          backgroundColor: `${color}15`,
          color: color,
        }}
      >
        {icon}
      </Box>
    </Stack>
  </Paper>
);

export default function ProviderDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all_time");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (timeRange === "custom" && customRange.start && customRange.end) {
        params.start_date = customRange.start;
        params.end_date = customRange.end;
      } else {
        params.time_range = timeRange;
      }
      const res = await api.get(apiEndpoints.provider.dashboardStats, { params });
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch provider stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return <Typography>Error loading dashboard data.</Typography>;

  const { stats, monthly_data: bookingData, status_data: roleData } = data;
  const revenueData = bookingData; // Since backend returns both in same array

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, width: '100%', boxSizing: 'border-box' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Provider Dashboard
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          {timeRange === 'custom' && (
            <Stack direction="row" spacing={1}>
              <TextField 
                type="date" 
                size="small" 
                value={customRange.start}
                onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
              />
              <TextField 
                type="date" 
                size="small" 
                value={customRange.end}
                onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
              />
              <Button variant="contained" onClick={fetchStats} color="primary" sx={{ boxShadow: 0 }}>
                Apply
              </Button>
            </Stack>
          )}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{ bgcolor: '#fff', borderRadius: 2 }}
            >
              <MenuItem value="all_time">All Time</MenuItem>
              <MenuItem value="this_week">This Week</MenuItem>
              <MenuItem value="this_month">This Month</MenuItem>
              <MenuItem value="6_months">Last 6 Months</MenuItem>
              <MenuItem value="1_year">Last 1 Year</MenuItem>
              <MenuItem value="custom">Custom Date Range</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Top Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
          <StatCard
            title="Total Bookings"
            value={stats.total_bookings}
            icon={<BookOnline />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
          <StatCard
            title="Total Revenue"
            value={`₹${Number(stats.total_revenue).toLocaleString()}`}
            icon={<AccountBalanceWallet />}
            color="#2e7d32"
            subtitle="Your Share"
          />
        </Grid>
        <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
          <StatCard
            title="Active Customers"
            value={stats.active_customers}
            icon={<Group />}
            color="#ed6c02"
          />
        </Grid>
      </Grid>

      {/* Graphs Section */}
      <Grid container spacing={3}>
        {/* Line Chart - Bookings */}
        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e0e0e0", height: "100%" }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Monthly Bookings
            </Typography>
            <Box sx={{ width: "100%", height: 300, minWidth: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingData}>
                  <Line type="monotone" dataKey="bookings" stroke="#0066CC" strokeWidth={3} />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Bar Chart - Revenue */}
        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e0e0e0", height: "100%" }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Monthly Revenue
            </Typography>
            <Box sx={{ width: "100%", height: 300, minWidth: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="revenue" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Pie Chart - Booking Status */}
        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e0e0e0", height: "100%" }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Booking Status
            </Typography>
            <Box sx={{ width: "100%", height: 300, minWidth: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
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
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
