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
  Container,
  Avatar,
  Fade,
} from "@mui/material";
import { 
  BookOnline, 
  AccountBalanceWallet, 
  Group,
  TrendingUp,
  ArrowForward,
  FilterList,
  Star,
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
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";
import api from "../../API/apiConfig";
import apiEndpoints from "../../API/apiEndpoints";

const COLORS = ["#1976d2", "#cddc39", "#ff9800", "#f44336", "#9c27b0"];

const StatCard = ({ title, value, icon, color, subtitle, delay=0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay: delay / 1000, duration: 0.5, type: 'spring' }}
    whileHover={{ y: -6 }}
    style={{ height: '100%' }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, ${color}05 100%)`,
        backdropFilter: "blur(10px)",
        border: "1px solid #eef2f6",
        height: "100%",
        position: 'relative',
        overflow: 'hidden',
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
        "&:hover": { 
          boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
          "& .bg-icon": { 
            transform: "scale(1.2) rotate(-5deg)", 
            opacity: 0.12 
          }
        },
      }}
    >
      <Box 
        className="bg-icon"
        sx={{
          position: 'absolute',
          right: -20,
          bottom: -20,
          fontSize: '120px',
          color: color,
          opacity: 0.05,
          transition: "all 0.4s",
          pointerEvents: 'none',
          display: { xs: 'none', sm: 'block' }
        }}
      >
        {icon}
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ zIndex: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight="800" sx={{ my: 0.5, color: '#101828' }}>
            {value}
          </Typography>
          {subtitle && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TrendingUp sx={{ fontSize: 16, color: '#2e7d32' }} />
              <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                {subtitle}
              </Typography>
            </Stack>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}15`,
            color: color,
            width: 48,
            height: 48,
            borderRadius: 3,
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </Paper>
  </motion.div>
);

const SectionHead = ({ title }) => (
  <Typography variant="h6" fontWeight="800" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: '#101828' }}>
    <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 4 }} />
    {title}
  </Typography>
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
      <Box sx={{ display: "flex", flexDirecton: 'column', gap: 2, justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress thickness={5} size={60} />
        <Typography variant="body2" color="text.secondary">Fetching your latest stats...</Typography>
      </Box>
    );
  }

  if (!data) return <Typography>Error loading dashboard data.</Typography>;

  const { stats, monthly_data: bookingData, status_data: roleData } = data;
  const revenueData = bookingData;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: '100%', boxSizing: 'border-box' }}>
      {/* Header section with branding feel */}
      <Box sx={{ mb: 6 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={3}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#101828', mb: 1.5, letterSpacing: -1.0 }}>
              Dashboard Overview
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight="normal">
              Welcome back! Here's how <span style={{ color: '#cddc39', fontWeight: 800 }}>Home Lift</span> is performing for you.
            </Typography>
          </Box>

          <Stack direction="row" spacing={3} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <FormControl size="medium" sx={{ minWidth: 200, bgcolor: '#fff' }}>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{ borderRadius: 3, fontWeight: 700, p: 0.5 }}
                startAdornment={<FilterList sx={{ mr: 1.5, opacity: 0.6 }} />}
              >
                <MenuItem value="all_time">All Time</MenuItem>
                <MenuItem value="this_week">This Week</MenuItem>
                <MenuItem value="this_month">This Month</MenuItem>
                <MenuItem value="6_months">Last 6 Months</MenuItem>
                <MenuItem value="1_year">Last Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {timeRange === 'custom' && (
          <Fade in={true}>
            <Paper sx={{ p: 3, mt: 3, borderRadius: 4, border: '1px solid #eef2f6', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
              <Stack direction="row" spacing={3} alignItems="center">
                <TextField type="date" label="Start Date" size="medium" InputLabelProps={{ shrink: true }} value={customRange.start} onChange={(e) => setCustomRange({...customRange, start: e.target.value})} sx={{ flex: 1 }} />
                <TextField type="date" label="End Date" size="medium" InputLabelProps={{ shrink: true }} value={customRange.end} onChange={(e) => setCustomRange({...customRange, end: e.target.value})} sx={{ flex: 1 }} />
                <Button variant="contained" onClick={fetchStats} sx={{ px: 5, py: 1.5, borderRadius: 3, fontWeight: 700 }}>Apply Filter</Button>
              </Stack>
            </Paper>
          </Fade>
        )}
      </Box>

      {/* Hero Stats */}
      <Grid container spacing={4} mb={6}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Bookings" value={stats.total_bookings} icon={<BookOnline sx={{ fontSize: 40 }} />} color="#1976d2" delay={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Revenue" value={`₹${Number(stats.total_revenue).toLocaleString()}`} icon={<AccountBalanceWallet sx={{ fontSize: 40 }} />} color="#cddc39" subtitle="Earnings" delay={100} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Average Rating" value={stats.avg_rating} icon={<Star sx={{ fontSize: 40 }} />} color="#ffc107" subtitle="Feedback Score" delay={200} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Customers" value={stats.active_customers} icon={<Group sx={{ fontSize: 40 }} />} color="#ff9800" delay={300} />
        </Grid>
      </Grid>

      {/* Main Insights */}
      <Grid container spacing={4}>
        <Grid item xs={12} xl={8}>
          <Paper elevation={0} sx={{ p: 5, borderRadius: 6, border: "1px solid #eef2f6", boxShadow: "0 10px 30px rgba(0,0,0,0.04)", height: '100%' }}>
            <SectionHead title="Revenue & Performance Insights" />
            <Box sx={{ height: 450, mt: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976d2" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#1976d2" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} xl={4}>
          <Paper elevation={0} sx={{ p: 5, borderRadius: 6, border: "1px solid #eef2f6", height: '100%', boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
            <SectionHead title="Booking Mix Analysis" />
            <Box sx={{ height: 450, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie data={roleData} innerRadius={85} outerRadius={125} paddingAngle={8} dataKey="value" stroke="none">
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }} />
                  <Legend verticalAlign="bottom" height={40} wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 6, 
              borderRadius: 6, 
              border: "1px solid #eef2f6", 
              background: 'linear-gradient(90deg, #101828 0%, #1d2939 100%)',
              color: '#fff',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight="800" sx={{ mb: 1 }}>Maximize your earning potential!</Typography>
              <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>Review and accept new job requests to expand your service reach today.</Typography>
            </Box>
            <Button 
              variant="contained" 
              onClick={() => window.location.href='/provider/job-requests'}
              endIcon={<ArrowForward sx={{ fontSize: 24 }} />}
              sx={{ 
                bgcolor: '#cddc39', 
                color: '#101828', 
                px: 6, 
                py: 2, 
                borderRadius: 4, 
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 800,
                "&:hover": { bgcolor: '#d4e157', transform: 'scale(1.05)' },
                transition: 'all 0.3s'
              }}
            >
              Go to Job Requests
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

