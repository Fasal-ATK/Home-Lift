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
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import HomeIcon from "@mui/icons-material/Home";
import NotesIcon from "@mui/icons-material/Notes";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  jobsSelectors,
  fetchJobDetail,
  acceptJob,
  selectAcceptingIds,
} from "../../../redux/slices/provider/providerJobSlice";

export default function ProviderJobDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // optional initial booking (optimistic)
  const initialBooking = location.state?.booking || null;

  // Try to get booking from store first (shared source of truth)
  const bookingFromStore = useSelector((s) => jobsSelectors.selectById(s, Number(id)));

  // local booking state: prefer initialBooking then store; if none, fetch via thunk
  const [booking, setBooking] = useState(initialBooking || bookingFromStore || null);
  const [loading, setLoading] = useState(!initialBooking && !bookingFromStore);
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  const acceptingIds = useSelector(selectAcceptingIds);
  const isAccepting = acceptingIds.map(String).includes(String(id));

  // keep booking in sync if store updates (e.g. fetched by other UI)
  useEffect(() => {
    if (!initialBooking && bookingFromStore) {
      setBooking(bookingFromStore);
      setLoading(false);
    }
  }, [initialBooking, bookingFromStore]);

  useEffect(() => {
    let mounted = true;
    if (initialBooking || bookingFromStore) return; // already have it

    setLoading(true);
    setError(null);

    dispatch(fetchJobDetail(Number(id)))
      .unwrap()
      .then((res) => {
        if (!mounted) return;
        setBooking(res);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("fetchJobDetail error:", err);
        setError(err?.message || err || "Unable to load booking");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, initialBooking, bookingFromStore, dispatch]);

  const goBack = () => navigate(-1);

  const onAccept = async () => {
    try {
      const action = await dispatch(acceptJob(Number(id)));
      if (acceptJob.fulfilled.match(action)) {
        setSnack({ open: true, message: "Job accepted successfully.", severity: "success" });
        // update booking from store if available, or clear
        const updated = jobsSelectors.selectById({ providerJobs: undefined }, Number(id)); // no-op placeholder
        // best-effort: booking removed from list by slice; we keep UI consistent by trying to fetch fresh detail
        try {
          // optional: re-fetch detail (if backend returns assigned booking)
          await dispatch(fetchJobDetail(Number(id))).unwrap();
        } catch (_) {
          // ignore refresh error
        }
      } else {
        setSnack({ open: true, message: action.payload || "Failed to accept job", severity: "error" });
      }
    } catch (err) {
      setSnack({ open: true, message: err.message || "Failed to accept job", severity: "error" });
    }
  };

  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mb: 2 }}>
          Back
        </Button>
        <Paper sx={{ p: 3 }}>
          <Typography color="error">Error: {String(error)}</Typography>
        </Paper>
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mb: 2 }}>
          Back
        </Button>
        <Paper sx={{ p: 3 }}>
          <Typography>No booking data available.</Typography>
        </Paper>
      </Box>
    );
  }

  const serviceName = booking.service_name || booking.service?.name || "Service";
  const customer = booking.customer_name || booking.user?.username || booking.user?.email || "Customer";
  const addressText =
    booking.address_details?.line1 ||
    booking.address ||
    `${booking.address_details?.city || ""} ${booking.address_details?.pincode || ""}`.trim() ||
    "—";

  const canAccept = booking.status === "pending";

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <IconButton onClick={goBack}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h6">Booking #{booking.id}</Typography>
          <Typography variant="body2" color="text.secondary">
            {serviceName} • {customer}
          </Typography>
        </Box>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar sx={{ width: 56, height: 56 }}>{String(customer).charAt(0)}</Avatar>
            <Box>
              <Typography fontWeight={700}>{customer}</Typography>
              <Typography variant="body2" color="text.secondary">
                {booking.full_name || ""}
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" />
                <Typography variant="caption">Date</Typography>
              </Stack>
              <Typography>{booking.booking_date || "—"}</Typography>
            </Stack>

            <Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon fontSize="small" />
                <Typography variant="caption">Time</Typography>
              </Stack>
              <Typography>{booking.booking_time || "—"}</Typography>
            </Stack>

            <Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <MonetizationOnIcon fontSize="small" />
                <Typography variant="caption">Price</Typography>
              </Stack>
              <Typography>₹{booking.price ?? "—"}</Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <HomeIcon fontSize="small" />
              <Typography variant="caption">Address</Typography>
            </Stack>
            <Typography>{addressText}</Typography>
          </Stack>

          <Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <NotesIcon fontSize="small" />
              <Typography variant="caption">Notes</Typography>
            </Stack>
            <Typography>{booking.notes || "—"}</Typography>
          </Stack>

          <Divider />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Typography sx={{ textTransform: "capitalize", fontWeight: 700 }}>{booking.status}</Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={goBack}>
                Back
              </Button>

              <Button
                variant="contained"
                color="success"
                onClick={onAccept}
                disabled={!canAccept || isAccepting}
              >
                {isAccepting ? <CircularProgress size={18} /> : canAccept ? "Accept" : "Not available"}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={closeSnack} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={closeSnack} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
