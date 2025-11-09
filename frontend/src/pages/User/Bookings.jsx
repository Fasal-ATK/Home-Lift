// src/pages/User/Bookings.jsx
import React, { useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookings } from "../../redux/slices/bookingSlice";
import { useNavigate } from "react-router-dom";

const statusColor = (status) => {
  switch (status) {
    case "pending":
      return "warning";
    case "confirmed":
      return "info";
    case "in_progress":
      return "primary";
    case "completed":
      return "success";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

const BookingCard = ({ booking, onView }) => {
  const addr = booking.address_details;
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {booking.service_name || booking.service}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {booking.full_name} • {booking.phone}
            </Typography>
          </Box>

          <Chip label={booking.status} color={statusColor(booking.status)} size="small" />
        </Stack>

        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Date:</strong> {booking.booking_date} &nbsp; <strong>Time:</strong> {booking.booking_time}
        </Typography>

        {addr ? (
          <Typography variant="body2" sx={{ whiteSpace: "pre-line", mb: 1 }}>
            <strong>Address:</strong> {addr.title} — {addr.address_line}
            <br />
            {addr.city}, {addr.district ? `${addr.district}, ` : ""}{addr.state} {addr.postal_code}
          </Typography>
        ) : booking.address ? (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Address:</strong> {booking.address}
          </Typography>
        ) : null}

        {booking.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Notes:</strong> {booking.notes}
          </Typography>
        )}
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
        <Stack>
          <Typography variant="body2">Price: ₹{booking.price}</Typography>
          <Typography variant="body2">Advance: ₹{booking.advance}</Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onView(booking.id)}
          >
            View
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default function Bookings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bookings, loading, error } = useSelector((state) => state.bookings);

  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  // navigate to /bookings/details and pass bookingId via location.state
  const handleView = (id) => {
    navigate("/bookings/details", { state: { bookingId: id } });
  };

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" mb={3} fontWeight={700}>
        My Bookings
      </Typography>

      {loading && bookings.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {typeof error === "string" ? error : JSON.stringify(error)}
        </Typography>
      )}

      {!loading && bookings.length === 0 && (
        <Typography color="text.secondary">No bookings found.</Typography>
      )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {bookings.map((b) => (
          <Grid item xs={12} sm={6} md={4} key={b.id}>
            <BookingCard booking={b} onView={handleView} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
