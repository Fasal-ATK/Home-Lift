import React, { useEffect, useState } from "react";
import {
  Box, Grid, Typography, CircularProgress, Stack, FormControl,
  Select, MenuItem, TextField, Button, Paper, Avatar, Fade,
} from "@mui/material";
import {
  BookOnline, AccountBalanceWallet, Group, TrendingUp,
  ArrowForward, FilterList, Star, CheckCircle,
} from "@mui/icons-material";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { styled, keyframes } from "@mui/material/styles";
import api from "../../API/apiConfig";
import apiEndpoints from "../../API/apiEndpoints";

// ─── animations ──────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

// ─── styled ──────────────────────────────────────────────────────────────────
const HeroBanner = styled(Box)(() => ({
  background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  borderRadius: 24,
  padding: "40px 36px",
  marginBottom: 32,
  position: "relative",
  overflow: "hidden",
  animation: `${fadeUp} 0.5s ease both`,
  "&::before": {
    content: '""',
    position: "absolute",
    top: -80, right: -80,
    width: 320, height: 320,
    borderRadius: "50%",
    background: "rgba(99,102,241,0.1)",
    pointerEvents: "none",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: -60, left: -60,
    width: 200, height: 200,
    borderRadius: "50%",
    background: "rgba(167,139,250,0.07)",
    pointerEvents: "none",
  },
}));

