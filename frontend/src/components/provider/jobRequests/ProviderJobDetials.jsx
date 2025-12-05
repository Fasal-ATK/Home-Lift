// src/pages/provider/ProviderJobDetail.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import NotesIcon from "@mui/icons-material/Notes";
import HomeIcon from "@mui/icons-material/Home";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { acceptJob } from '../../../redux/slices/provider/providerJobSlice';
import { providerJobService } from '../../../services/apiServices'; // adjust path if needed

export default function ProviderJobDetail() {
  const { id } = useParams(); // expects route /provider/job-requests/:id
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // local state for booking detail
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // snackbar
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  // accept loading per-job: use acceptingIds from slice if available
  const acceptingIds = useSelector((state) => state.providerJobs.acceptingIds || []);
  const isAccepting = acceptingIds.map(String).includes(String(id));

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);

    // providerJobService.getJobDetail should return booking detail object
    providerJobService.getJobDetail(id)
      .then((res) => {
        if (!mounted) return;
        setBooking(res);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load booking detail:", err);
        setLoadError(err?.response?.data || err.message || "Failed to load booking");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [id]);

  const handleBack = () => navigate(-1);

  const handleAccept = async () => {
    try {
      const result = await dispatch(acceptJob(Number(id)));
      if (acceptJob.fulfilled.match(result)) {
        setSnack({ open: true, message: `Job #${id} accepted successfully!`, severity: "success" });
        // refresh booking details after accept
        try {
          const refreshed = await providerJobService.getJobDetail(id);
          setBooking(refreshed);
        } catch (err) {
          // ignore refresh error
        }
      } else {
        setSnack({ open: true, message: result.payload || "Failed to accept job", severity: "error" });
      }
    } catch (err) {
      setSnack({ open: true, message: err.message || "Failed to accept job", severity: "error" });
    }
  };

  const handleCloseSnack = () => setSnack((s) => ({ ...s, open: false }));

  // Render loading / error
  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back
        </Button>
        <Paper sx={{ p: 3 }}>
          <Typography color="error">Failed to load booking: {String(loadError)}</Typography>
        </Paper>
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back
        </Button>
        <Paper sx={{ p: 3 }}>
          <Typography>No booking found.</Typography>
        </Paper>
      </Box>
    );
  }

  // Derived display values
  const serviceName = booking.service_name || (booking.service && booking.service.name) || "Service";
  const customerName = booking.customer_name || (booking.user && (booking.user.username || booking.user.email)) || "Customer";
  const addressText = booking.address_details
    ? `${booking.address_details.line1 || ""}${booking.address_details.city ? ", " + booking.address_details.city : ""}`
    : booking.address || "—";

  const canAccept = booking.status === "pending";

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <IconButton onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          Booking #{booking.id}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          {serviceName}
        </Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 56, height: 56 }}>
                {String(customerName).charAt(0)}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{customerName}</Typography>
                <Typography variant="body2" color="text.secondary">{booking.full_name || ""}</Typography>
                <Typography variant="body2" color="text.secondary">{booking.phone}</Typography>
              </Box>
            </Stack>

            <Stack spacing={0.5} alignItems="flex-end">
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Typography fontWeight={700} sx={{ textTransform: "capitalize" }}>{booking.status}</Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Stack spacing={1} sx={{ minWidth: 220 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" />
                <Typography variant="body2">Date</Typography>
              </Stack>
              <Typography fontWeight={600}>{booking.booking_date}</Typography>
            </Stack>

            <Stack spacing={1} sx={{ minWidth: 160 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon fontSize="small" />
                <Typography variant="body2">Time</Typography>
              </Stack>
              <Typography fontWeight={600}>{booking.booking_time}</Typography>
            </Stack>

            <Stack spacing={1} sx={{ minWidth: 200 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <MonetizationOnIcon fontSize="small" />
                <Typography variant="body2">Price</Typography>
              </Stack>
              <Typography fontWeight={600}>₹{booking.price}</Typography>
              <Typography variant="caption" color="text.secondary">Advance: ₹{booking.advance}</Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <HomeIcon fontSize="small" />
              <Typography variant="body2">Address</Typography>
            </Stack>
            <Typography>{addressText}</Typography>
            {booking.address_details && (
              <Typography variant="caption" color="text.secondary">
                {booking.address_details.line2 || ""} {booking.address_details.pincode ? `• ${booking.address_details.pincode}` : ""}
              </Typography>
            )}
          </Stack>

          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <NotesIcon fontSize="small" />
              <Typography variant="body2">Notes</Typography>
            </Stack>
            <Typography>{booking.notes || "—"}</Typography>
          </Stack>

          <Divider />

          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Assigned Provider</Typography>
              <Typography fontWeight={700}>
                {booking.provider ? (booking.provider.get_full_name || booking.provider.username || booking.provider.email) : "Not assigned"}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button onClick={handleBack} variant="outlined">Back</Button>

              {canAccept ? (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleAccept}
                  disabled={isAccepting}
                  sx={{ textTransform: "none" }}
                >
                  {isAccepting ? <CircularProgress size={18} /> : "Accept Job"}
                </Button>
              ) : (
                <Button variant="contained" disabled>{booking.status === "confirmed" ? "Assigned" : "Not available"}</Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={handleCloseSnack}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
