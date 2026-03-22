import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyAppointments } from "../../redux/slices/provider/providerJobSlice";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Stack,
  IconButton,
  TextField,
  InputAdornment,
  Skeleton,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BuildIcon from "@mui/icons-material/Build";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NoteIcon from "@mui/icons-material/Note";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const STATUS_COLOR = {
  completed: "success",
  cancelled: "error",
  confirmed: "info",
  in_progress: "warning",
  pending: "default",
};

const COMMISSION_RATE = 0.07;
const MAX_COMMISSION = 500;

const calcEarnings = (price) => {
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

// ---------- Detail Dialog ----------
const JobDetailDialog = ({ job, open, onClose }) => {
  if (!job) return null;
  const earnings = calcEarnings(job.price);
  const commission = (Number(job.price) - Number(earnings)).toFixed(2);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WorkHistoryIcon color="primary" />
          <Typography fontWeight="bold">Job Details — #{job.id}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {/* Status */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip
              label={job.status?.replace("_", " ").toUpperCase()}
              color={STATUS_COLOR[job.status] || "default"}
              size="small"
              variant="filled"
            />
          </Box>

          {/* Service */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <BuildIcon fontSize="small" color="primary" />
            <Box>
              <Typography variant="caption" color="text.secondary">Service</Typography>
              <Typography fontWeight="bold">{job.service_name}</Typography>
              {job.category_name && (
                <Typography variant="caption" color="text.secondary">{job.category_name}</Typography>
              )}
            </Box>
          </Box>

          {/* Date & Time */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CalendarMonthIcon fontSize="small" color="primary" />
            <Box>
              <Typography variant="caption" color="text.secondary">Scheduled</Typography>
              <Typography fontWeight="medium">
                {formatDate(job.booking_date)} at {formatTime(job.booking_time)}
              </Typography>
            </Box>
          </Box>

          {/* Customer */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PersonIcon fontSize="small" color="primary" />
            <Box>
              <Typography variant="caption" color="text.secondary">Customer</Typography>
              <Typography fontWeight="medium">{job.full_name}</Typography>
            </Box>
          </Box>

          {/* Phone */}
          {job.phone && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <PhoneIcon fontSize="small" color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">Phone</Typography>
                <Typography fontWeight="medium">{job.phone}</Typography>
              </Box>
            </Box>
          )}

          {/* Address */}
          {job.address_details && (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <LocationOnIcon fontSize="small" color="primary" sx={{ mt: 0.3 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Address</Typography>
                <Typography fontWeight="medium">
                  {[job.address_details.address_line1, job.address_details.city, job.address_details.state, job.address_details.pincode]
                    .filter(Boolean).join(", ")}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Notes */}
          {job.notes && (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <NoteIcon fontSize="small" color="primary" sx={{ mt: 0.3 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Notes</Typography>
                <Typography variant="body2">{job.notes}</Typography>
              </Box>
            </Box>
          )}

          {/* Customer Review */}
          {job.review && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <StarIcon fontSize="small" color="primary" sx={{ mt: 0.3 }} />
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="text.secondary">Rating & Review</Typography>
                  <Rating value={job.review.rating} readOnly size="small" sx={{ display: 'block', mt: 0.5, mb: 0.5 }} />
                  {job.review.comment && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', bgcolor: '#f5f5f5', p: 1.5, borderRadius: 2 }}>
                      "{job.review.comment}"
                    </Typography>
                  )}
                </Box>
              </Box>
            </>
          )}

          <Divider />

          {/* Earnings breakdown */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: "#f8fffe" }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={1} color="success.dark">
              💰 Earnings Breakdown
            </Typography>
            <Stack spacing={0.5}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Job Price</Typography>
                <Typography variant="body2" fontWeight="medium">₹{Number(job.price).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Platform Fee (7%)</Typography>
                <Typography variant="body2" color="error.main">– ₹{commission}</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" fontWeight="bold">Your Earnings</Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">₹{earnings}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" fullWidth>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------- Job Card ----------
const JobCard = ({ job, onClick }) => {
  const earnings = calcEarnings(job.price);
  return (
    <Paper
      elevation={1}
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 3,
        cursor: "pointer",
        border: "1px solid #e0e0e0",
        transition: "all 0.25s ease",
        "&:hover": {
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          transform: "translateY(-2px)",
          borderColor: "#1976d2",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
            {job.service_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            #{job.id} · {job.category_name}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.8 }}>
          <Chip
            label={job.status?.replace("_", " ")}
            color={STATUS_COLOR[job.status] || "default"}
            size="small"
            variant="outlined"
          />
          {job.review && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, bgcolor: "grey.100", px: 1, py: 0.2, borderRadius: 1 }}>
              <StarIcon sx={{ fontSize: 14, color: "#faaf00" }} />
              <Typography variant="caption" fontWeight="bold">
                {job.review.rating}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Stack spacing={0.6} mb={1.5}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
          <PersonIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">{job.full_name}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
          <CalendarMonthIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            {formatDate(job.booking_date)} · {formatTime(job.booking_time)}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Job Price</Typography>
          <Typography variant="body1" fontWeight="bold">₹{Number(job.price).toFixed(0)}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary">Your Earnings</Typography>
          <Typography variant="body1" fontWeight="bold" color="success.main">₹{earnings}</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// ---------- Skeleton Loader ----------
const HistorySkeleton = () => (
  <Grid container spacing={2}>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
        <Paper elevation={1} sx={{ p: 2.5, borderRadius: 3 }}>
          <Skeleton variant="text" width="70%" height={28} />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" sx={{ mt: 1 }} />
          <Skeleton variant="text" width="50%" />
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="30%" />
          </Box>
        </Paper>
      </Grid>
    ))}
  </Grid>
);

// ---------- Stat Card ----------
const StatCard = ({ icon, label, value, color }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e0e0e0", height: "100%" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar sx={{ bgcolor: `${color}.light`, width: 44, height: 44 }}>
        {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 22 } })}
      </Avatar>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h6" fontWeight="bold">{value}</Typography>
      </Box>
    </Box>
  </Paper>
);

// ---------- Main Page ----------
const History = () => {
  const dispatch = useDispatch();
  const { myAppointments, myAppointmentsLoading } = useSelector((state) => state.providerJobs);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [filter, setFilter] = useState("all");
  const [starFilter, setStarFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchMyAppointments());
  }, [dispatch]);

  // Only show completed + cancelled for history
  const historyJobs = (myAppointments || []).filter((j) =>
    ["completed", "cancelled"].includes(j.status)
  );

  const filtered = historyJobs.filter((j) => {
    const matchSearch =
      !search ||
      j.service_name?.toLowerCase().includes(search.toLowerCase()) ||
      j.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      String(j.id).includes(search);
    const matchFilter = filter === "all" || j.status === filter;
    let matchStars = true;
    if (starFilter !== "all") {
      if (starFilter === "unrated") matchStars = !j.review;
      else matchStars = j.review && String(j.review.rating) === String(starFilter);
    }
    return matchSearch && matchFilter && matchStars;
  });

  // Summary stats
  const completed = historyJobs.filter((j) => j.status === "completed");
  const totalEarnings = completed.reduce((sum, j) => sum + parseFloat(calcEarnings(j.price)), 0);
  const totalJobs = completed.length;
  const avgEarning = totalJobs ? (totalEarnings / totalJobs).toFixed(0) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Job History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All your completed and cancelled service jobs with earnings breakdown
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ mb: 6 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              icon={<CheckCircleOutlineIcon />}
              label="Completed Jobs"
              value={totalJobs}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              icon={<AccountBalanceWalletIcon />}
              label="Total Earnings"
              value={`₹${totalEarnings.toFixed(0)}`}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              icon={<AttachMoneyIcon />}
              label="Avg. Per Job"
              value={`₹${avgEarning}`}
              color="warning"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search by service, customer, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={1}>
          {["all", "completed", "cancelled"].map((s) => (
            <Chip
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              variant={filter === s ? "filled" : "outlined"}
              color={filter === s ? (s === "cancelled" ? "error" : s === "completed" ? "success" : "primary") : "default"}
              onClick={() => setFilter(s)}
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Stack>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Rating Filter</InputLabel>
          <Select
            label="Rating Filter"
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
            sx={{ borderRadius: 8 }}
          >
            <MenuItem value="all">All Ratings</MenuItem>
            <MenuItem value="5">⭐⭐⭐⭐⭐</MenuItem>
            <MenuItem value="4">⭐⭐⭐⭐</MenuItem>
            <MenuItem value="3">⭐⭐⭐</MenuItem>
            <MenuItem value="2">⭐⭐</MenuItem>
            <MenuItem value="1">⭐</MenuItem>
            <MenuItem value="unrated">No Review</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Job Grid */}
      {myAppointmentsLoading ? (
        <HistorySkeleton />
      ) : filtered.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            border: "1px dashed #ccc",
          }}
        >
          <WorkHistoryIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary">
            No history found
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {search ? "Try a different search term." : "Your completed jobs will appear here."}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((job) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={job.id}>
              <JobCard job={job} onClick={() => setSelectedJob(job)} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail Dialog */}
      <JobDetailDialog
        job={selectedJob}
        open={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
      />
    </Box>
  );
};

export default History;
