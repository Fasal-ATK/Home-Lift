// src/pages/provider/JobRequests.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  Pagination,
  Chip,
  Tooltip,
  Badge,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MapIcon from "@mui/icons-material/Map";
import CloseIcon from "@mui/icons-material/Close";
import WorkIcon from "@mui/icons-material/Work";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/common/Loader";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { keyframes } from "@mui/material/styles";
import {
  fetchProviderJobs,
  fetchMyAppointments,
  acceptJob,
  jobsSelectors,
  selectProviderLoading,
  selectProviderTotalCount,
  selectAcceptingIds,
  selectMyAppointments,
} from "../../redux/slices/provider/providerJobSlice";
import useDebounce from "../../hooks/useDebounce";

// ─── helpers ─────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

// Avatar color palette
const AVATAR_COLORS = [
  ["#4f46e5", "#a5b4fc"],
  ["#0891b2", "#67e8f9"],
  ["#059669", "#6ee7b7"],
  ["#d97706", "#fde68a"],
  ["#dc2626", "#fca5a5"],
  ["#7c3aed", "#c4b5fd"],
];
const avatarColor = (name = "") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─── component ───────────────────────────────────────────────────────────────
export default function ProviderRequestsWithServices() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const jobs         = useSelector((s) => jobsSelectors.selectAll(s)) || [];
  const loading      = useSelector(selectProviderLoading);
  const acceptingIds = useSelector(selectAcceptingIds);
  const totalItems   = useSelector(selectProviderTotalCount);
  const myAppointments = useSelector(selectMyAppointments) || [];

  const [search, setSearch]               = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [snack, setSnack]                 = useState({ open: false, message: "", severity: "info" });
  const [page, setPage]                   = useState(1);
  const [selectedService, setSelectedService] = useState("All Services");
  const perPage = 20;

  useEffect(() => {
    dispatch(fetchProviderJobs({ page, search: debouncedSearch, service: selectedService }));
    dispatch(fetchMyAppointments({ no_pagination: true }));
  }, [dispatch, page, selectedService, debouncedSearch]);

  // overlap check
  const checkOverlap = (booking) => {
    if (!booking.booking_date || !booking.booking_time) return false;
    const durationMins = booking.service_duration || 60;
    const bStart = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const bEnd = new Date(bStart.getTime() + durationMins * 60000);
    return myAppointments.some((mine) => {
      if (!mine.booking_date || !mine.booking_time || mine.id === booking.id) return false;
      if (!["confirmed", "in_progress"].includes(mine.status)) return false;
      if (mine.booking_date !== booking.booking_date) return false;
      const mDuration = mine.service_duration || 60;
      const mStart = new Date(`${mine.booking_date}T${mine.booking_time}`);
      const mEnd = new Date(mStart.getTime() + mDuration * 60000);
      return bStart < mEnd && bEnd > mStart;
    });
  };

  const serviceList = useMemo(() => {
    const arr = (jobs || []).map((d) => d.service_name || d.service?.name || "Service");
    return ["All Services", ...Array.from(new Set(arr))];
  }, [jobs]);

  const paginated   = jobs;
  const totalPages  = Math.max(1, Math.ceil(totalItems / perPage));
  const isAccepting = (id) => acceptingIds.map(String).includes(String(id));

  const handleAccept = async (id) => {
    try {
      const result = await dispatch(acceptJob(Number(id)));
      if (acceptJob.fulfilled.match(result)) {
        setSnack({ open: true, message: `Job #${id} accepted!`, severity: "success" });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        const msg = result.payload?.error || result.payload?.message || "Failed to accept job";
        setSnack({ open: true, message: msg, severity: "error" });
      }
    } catch (err) {
      setSnack({ open: true, message: err?.message || "Failed to accept job", severity: "error" });
    }
  };

  const handleView  = (booking) => navigate(`details/${booking.id}`, { state: { booking } });
  const closeSnack  = () => setSnack((s) => ({ ...s, open: false }));

  // count per service
  const svcCount = useMemo(() => {
    const map = {};
    (jobs || []).forEach((j) => {
      const n = j.service_name || j.service?.name || "Service";
      map[n] = (map[n] || 0) + 1;
    });
    return map;
  }, [jobs]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8f9fc" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <Box
          component="aside"
          sx={{
            width: { xs: "100%", md: 260 },
            flexShrink: 0,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)",
              borderRadius: 4,
              p: 3,
              mb: 2,
              color: "#fff",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
              <WorkIcon sx={{ color: "#a78bfa" }} />
              <Typography variant="h6" fontWeight={800}>Job Requests</Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>
              {totalItems} total available
            </Typography>
          </Box>

          {/* Service filter list */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: "#fff",
              border: "1px solid #e8ecf0",
              borderRadius: 4,
              p: 2,
              overflow: "hidden",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5} px={0.5}>
              <FilterListIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8}>
                Filter by Service
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              {serviceList.map((svc) => {
                const active = svc === selectedService;
                const count  = svc === "All Services" ? totalItems : (svcCount[svc] || 0);
                return (
                  <Box
                    key={svc}
                    onClick={() => { setSelectedService(svc); setPage(1); }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1.5,
                      py: 1.2,
                      borderRadius: 3,
                      cursor: "pointer",
                      bgcolor: active ? "#0f172a" : "transparent",
                      transition: "all 0.2s",
                      "&:hover": { bgcolor: active ? "#0f172a" : "#f1f5f9" },
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: active ? "#a78bfa" : "#374151", fontSize: 13 }}
                    >
                      {svc}
                    </Typography>
                    <Chip
                      label={count}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        bgcolor: active ? "rgba(167,139,250,0.2)" : "#f1f5f9",
                        color:  active ? "#a78bfa" : "#64748b",
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Box>

        {/* ── Main content ─────────────────────────────────────────── */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Topbar */}
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} mb={3} spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
                {selectedService === "All Services" ? "All Job Requests" : selectedService}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedService === "All Services"
                  ? "Review and accept available requests"
                  : `Requests for ${selectedService}`}
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search by name, city, service…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch("")}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { borderRadius: 3, bgcolor: "#fff", fontSize: 14 },
              }}
              sx={{ width: { xs: "100%", sm: 320 } }}
            />
          </Stack>

          {/* Cards */}
          {loading ? (
            <Loader message="Fetching job requests…" sx={{ py: 8 }} />
          ) : paginated.length === 0 ? (
            <Paper
              elevation={0}
              sx={{ p: 8, textAlign: "center", borderRadius: 4, border: "2px dashed #e2e8f0", bgcolor: "#fff" }}
            >
              <WorkIcon sx={{ fontSize: 52, color: "#cbd5e1", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>No requests found</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {search ? "Try a different search term" : "Check back later for new requests"}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2.5}>
              <AnimatePresence>
                {paginated.map((r, i) => {
                  const hasOverlap  = checkOverlap(r);
                  const name        = r.customer_name || r.user?.username || "Customer";
                  const [bg, text]  = avatarColor(name);
                  const accepting   = isAccepting(r.id);

                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: i * 0.04, duration: 0.35 }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          bgcolor: "#fff",
                          border: `1px solid ${hasOverlap ? "#fecaca" : "#e8ecf0"}`,
                          borderRadius: 4,
                          p: 0,
                          overflow: "hidden",
                          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 16px 40px rgba(0,0,0,0.07)",
                            borderColor: hasOverlap ? "#f87171" : "#6366f1",
                          },
                        }}
                      >
                        {/* Top accent line */}
                        <Box sx={{ height: 3, background: hasOverlap ? "linear-gradient(90deg,#ef4444,#f97316)" : "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />

                        <Box sx={{ p: 3 }}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2.5}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            justifyContent="space-between"
                          >
                            {/* Left: info */}
                            <Stack direction="row" spacing={2} alignItems="flex-start" flex={1}>
                              <Avatar
                                sx={{
                                  bgcolor: bg,
                                  color: text,
                                  width: 52,
                                  height: 52,
                                  fontWeight: 800,
                                  fontSize: "1.1rem",
                                  flexShrink: 0,
                                  boxShadow: `0 4px 12px ${bg}55`,
                                }}
                              >
                                {name.charAt(0).toUpperCase()}
                              </Avatar>

                              <Box flex={1}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0f172a" }}>
                                    {name}
                                  </Typography>
                                  <Chip
                                    label={r.service_name || r.service?.name}
                                    size="small"
                                    sx={{
                                      bgcolor: "#ede9fe",
                                      color: "#6366f1",
                                      fontWeight: 700,
                                      fontSize: 11,
                                      height: 22,
                                    }}
                                  />
                                  {hasOverlap && (
                                    <Chip
                                      icon={<WarningAmberIcon sx={{ fontSize: 12, color: "#ef4444 !important" }} />}
                                      label="Schedule Conflict"
                                      size="small"
                                      sx={{ bgcolor: "#fee2e2", color: "#ef4444", fontWeight: 700, fontSize: 11, height: 22 }}
                                    />
                                  )}
                                </Stack>

                                {/* Meta row */}
                                <Stack direction="row" spacing={2} mt={0.8} flexWrap="wrap">
                                  {(r.city || r.address?.city) && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                      <MapIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        {r.address?.city || r.city}
                                      </Typography>
                                    </Stack>
                                  )}
                                  {r.booking_date && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                      <CalendarTodayIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        {formatDate(r.booking_date)}
                                      </Typography>
                                    </Stack>
                                  )}
                                  {r.booking_time && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                      <AccessTimeIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        {formatTime(r.booking_time)}
                                      </Typography>
                                    </Stack>
                                  )}
                                  <Box
                                    sx={{
                                      px: 1.5,
                                      py: 0.25,
                                      bgcolor: "#f0fdf4",
                                      color: "#16a34a",
                                      borderRadius: 10,
                                      fontWeight: 800,
                                      fontSize: 12,
                                    }}
                                  >
                                    ₹{r.price}
                                  </Box>
                                </Stack>

                                {/* Notes */}
                                {r.notes && (
                                  <Box
                                    sx={{
                                      mt: 1.5,
                                      px: 2,
                                      py: 1,
                                      bgcolor: "#f8fafc",
                                      borderRadius: 2,
                                      borderLeft: "3px solid #6366f1",
                                    }}
                                  >
                                    <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                      "{r.notes}"
                                    </Typography>
                                  </Box>
                                )}

                                {/* Map link */}
                                {(r.address || r.city) && (
                                  <Button
                                    size="small"
                                    variant="text"
                                    startIcon={<MapIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                      mt: 1,
                                      textTransform: "none",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#6366f1",
                                      p: 0,
                                      minWidth: "auto",
                                      "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const lat = r.address?.latitude;
                                      const lng = r.address?.longitude;
                                      const url =
                                        lat && lng
                                          ? `https://www.google.com/maps?q=${lat},${lng}`
                                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                              r.address?.address_line
                                                ? `${r.address.address_line}, ${r.address.city}, ${r.address.state || ""} ${r.address.postal_code || ""}`
                                                : typeof r.address === "string" ? r.address : r.city
                                            )}`;
                                      window.open(url, "_blank", "noopener,noreferrer");
                                    }}
                                  >
                                    {r.address?.latitude && r.address?.longitude ? "Open in Maps" : "Search in Maps"}
                                  </Button>
                                )}
                              </Box>
                            </Stack>

                            {/* Right: actions */}
                            <Stack
                              direction={{ xs: "row", sm: "column" }}
                              spacing={1.5}
                              sx={{ width: { xs: "100%", sm: "auto" }, minWidth: 140 }}
                            >
                              <Button
                                variant="outlined"
                                size="medium"
                                startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                                onClick={() => handleView(r)}
                                sx={{
                                  flex: { xs: 1, sm: "none" },
                                  borderColor: "#e2e8f0",
                                  color: "#475569",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  textTransform: "none",
                                  borderRadius: 3,
                                  "&:hover": { borderColor: "#6366f1", color: "#6366f1", bgcolor: "#ede9fe" },
                                }}
                              >
                                View Details
                              </Button>

                              <Button
                                variant="contained"
                                size="medium"
                                startIcon={accepting ? null : <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
                                onClick={() => handleAccept(r.id)}
                                disabled={accepting}
                                sx={{
                                  flex: { xs: 1, sm: "none" },
                                  background: "linear-gradient(135deg, #cddc39, #d4e157)",
                                  color: "#1a2400",
                                  fontWeight: 800,
                                  fontSize: 13,
                                  textTransform: "none",
                                  borderRadius: 3,
                                  boxShadow: "0 4px 14px rgba(205,220,57,0.4)",
                                  "&:hover": {
                                    background: "linear-gradient(135deg, #d4e157, #dcef62)",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 8px 20px rgba(205,220,57,0.5)",
                                  },
                                  "&:disabled": { bgcolor: "#f1f5f9", color: "#94a3b8" },
                                  transition: "all 0.2s",
                                }}
                              >
                                {accepting ? <CircularProgress size={18} sx={{ color: "#64748b" }} /> : "Accept"}
                              </Button>
                            </Stack>
                          </Stack>
                        </Box>
                      </Paper>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Stack>
          )}

          {/* Pagination */}
          {paginated.length > 0 && totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, val) => setPage(val)}
                shape="rounded"
                sx={{
                  "& .MuiPaginationItem-root": {
                    borderRadius: 2,
                    fontWeight: 700,
                  },
                  "& .Mui-selected": {
                    bgcolor: "#0f172a !important",
                    color: "#fff",
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Stack>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={closeSnack} variant="filled" sx={{ borderRadius: 3, fontWeight: 600 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
