// src/components/provider/jobRequests/ProviderJobDetials.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import HomeIcon from "@mui/icons-material/Home";
import NotesIcon from "@mui/icons-material/Notes";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BuildIcon from "@mui/icons-material/Build";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import TimerIcon from "@mui/icons-material/Timer";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Loader from "../../common/Loader";
import { useDispatch, useSelector } from "react-redux";
import {
  jobsSelectors,
  fetchJobDetail,
  acceptJob,
  fetchMyAppointments,
  selectAcceptingIds,
  selectMyAppointments,
  updateBookingStatus,
} from "../../../redux/slices/provider/providerJobSlice";

// ─── Status configuration ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "#b45309",
    bg: "#fef3c7",
    border: "#fde68a",
    icon: <HourglassEmptyIcon sx={{ fontSize: 14 }} />,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  },
  confirmed: {
    label: "Confirmed",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  },
  in_progress: {
    label: "In Progress",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    icon: <BuildIcon sx={{ fontSize: 14 }} />,
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
  },
  completed: {
    label: "Completed",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: <DoneAllIcon sx={{ fontSize: 14 }} />,
    gradient: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#b91c1c",
    bg: "#fff1f2",
    border: "#fecdd3",
    icon: <WarningAmberIcon sx={{ fontSize: 14 }} />,
    gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
  },
};

// ─── Info row helper ──────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, valueColor }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          mt: 0.2,
          color: "text.secondary",
          display: "flex",
          alignItems: "center",
          minWidth: 20,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.4 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} color={valueColor || "text.primary"} sx={{ mt: 0.1 }}>
          {value || "—"}
        </Typography>
      </Box>
    </Stack>
  );
}

