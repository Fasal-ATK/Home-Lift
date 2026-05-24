import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { bookingService } from "../../services/apiServices";
import { fetchMyAppointments } from "../../redux/slices/provider/providerJobSlice";
import {
  Box, Typography, Grid, Paper, Chip, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Avatar, Stack, IconButton,
  TextField, InputAdornment, Skeleton, Rating, FormControl,
  InputLabel, Select, MenuItem, Container,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BuildIcon from "@mui/icons-material/Build";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NoteIcon from "@mui/icons-material/Note";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// ─── animations ──────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── constants ───────────────────────────────────────────────────────────────
const COMMISSION_RATE = 0.07;
const MAX_COMMISSION  = 500;
const calcEarnings    = (price) => {
  const p = Number(price) || 0;
  const commission = Math.min(p * COMMISSION_RATE, MAX_COMMISSION);
  return (p - commission).toFixed(2);
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const formatTime = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const STATUS_CONFIG = {
  completed: { color: "#22c55e", bg: "#f0fdf4", label: "Completed" },
  cancelled:  { color: "#ef4444", bg: "#fff5f5", label: "Cancelled"  },
  confirmed:  { color: "#3b82f6", bg: "#eff6ff", label: "Confirmed"  },
  in_progress:{ color: "#f59e0b", bg: "#fffbeb", label: "In Progress"},
};

// ─── styled ──────────────────────────────────────────────────────────────────
const HeroWrap = styled(Box)(() => ({
  background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  borderRadius: 24,
  padding: "36px 32px",
  marginBottom: 32,
  position: "relative",
  overflow: "hidden",
  animation: `${fadeUp} 0.5s ease both`,
  "&::before": {
    content: '""',
    position: "absolute",
    top: -60, right: -60,
    width: 240, height: 240,
    borderRadius: "50%",
    background: "rgba(99,102,241,0.1)",
    pointerEvents: "none",
  },
}));

const GlassStat = styled(Box)(() => ({
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: "20px 24px",
  textAlign: "center",
  transition: "transform 0.2s",
  "&:hover": { transform: "translateY(-3px)", background: "rgba(255,255,255,0.11)" },
}));

const JobCard = styled(Paper)(({ status }) => ({
  border: `1px solid ${STATUS_CONFIG[status]?.color ?? "#e8ecf0"}22`,
  borderRadius: 20,
  overflow: "hidden",
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
  animation: `${fadeUp} 0.4s ease both`,
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: `0 20px 40px ${STATUS_CONFIG[status]?.color ?? "#6366f1"}18`,
    borderColor: STATUS_CONFIG[status]?.color ?? "#6366f1",
  },
}));

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const JobDetailDialog = ({ job, open, onClose }) => {
  const navigate = useNavigate();
  if (!job) return null;
  const earnings   = calcEarnings(job.price);
  const commission = (Number(job.price) - Number(earnings)).toFixed(2);
  const cfg = STATUS_CONFIG[job.status] ?? { color: "#64748b", bg: "#f8fafc", label: job.status };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}>
      {/* Accent bar */}
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }} />

      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <WorkHistoryIcon sx={{ color: cfg.color }} />
          <Box>
            <Typography fontWeight={800}>Job #{job.id}</Typography>
            <Typography variant="caption" color="text.secondary">{formatDate(job.booking_date)}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={cfg.label}
            size="small"
            sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, border: `1px solid ${cfg.color}40` }}
          />
          <IconButton onClick={onClose} size="small"><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2.5}>
          {/* Service */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: "#ede9fe", width: 36, height: 36 }}>
              <BuildIcon sx={{ fontSize: 18, color: "#6366f1" }} />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Service</Typography>
              <Typography fontWeight={800}>{job.service_name}</Typography>
              {job.category_name && <Typography variant="caption" color="text.secondary">{job.category_name}</Typography>}
            </Box>
          </Stack>

          {/* Date */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "#e0f2fe", width: 36, height: 36 }}>
              <CalendarMonthIcon sx={{ fontSize: 18, color: "#0284c7" }} />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Scheduled</Typography>
              <Typography fontWeight={700}>{formatDate(job.booking_date)} at {formatTime(job.booking_time)}</Typography>
            </Box>
          </Stack>

          {/* Customer */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "#fef3c7", width: 36, height: 36 }}>
              <PersonIcon sx={{ fontSize: 18, color: "#d97706" }} />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Customer</Typography>
              <Typography fontWeight={700}>{job.full_name}</Typography>
            </Box>
          </Stack>

          {/* Phone */}
          {job.phone && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "#dcfce7", width: 36, height: 36 }}>
                <PhoneIcon sx={{ fontSize: 18, color: "#16a34a" }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Phone</Typography>
                <Typography fontWeight={700}>{job.phone}</Typography>
              </Box>
            </Stack>
          )}

          {/* Address */}
          {job.address_details && (
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: "#fce7f3", width: 36, height: 36 }}>
                <LocationOnIcon sx={{ fontSize: 18, color: "#db2777" }} />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Address</Typography>
                <Typography fontWeight={600} variant="body2">
                  {[job.address_details.address_line1, job.address_details.city, job.address_details.state, job.address_details.pincode]
                    .filter(Boolean).join(", ")}
                </Typography>
              </Box>
            </Stack>
          )}

          {/* Notes */}
          {job.notes && (
            <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 3, borderLeft: "3px solid #6366f1" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Notes</Typography>
              <Typography variant="body2" fontStyle="italic" mt={0.5}>"{job.notes}"</Typography>
            </Box>
          )}

          {/* Review */}
          {job.review && (
            <>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>Customer Review</Typography>
                <Rating value={job.review.rating} readOnly size="small" />
                {job.review.comment && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: "#f8fafc", borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      "{job.review.comment}"
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}

          <Divider />

          {/* Earnings Breakdown */}
          <Box sx={{ p: 2.5, background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius: 3, border: "1px solid #bbf7d0" }}>
            <Typography variant="subtitle2" fontWeight={800} color="#16a34a" mb={1.5}>
              💰 Earnings Breakdown
            </Typography>
            <Stack spacing={0.8}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Job Price</Typography>
                <Typography variant="body2" fontWeight={700}>₹{Number(job.price).toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Platform Fee (7%)</Typography>
                <Typography variant="body2" fontWeight={700} color="error.main">– ₹{commission}</Typography>
              </Stack>
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={800}>Your Earnings</Typography>
                <Typography variant="body2" fontWeight={800} color="#16a34a">₹{earnings}</Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<ChatBubbleOutlineIcon />}
          onClick={async () => {
            try {
              const res = await bookingService.initiateChat(job.user, job.id);
              navigate("/provider/chat", { state: { roomId: res.id } });
            } catch (err) {
              alert(err.response?.data?.detail || err.message || "Failed to start chat.");
            }
          }}
          sx={{
            bgcolor: "#0f172a", color: "#fff", fontWeight: 700, borderRadius: 3,
            textTransform: "none", "&:hover": { bgcolor: "#1e293b" },
          }}
        >
          Chat with Customer
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth
          sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── History Card ─────────────────────────────────────────────────────────────
const HistoryCard = ({ job, idx, onClick }) => {
  const earnings = calcEarnings(job.price);
  const cfg = STATUS_CONFIG[job.status] ?? { color: "#64748b", bg: "#f8fafc", label: job.status };

  return (
    <JobCard elevation={0} status={job.status} onClick={onClick} sx={{ animationDelay: `${idx * 0.05}s` }}>
      <Box sx={{ height: 4, background: cfg.color }} />
      <Box sx={{ p: 2.5 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2} color="#0f172a">
              {job.service_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              #{job.id} · {job.category_name}
            </Typography>
          </Box>
          <Stack spacing={0.5} alignItems="flex-end">
            <Chip
              label={cfg.label}
              size="small"
              sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11, border: `1px solid ${cfg.color}40` }}
            />
            {job.review && (
              <Stack direction="row" spacing={0.3} alignItems="center" sx={{ bgcolor: "#fefce8", px: 1, py: 0.2, borderRadius: 10 }}>
                <StarIcon sx={{ fontSize: 12, color: "#f59e0b" }} />
                <Typography variant="caption" fontWeight={800} color="#92400e">{job.review.rating}</Typography>
              </Stack>
            )}
          </Stack>
        </Stack>

        <Stack spacing={0.6} mb={1.5}>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <PersonIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>{job.full_name}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <CalendarMonthIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
            <Typography variant="body2" color="text.secondary">
              {formatDate(job.booking_date)} · {formatTime(job.booking_time)}
            </Typography>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 1.5 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary">Job Price</Typography>
            <Typography variant="body1" fontWeight={800} color="#0f172a">₹{Number(job.price).toFixed(0)}</Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary">Your Earnings</Typography>
            <Typography variant="body1" fontWeight={800} color="#16a34a">₹{earnings}</Typography>
          </Box>
        </Stack>
      </Box>
    </JobCard>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const HistorySkeleton = () => (
  <Grid container spacing={2.5}>
    {[1,2,3,4,5,6].map((i) => (
      <Grid item xs={12} sm={6} md={4} key={i}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e8ecf0" }}>
          <Skeleton variant="text" width="70%" height={28} />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" sx={{ mt: 1 }} />
          <Skeleton variant="text" width="50%" />
          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" justifyContent="space-between">
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="30%" />
          </Stack>
        </Paper>
      </Grid>
    ))}
  </Grid>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const History = () => {
  const dispatch = useDispatch();
  const { myAppointments, myAppointmentsLoading } = useSelector((state) => state.providerJobs);
  const [search, setSearch]         = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [filter, setFilter]         = useState("all");
  const [starFilter, setStarFilter] = useState("all");

  useEffect(() => { dispatch(fetchMyAppointments()); }, [dispatch]);

  const historyJobs = (myAppointments || []).filter((j) => ["completed", "cancelled"].includes(j.status));

  const filtered = historyJobs.filter((j) => {
    const matchSearch = !search
      || j.service_name?.toLowerCase().includes(search.toLowerCase())
      || j.full_name?.toLowerCase().includes(search.toLowerCase())
      || String(j.id).includes(search);
    const matchFilter = filter === "all" || j.status === filter;
    let matchStars = true;
    if (starFilter !== "all") {
      if (starFilter === "unrated") matchStars = !j.review;
      else matchStars = j.review && String(j.review.rating) === String(starFilter);
    }
    return matchSearch && matchFilter && matchStars;
  });

  const completed    = historyJobs.filter((j) => j.status === "completed");
  const cancelled    = historyJobs.filter((j) => j.status === "cancelled");
  const totalEarnings= completed.reduce((s, j) => s + parseFloat(calcEarnings(j.price)), 0);
  const avgEarning   = completed.length ? (totalEarnings / completed.length).toFixed(0) : 0;
  const avgRating    = completed.filter((j) => j.review).length
    ? (completed.reduce((s, j) => s + (j.review?.rating || 0), 0) / completed.filter((j) => j.review).length).toFixed(1)
    : "—";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fc", py: 4 }}>
      <Container maxWidth="lg">
        {/* Hero Stats */}
        <HeroWrap>
          <Typography variant="h4" fontWeight={900} color="#fff" mb={0.5} letterSpacing="-0.5px">
            Job History
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", mb: 3 }}>
            All completed & cancelled jobs with full earnings breakdown
          </Typography>

          <Grid container spacing={2}>
            {[
              { label: "Completed", value: completed.length, icon: <CheckCircleOutlineIcon sx={{ color: "#4ade80" }} />, num: "#4ade80" },
              { label: "Cancelled",  value: cancelled.length,  icon: <CancelOutlinedIcon sx={{ color: "#f87171" }} />,       num: "#f87171" },
              { label: "Total Earned", value: `₹${totalEarnings.toFixed(0)}`, icon: <AccountBalanceWalletIcon sx={{ color: "#a78bfa" }} />, num: "#a78bfa" },
              { label: "Avg / Job",    value: `₹${avgEarning}`,              icon: <AttachMoneyIcon sx={{ color: "#fbbf24" }} />,           num: "#fbbf24" },
              { label: "Avg Rating",   value: avgRating,                     icon: <StarIcon sx={{ color: "#f59e0b" }} />,                   num: "#f59e0b" },
            ].map(({ label, value, icon, num }) => (
              <Grid item xs={6} sm={4} md key={label}>
                <GlassStat>
                  <Box mb={0.5}>{icon}</Box>
                  <Typography variant="h6" fontWeight={900} color="#fff">{value}</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{label}</Typography>
                </GlassStat>
              </Grid>
            ))}
          </Grid>
        </HeroWrap>

        {/* Filter Row */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 4, border: "1px solid #e8ecf0", bgcolor: "#fff" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
            <TextField
              size="small"
              placeholder="Search by service, customer or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "#94a3b8" }} /></InputAdornment>,
                sx: { borderRadius: 3, fontSize: 14 },
              }}
              sx={{ flexGrow: 1 }}
            />

            <Stack direction="row" spacing={1} flexShrink={0}>
              {["all", "completed", "cancelled"].map((s) => (
                <Chip
                  key={s}
                  label={s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  onClick={() => setFilter(s)}
                  sx={{
                    fontWeight: 700,
                    cursor: "pointer",
                    bgcolor: filter === s
                      ? s === "cancelled" ? "#ef4444" : s === "completed" ? "#22c55e" : "#0f172a"
                      : "#f1f5f9",
                    color: filter === s ? "#fff" : "#64748b",
                    "&:hover": { opacity: 0.9 },
                  }}
                />
              ))}
            </Stack>

            <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
              <Select
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value)}
                startAdornment={<FilterListIcon sx={{ mr: 1, fontSize: 16, color: "#94a3b8" }} />}
                sx={{ borderRadius: 3, fontSize: 14 }}
              >
                <MenuItem value="all">All Ratings</MenuItem>
                <MenuItem value="5">⭐⭐⭐⭐⭐ (5)</MenuItem>
                <MenuItem value="4">⭐⭐⭐⭐ (4)</MenuItem>
                <MenuItem value="3">⭐⭐⭐ (3)</MenuItem>
                <MenuItem value="2">⭐⭐ (2)</MenuItem>
                <MenuItem value="1">⭐ (1)</MenuItem>
                <MenuItem value="unrated">No Review</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Jobs Grid */}
        {myAppointmentsLoading ? (
          <HistorySkeleton />
        ) : filtered.length === 0 ? (
          <Paper elevation={0} sx={{ p: 8, textAlign: "center", borderRadius: 4, border: "2px dashed #e2e8f0", bgcolor: "#fff" }}>
            <WorkHistoryIcon sx={{ fontSize: 56, color: "#cbd5e1", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>No history found</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {search ? "Try a different search term." : "Your completed jobs will appear here."}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {filtered.map((job, idx) => (
              <Grid item xs={12} sm={6} md={4} key={job.id}>
                <HistoryCard job={job} idx={idx} onClick={() => setSelectedJob(job)} />
              </Grid>
            ))}
          </Grid>
        )}

        <JobDetailDialog job={selectedJob} open={Boolean(selectedJob)} onClose={() => setSelectedJob(null)} />
      </Container>
    </Box>
  );
};

export default History;
