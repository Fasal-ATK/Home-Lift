import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Divider,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Button
} from "@mui/material";
import {
  TrendingUp,
  People,
  Engineering,
  BookOnline,
  AttachMoney,
  ShowChart,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import api from "../../API/apiConfig";
import apiEndpoints from "../../API/apiEndpoints";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

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
            sx={{ 
              display: 'block', 
              fontSize: '0.7rem', 
              mt: 0.5,
              opacity: 0.8,
              lineHeight: 1.2,
              whiteSpace: 'normal',
            }}
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

const Dashboard = () => {
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
      const res = await api.get(apiEndpoints.adminDashboard.stats, { params });
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
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

  const pieData = Object.entries(data.status_breakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, width: '100%', boxSizing: 'border-box' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening with HomeLift today.
          </Typography>
        </Box>
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

      {/* 🟢 Top row stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Total Customers"
            value={data.stats.customers}
            icon={<People />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Total Providers"
            value={data.stats.providers}
            icon={<Engineering />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Total Bookings"
            value={data.stats.bookings}
            icon={<BookOnline />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Total Revenue"
            value={`₹${Number(data.stats.revenue).toLocaleString()}`}
            icon={<AttachMoney />}
            color="#9c27b0"
            subtitle={`Platform Earnings: ₹${Number(data.stats.platform_revenue).toLocaleString()}`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={4}>
        {/* 🟢 Bar Chart - Daily Stats */}
        <Grid item xs={12} md={8} sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e0e0e0", height: "100%" }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Daily Bookings (Last 7 Days)
            </Typography>
            <Box sx={{ width: "100%", height: 300, minWidth: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    tickFormatter={(val) => val.split(' ')[0]} 
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* 🟢 Pie Chart - Booking Status */}
        <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e0e0e0", height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Booking Status
            </Typography>
            <Box sx={{ flexGrow: 1, width: "100%", minHeight: 250, minWidth: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1} mt={2}>
              {pieData.map((entry, index) => (
                <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                  <Typography variant="caption">{entry.name}: {entry.value}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 🟢 Recent Bookings Table */}
        <Grid item xs={12} md={7} sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Recent Bookings
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recent_bookings.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.user}</TableCell>
                      <TableCell>{row.service}</TableCell>
                      <TableCell>₹{row.price}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          color={
                            row.status === "completed"
                              ? "success"
                              : row.status === "pending"
                              ? "warning"
                              : "primary"
                          }
                          sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* 🟢 Top Services List */}
        <Grid item xs={12} md={5} sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Top Services by Volume
            </Typography>
            <Stack spacing={2}>
              {data.top_services.map((item, index) => (
                <Box key={item.service__name}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="medium">
                      {item.service__name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.count} bookings
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      height: 8,
                      width: "100%",
                      bgcolor: "#f0f0f0",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${(item.count / data.stats.bookings) * 100}%`,
                        bgcolor: COLORS[index % COLORS.length],
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