// ─── Section card helper ──────────────────────────────────────────────────────
function SectionCard({ title, icon, children, accentColor = "#6366f1" }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1.5px solid",
        borderColor: "grey.100",
        borderRadius: 3,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.07)" },
      }}
    >
      {/* Section header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          background: `linear-gradient(90deg, ${accentColor}12 0%, transparent 100%)`,
          borderBottom: "1.5px solid",
          borderColor: "grey.100",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box sx={{ color: accentColor, display: "flex" }}>{icon}</Box>
        <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ letterSpacing: 0.3 }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProviderJobDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const initialBooking = location.state?.booking || null;
  const bookingFromStore = useSelector((s) => jobsSelectors.selectById(s, Number(id)));

  const [booking, setBooking] = useState(initialBooking || bookingFromStore || null);
  const [loading, setLoading] = useState(!initialBooking && !bookingFromStore);
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const acceptingIds = useSelector(selectAcceptingIds);
  const isAccepting = acceptingIds.map(String).includes(String(id));

  useEffect(() => {
    if (bookingFromStore) {
      setBooking(bookingFromStore);
      setLoading(false);
    }
  }, [bookingFromStore]);

  useEffect(() => {
    let mounted = true;
    if (initialBooking || bookingFromStore) return;

    setLoading(true);
    setError(null);

    dispatch(fetchMyAppointments({ no_pagination: true }));
    dispatch(fetchJobDetail(Number(id)))
      .unwrap()
      .then((res) => { if (mounted) setBooking(res); })
      .catch((err) => { if (mounted) setError(err?.message || err || "Unable to load booking"); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [id, initialBooking, bookingFromStore, dispatch]);

  const myAppointments = useSelector(selectMyAppointments) || [];

  const hasOverlap = useMemo(() => {
    if (!booking?.booking_date || !booking?.booking_time) return false;
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
  }, [booking, myAppointments]);

  const goBack = () => navigate(-1);

  const onAccept = async () => {
    try {
      const action = await dispatch(acceptJob(Number(id)));
      if (acceptJob.fulfilled.match(action)) {
        setSnack({ open: true, message: "Job accepted successfully!", severity: "success" });
        if (action.payload?.data) setBooking(action.payload.data);
        setTimeout(() => { window.location.href = "/provider/job-requests"; }, 1200);
      } else {
        const msg = action.payload?.error || action.payload?.message || (typeof action.payload === "string" ? action.payload : "Failed to accept job");
        setSnack({ open: true, message: msg, severity: "error" });
      }
    } catch (err) {
      setSnack({ open: true, message: err?.message || "Failed to accept job", severity: "error" });
    }
  };

  const onStart = async () => {
    setStarting(true);
    try {
      const action = await dispatch(updateBookingStatus({ id, status: "in_progress" }));
      if (updateBookingStatus.fulfilled.match(action)) {
        setSnack({ open: true, message: "Job started!", severity: "success" });
      } else {
        setSnack({ open: true, message: action.payload || "Failed to start job", severity: "error" });
      }
    } catch (err) {
      setSnack({ open: true, message: "An error occurred while starting the job", severity: "error" });
    } finally { setStarting(false); }
  };

  const onComplete = async () => {
    setCompleting(true);
    try {
      const action = await dispatch(updateBookingStatus({ id, status: "completed" }));
      if (updateBookingStatus.fulfilled.match(action)) {
        setSnack({ open: true, message: "Job marked as completed!", severity: "success" });
      } else {
        setSnack({ open: true, message: action.payload || "Failed to complete job", severity: "error" });
      }
    } catch (err) {
      setSnack({ open: true, message: "An error occurred while completing the job", severity: "error" });
    } finally { setCompleting(false); }
  };

  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  // ── Loading / Error / Empty states ──
  if (loading) {
    return <Box sx={{ p: 4, mt: 4 }}><Loader message="Loading job details..." /></Box>;
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mb: 2, textTransform: "none" }}>Back</Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>Error: {String(error)}</Alert>
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mb: 2, textTransform: "none" }}>Back</Button>
        <Alert severity="info" sx={{ borderRadius: 2 }}>No booking data available.</Alert>
      </Box>
    );
  }

  // ── Derived values ──
  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const serviceName = booking.service_name || booking.service?.name || "Service";
  const customer = booking.customer_name || booking.user?.username || booking.user?.email || "Customer";
  const addressText =
    booking.address_details?.line1 ||
    booking.address ||
    `${booking.address_details?.address_line || ""} ${booking.address_details?.city || ""} ${booking.address_details?.postal_code || ""}`.trim() ||
    "—";

  const hasDiscount = parseFloat(booking.discount_amount || 0) > 0;
  const canAccept = booking.status === "pending";
  const canStart = booking.status === "confirmed";
  const canComplete = booking.status === "in_progress";

  // ── Format time nicely ──
  const formatTime = (t) => {
    if (!t) return "—";
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 3 }, maxWidth: 980, mx: "auto" }}>
      {/* ── Back button ── */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={goBack}
        sx={{ mb: 2.5, textTransform: "none", fontWeight: 600, color: "text.secondary", borderRadius: 2 }}
      >
        Back to Requests
      </Button>

      {/* ── Hero / Header card ── */}
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: 3,
          overflow: "hidden",
          border: "1.5px solid",
          borderColor: "grey.100",
        }}
      >
        {/* Gradient accent bar */}
        <Box sx={{ height: 5, background: statusCfg.gradient }} />

        <Box sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            {/* Left: booking identity */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                  Booking #{booking.id}
                </Typography>
                <Chip
                  icon={statusCfg.icon}
                  label={statusCfg.label}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    color: statusCfg.color,
                    bgcolor: statusCfg.bg,
                    border: "1.5px solid",
                    borderColor: statusCfg.border,
                    height: 24,
                    "& .MuiChip-icon": { color: statusCfg.color },
                  }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {serviceName}
                {booking.category_name && ` · ${booking.category_name}`}
              </Typography>
            </Box>

            {/* Right: price summary */}
            <Box
              sx={{
                textAlign: { xs: "left", sm: "right" },
                bgcolor: "grey.50",
                borderRadius: 2,
                px: 2,
                py: 1.2,
                border: "1.5px solid",
                borderColor: "grey.100",
              }}
            >
              {hasDiscount ? (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                    ₹{booking.original_price}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="h6" fontWeight={800} color="success.main">
                      ₹{booking.price}
                    </Typography>
                    <Chip
                      label={`-₹${booking.discount_amount}`}
                      size="small"
                      icon={<LocalOfferIcon sx={{ fontSize: "11px !important" }} />}
                      sx={{ fontSize: "0.65rem", height: 18, bgcolor: "#f0fdf4", color: "#15803d", fontWeight: 700, "& .MuiChip-icon": { color: "#15803d" } }}
                    />
                  </Stack>
                </>
              ) : (
                <Typography variant="h6" fontWeight={800} color="text.primary">
                  ₹{booking.price ?? "—"}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">Total Value</Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>

      {/* ── Conflict warning ── */}
      {hasOverlap && booking.status === "pending" && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 2.5, borderRadius: 2.5, fontWeight: 600, border: "1.5px solid #fde68a" }}
        >
          <Typography variant="body2" fontWeight={700}>Schedule Conflict Detected</Typography>
          <Typography variant="caption">You already have a confirmed appointment at this date and time. Accepting may cause a conflict.</Typography>
        </Alert>
      )}

      {/* ── Two-column grid ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        {/* Customer Details */}
        <SectionCard title="Customer Details" icon={<PersonIcon fontSize="small" />} accentColor="#6366f1">
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Avatar
              sx={{
                width: 52,
                height: 52,
                fontWeight: 800,
                fontSize: "1.2rem",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              {String(customer).charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={800} fontSize="1rem">{customer}</Typography>
              {booking.full_name && booking.full_name !== customer && (
                <Typography variant="caption" color="text.secondary">{booking.full_name}</Typography>
              )}
            </Box>
          </Stack>
          <Stack spacing={1.5}>
            {booking.phone && (
              <InfoRow
                icon={<PhoneIcon sx={{ fontSize: 16 }} />}
                label="Phone"
                value={booking.phone}
              />
            )}
            {booking.user_email && (
              <InfoRow
                icon={<EmailIcon sx={{ fontSize: 16 }} />}
                label="Email"
                value={booking.user_email}
              />
            )}
          </Stack>
        </SectionCard>

        {/* Schedule */}
        <SectionCard title="Schedule" icon={<CalendarTodayIcon fontSize="small" />} accentColor="#0ea5e9">
          <Stack spacing={2}>
            <InfoRow
              icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
              label="Date"
              value={formatDate(booking.booking_date)}
            />
            <InfoRow
              icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
              label="Time"
              value={formatTime(booking.booking_time)}
            />
            {booking.service_duration && (
              <InfoRow
                icon={<TimerIcon sx={{ fontSize: 16 }} />}
                label="Duration"
                value={`${booking.service_duration} minutes`}
              />
            )}
          </Stack>
        </SectionCard>

        {/* Service Info */}
        <SectionCard title="Service Details" icon={<BuildIcon fontSize="small" />} accentColor="#f59e0b">
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {booking.service_image && (
              <Box
                component="img"
                src={booking.service_image}
                alt={serviceName}
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 2,
                  objectFit: "cover",
                  flexShrink: 0,
                  border: "1.5px solid",
                  borderColor: "grey.100",
                }}
              />
            )}
            <Box>
              <Typography fontWeight={700} mb={0.5}>{serviceName}</Typography>
              {booking.category_name && (
                <Chip label={booking.category_name} size="small" sx={{ mb: 1, fontSize: "0.7rem", height: 20, fontWeight: 600 }} />
              )}
              {booking.service_description && (
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {booking.service_description}
                </Typography>
              )}
            </Box>
          </Stack>
        </SectionCard>

        {/* Location */}
        <SectionCard title="Location" icon={<HomeIcon fontSize="small" />} accentColor="#10b981">
          <InfoRow
            icon={<HomeIcon sx={{ fontSize: 16 }} />}
            label="Service Address"
            value={addressText}
          />
          {booking.notes && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <InfoRow
                icon={<NotesIcon sx={{ fontSize: 16 }} />}
                label="Customer Notes"
                value={booking.notes}
              />
            </>
          )}
        </SectionCard>
      </Box>

      {/* ── Payment Status card (full width) ── */}
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: 3,
          border: "1.5px solid",
          borderColor: "grey.100",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            background: "linear-gradient(90deg, #6366f112 0%, transparent 100%)",
            borderBottom: "1.5px solid",
            borderColor: "grey.100",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <MonetizationOnIcon fontSize="small" sx={{ color: "#6366f1" }} />
          <Typography variant="subtitle2" fontWeight={800}>Payment Summary</Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            {/* Advance */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: booking.is_advance_paid ? "#f0fdf4" : "#fef3c7",
                border: "1.5px solid",
                borderColor: booking.is_advance_paid ? "#bbf7d0" : "#fde68a",
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                ADVANCE
              </Typography>
              <Typography variant="h6" fontWeight={800} color={booking.is_advance_paid ? "success.main" : "#b45309"}>
                ₹{booking.advance ?? "—"}
              </Typography>
              <Chip
                label={booking.is_advance_paid ? "Paid" : "Pending"}
                size="small"
                sx={{
                  mt: 0.5,
                  fontSize: "0.65rem",
                  height: 18,
                  fontWeight: 700,
                  bgcolor: booking.is_advance_paid ? "#dcfce7" : "#fef9c3",
                  color: booking.is_advance_paid ? "#15803d" : "#a16207",
                }}
              />
            </Box>

            {/* Remaining */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: booking.is_fully_paid ? "#f0fdf4" : "#eff6ff",
                border: "1.5px solid",
                borderColor: booking.is_fully_paid ? "#bbf7d0" : "#bfdbfe",
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                REMAINING
              </Typography>
              <Typography variant="h6" fontWeight={800} color={booking.is_fully_paid ? "success.main" : "primary.main"}>
                ₹{booking.remaining_payment ?? "—"}
              </Typography>
              <Chip
                label={booking.is_fully_paid ? "Cleared" : "Due"}
                size="small"
                sx={{
                  mt: 0.5,
                  fontSize: "0.65rem",
                  height: 18,
                  fontWeight: 700,
                  bgcolor: booking.is_fully_paid ? "#dcfce7" : "#dbeafe",
                  color: booking.is_fully_paid ? "#15803d" : "#1d4ed8",
                }}
              />
            </Box>

            {/* Total */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "grey.50",
                border: "1.5px solid",
                borderColor: "grey.200",
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                TOTAL VALUE
              </Typography>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                ₹{booking.price ?? "—"}
              </Typography>
              <Chip
                label={booking.is_fully_paid ? "Fully Paid" : booking.is_advance_paid ? "Partially Paid" : "Unpaid"}
                size="small"
                sx={{
                  mt: 0.5,
                  fontSize: "0.65rem",
                  height: 18,
                  fontWeight: 700,
                  bgcolor: booking.is_fully_paid ? "#dcfce7" : booking.is_advance_paid ? "#fef9c3" : "#fff1f2",
                  color: booking.is_fully_paid ? "#15803d" : booking.is_advance_paid ? "#a16207" : "#b91c1c",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* ── Action bar ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1.5px solid",
          borderColor: "grey.100",
          p: 2.5,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="body2" fontWeight={700} color="text.primary">
              {canAccept && "Ready to accept this request?"}
              {canStart && "Customer is waiting — ready to begin?"}
              {canComplete && "All done? Mark this job as complete."}
              {!canAccept && !canStart && !canComplete && "No actions available for this status."}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {canAccept && hasOverlap && "⚠ You have a schedule conflict at this time."}
              {canAccept && !hasOverlap && "Accepting will confirm the booking for the customer."}
              {canStart && "This will notify the customer that you've started."}
              {canComplete && "This will trigger the final payment step for the customer."}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} flexShrink={0}>
            <Button
              variant="outlined"
              onClick={goBack}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, borderColor: "grey.300" }}
            >
              Back
            </Button>

            {canAccept && (
              <Tooltip title={hasOverlap ? "Schedule conflict — cannot accept" : ""}>
                <span>
                  <Button
                    variant="contained"
                    onClick={onAccept}
                    disabled={isAccepting || hasOverlap}
                    startIcon={isAccepting ? null : <CheckCircleIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 3,
                      background: hasOverlap ? undefined : "linear-gradient(135deg, #22c55e, #15803d)",
                      boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
                      "&:hover": { background: "linear-gradient(135deg, #16a34a, #166534)" },
                    }}
                  >
                    {isAccepting ? <CircularProgress size={18} color="inherit" /> : "Accept Job"}
                  </Button>
                </span>
              </Tooltip>
            )}

            {canStart && (
              <Button
                variant="contained"
                onClick={onStart}
                disabled={starting}
                startIcon={starting ? null : <PlayArrowIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 3,
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                  "&:hover": { background: "linear-gradient(135deg, #4f46e5, #4338ca)" },
                }}
              >
                {starting ? <CircularProgress size={18} color="inherit" /> : "Start Job"}
              </Button>
            )}

            {canComplete && (
              <Button
                variant="contained"
                onClick={onComplete}
                disabled={completing}
                startIcon={completing ? null : <DoneAllIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 3,
                  background: "linear-gradient(135deg, #22c55e, #15803d)",
                  boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
                  "&:hover": { background: "linear-gradient(135deg, #16a34a, #166534)" },
                }}
              >
                {completing ? <CircularProgress size={18} color="inherit" /> : "Complete Job"}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} sx={{ width: "100%", borderRadius: 2, fontWeight: 600 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