const StatCard = ({ title, value, icon, color, subtitle, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay / 1000, duration: 0.5, type: "spring" }}
    whileHover={{ y: -6 }}
    style={{ height: "100%" }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: "1px solid #e8ecf0",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#fff",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        "&:hover": { boxShadow: "0 16px 40px rgba(0,0,0,0.08)", borderColor: color },
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: "absolute",
          right: -20, bottom: -20,
          fontSize: "110px",
          color: color,
          opacity: 0.05,
          transition: "all 0.4s",
          pointerEvents: "none",
          display: { xs: "none", sm: "block" },
        }}
      >
        {icon}
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ zIndex: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, fontSize: 10 }}>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight={900} sx={{ my: 0.5, color: "#0f172a", letterSpacing: "-1px" }}>
            {value}
          </Typography>
          {subtitle && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TrendingUp sx={{ fontSize: 14, color: "#22c55e" }} />
              <Typography variant="caption" sx={{ color: "#22c55e", fontWeight: 700 }}>{subtitle}</Typography>
            </Stack>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}18`, color, width: 52, height: 52, borderRadius: 3 }}>
          {icon}
        </Avatar>
      </Stack>
    </Paper>
  </motion.div>
);

const SectionCard = styled(Paper)(() => ({
  padding: 32,
  borderRadius: 24,
  border: "1px solid #e8ecf0",
  boxShadow: "0 4px 24px rgba(0,0,0,0.03)",
  height: "100%",
  background: "#fff",
}));

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      bgcolor: "rgba(15,12,41,0.95)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 3,
      p: 2,
      minWidth: 140,
    }}>
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{label}</Typography>
      {payload.map((p) => (
        <Typography key={p.name} variant="body2" fontWeight={800} sx={{ color: "#a78bfa", mt: 0.5 }}>
          ₹{Number(p.value).toLocaleString()}
        </Typography>
      ))}
    </Box>
  );
};

const COLORS = ["#6366f1", "#cddc39", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ProviderDashboard() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [timeRange, setTimeRange]   = useState("all_time");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (timeRange === "custom" && customRange.start && customRange.end) {
        params.start_date = customRange.start;
        params.end_date   = customRange.end;
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

  useEffect(() => { fetchStats(); }, [timeRange]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress thickness={4} size={56} sx={{ color: "#6366f1" }} />
        <Typography variant="body2" color="text.secondary">Fetching your latest stats…</Typography>
      </Box>
    );
  }

  if (!data) return <Typography>Error loading dashboard.</Typography>;

  const { stats, monthly_data: bookingData, status_data: roleData } = data;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f8f9fc" }}>

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <HeroBanner>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={3}>
          <Box>
            <Typography variant="h3" fontWeight={900} color="#fff" letterSpacing="-1px" mb={0.5}>
              Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.55)" }}>
              Welcome back! Here's how{" "}
              <Box component="span" sx={{ color: "#cddc39", fontWeight: 800 }}>Home Lift</Box>{" "}
              is performing for you.
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 200, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              startAdornment={<FilterList sx={{ mr: 1, color: "rgba(255,255,255,0.6)", fontSize: 18 }} />}
              sx={{
                borderRadius: 3,
                fontWeight: 700,
                color: "#fff",
                ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                ".MuiSvgIcon-root": { color: "rgba(255,255,255,0.6)" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.4)" },
              }}
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

        {timeRange === "custom" && (
          <Fade in>
            <Box sx={{ mt: 3, p: 2.5, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.15)" }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <TextField
                  type="date" label="Start Date" size="small"
                  InputLabelProps={{ shrink: true, sx: { color: "rgba(255,255,255,0.7)" } }}
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                  sx={{ flex: 1, "& input": { color: "#fff" }, "& fieldset": { borderColor: "rgba(255,255,255,0.3)" } }}
                />
                <TextField
                  type="date" label="End Date" size="small"
                  InputLabelProps={{ shrink: true, sx: { color: "rgba(255,255,255,0.7)" } }}
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                  sx={{ flex: 1, "& input": { color: "#fff" }, "& fieldset": { borderColor: "rgba(255,255,255,0.3)" } }}
                />
                <Button
                  variant="contained"
                  onClick={fetchStats}
                  sx={{ bgcolor: "#6366f1", color: "#fff", fontWeight: 700, borderRadius: 3, textTransform: "none", px: 4, "&:hover": { bgcolor: "#4f46e5" } }}
                >
                  Apply
                </Button>
              </Stack>
            </Box>
          </Fade>
        )}
      </HeroBanner>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Bookings" value={stats.total_bookings} icon={<BookOnline sx={{ fontSize: 40 }} />} color="#6366f1" delay={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Revenue" value={`₹${Number(stats.total_revenue).toLocaleString()}`} icon={<AccountBalanceWallet sx={{ fontSize: 40 }} />} color="#22c55e" subtitle="Earnings" delay={100} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Average Rating" value={stats.avg_rating} icon={<Star sx={{ fontSize: 40 }} />} color="#f59e0b" subtitle="Feedback Score" delay={200} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Customers" value={stats.active_customers} icon={<Group sx={{ fontSize: 40 }} />} color="#8b5cf6" delay={300} />
        </Grid>
      </Grid>

      {/* ── Charts ──────────────────────────────────────────────────── */}
      <Grid container spacing={3} mb={3}>
        {/* Area Chart */}
        <Grid item xs={12} xl={8}>
          <SectionCard elevation={0}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
              <Box sx={{ width: 4, height: 24, bgcolor: "#6366f1", borderRadius: 4 }} />
              <Typography variant="h6" fontWeight={800} color="#0f172a">Revenue & Performance</Typography>
            </Stack>
            <Box sx={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bookingData}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#gradRev)" dot={{ fill: "#6366f1", r: 4, strokeWidth: 2, stroke: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Grid>

        {/* Donut Chart */}
        <Grid item xs={12} xl={4}>
          <SectionCard elevation={0}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
              <Box sx={{ width: 4, height: 24, bgcolor: "#f59e0b", borderRadius: 4 }} />
              <Typography variant="h6" fontWeight={800} color="#0f172a">Booking Mix</Typography>
            </Stack>

            {/* Donut */}
            <Box sx={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="70%"
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {roleData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.15)",
                      boxShadow: "0 16px 32px rgba(0,0,0,0.15)",
                      padding: "10px 14px",
                      background: "rgba(15,12,41,0.92)",
                      backdropFilter: "blur(10px)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            {/* Custom Legend */}
            <Stack spacing={1} mt={1}>
              {(roleData || []).map((entry, idx) => {
                const total = roleData.reduce((s, d) => s + (d.value || 0), 0);
                const pct = total ? ((entry.value / total) * 100).toFixed(1) : 0;
                return (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1.5,
                      py: 1,
                      borderRadius: 3,
                      bgcolor: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      transition: "background 0.2s",
                      "&:hover": { bgcolor: "#f1f5f9" },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: COLORS[idx % COLORS.length],
                          boxShadow: `0 0 0 3px ${COLORS[idx % COLORS.length]}30`,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" fontWeight={600} color="#374151" noWrap>
                        {entry.name}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={800} color="#0f172a">
                        {entry.value}
                      </Typography>
                      <Box sx={{ px: 1, py: 0.2, bgcolor: `${COLORS[idx % COLORS.length]}18`, borderRadius: 10 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: COLORS[idx % COLORS.length] }}>
                          {pct}%
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 6,
          background: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          boxShadow: "0 24px 48px rgba(15,12,41,0.2)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: -40, right: -40,
            width: 200, height: 200,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.15)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ zIndex: 1 }}>
          <Typography variant="h4" fontWeight={900} mb={0.5}>Maximize your earnings!</Typography>
          <Typography variant="body1" sx={{ opacity: 0.7 }}>
            Review and accept new job requests to expand your reach today.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => window.location.href = "/provider/job-requests"}
          endIcon={<ArrowForward />}
          sx={{
            bgcolor: "#cddc39",
            color: "#1a2400",
            px: 5, py: 2,
            borderRadius: 4,
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 800,
            boxShadow: "0 8px 24px rgba(205,220,57,0.4)",
            "&:hover": { bgcolor: "#d4e157", transform: "translateY(-2px)", boxShadow: "0 12px 32px rgba(205,220,57,0.5)" },
            transition: "all 0.3s",
            zIndex: 1,
            flexShrink: 0,
          }}
        >
          Go to Job Requests
        </Button>
      </Paper>
    </Box>
  );
}
