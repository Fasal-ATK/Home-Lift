// src/components/user/booking/BookingDetails.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookingDetails, updateBooking, fetchBookings } from "../../../redux/slices/bookingSlice";
import ConfirmModal from "../../common/Confirm";
import { createPaymentIntent } from "../../../services/apiServices";
import { ShowToast } from "../../common/Toast";
import { stripePromise } from "../../../../stripe/stripe";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../../common/payment";
import Modal from "@mui/material/Modal";
import Avatar from "@mui/material/Avatar";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import PersonIcon from "@mui/icons-material/Person";

const statusColor = (status) => {
  switch (status) {
    case "pending": return "warning";
    case "confirmed": return "info";
    case "in_progress": return "primary";
    case "completed": return "success";
    case "cancelled": return "error";
    default: return "default";
  }
};

export default function BookingDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentBooking, loading, error } = useSelector((s) => s.bookings);
  // support both shapes: { data: {...} } or plain object
  const booking = currentBooking?.data ?? currentBooking;
  const [busy, setBusy] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  // get id from location.state.bookingId OR query param ?id=123
  const bookingIdFromState = location.state?.bookingId;
  const searchParams = new URLSearchParams(location.search);
  const bookingIdFromQuery = searchParams.get("id");
  const bookingId = bookingIdFromState || bookingIdFromQuery;

  useEffect(() => {
    if (!bookingId) {
      navigate("/bookings", { replace: true });
      return;
    }
    dispatch(fetchBookingDetails(bookingId));
  }, [dispatch, bookingId, navigate]);

  const canCancel = (s) => {
    if (!s) return false;
    return !["cancelled", "completed", "in_progress"].includes(s);
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    setCancelConfirmOpen(false);
    setBusy(true);
    try {
      await dispatch(updateBooking({ id: bookingId, data: { status: "cancelled" } })).unwrap();
      await dispatch(fetchBookings());
      await dispatch(fetchBookingDetails(bookingId));
    } catch (e) {
      console.error("Cancel booking failed:", e);
    } finally {
      setBusy(false);
    }
  };

  const handlePayRemaining = async () => {
    try {
      setBusy(true);
      const secret = await createPaymentIntent(bookingId, "remaining");
      setClientSecret(secret);
      setPayModalOpen(true);
    } catch (err) {
      console.error("Failed to create payment intent", err);
      ShowToast("Could not initiate payment. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => navigate("/bookings");

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Button onClick={handleBack} sx={{ mb: 2 }}>← Back to Bookings</Button>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {loading && !booking ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{typeof error === "string" ? error : JSON.stringify(error)}</Typography>
        ) : !booking ? (
          <Typography color="text.secondary">Booking not found.</Typography>
        ) : (
          <>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {booking.service_name || booking.service}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {booking.full_name} • {booking.phone}
                </Typography>
              </Box>

              <Chip
                label={(booking.status || "").replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                color={statusColor(booking.status)}
                size="small"
              />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              {booking.service_image && (
                <Box
                  component="img"
                  src={booking.service_image}
                  sx={{ width: 120, height: 120, borderRadius: 2, objectFit: 'cover' }}
                />
              )}
              <Box>
                <Typography variant="overline" color="text.secondary">{booking.category_name}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{booking.service_description}</Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1} sx={{ mb: 2 }}>
              <Typography variant="body2"><strong>Date:</strong> {booking.booking_date}</Typography>
              <Typography variant="body2"><strong>Time:</strong> {booking.booking_time}</Typography>

              {booking.address_details ? (
                <Box>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Address:</strong> {booking.address_details.title} — {booking.address_details.address_line}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {booking.address_details.city}
                    {booking.address_details.district ? `, ${booking.address_details.district}` : ""},{" "}
                    {booking.address_details.state} {booking.address_details.postal_code}
                  </Typography>
                </Box>
              ) : booking.address ? (
                <Typography variant="body2"><strong>Address:</strong> {booking.address}</Typography>
              ) : null}

              {booking.notes && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Notes:</strong> {booking.notes}
                </Typography>
              )}
            </Stack>

            {booking.provider_contact && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1.5, fontSize: '1rem', fontWeight: 'bold' }}>Provider Contact</Typography>
                <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">{booking.provider_contact.name}</Typography>
                  </Stack>
                  {booking.provider_contact.phone && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{booking.provider_contact.phone}</Typography>
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{booking.provider_contact.email}</Typography>
                  </Stack>
                </Stack>
              </>
            )}

            <Divider sx={{ mb: 2 }} />

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2">Total Price: <strong>₹{booking.price}</strong></Typography>
                <Typography variant="body2">Advance Paid: <strong>₹{booking.advance}</strong></Typography>
                {booking.remaining_payment > 0 && (
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    Remaining Balance: ₹{booking.remaining_payment} {booking.is_fully_paid ? '(Paid)' : ''}
                  </Typography>
                )}
                {booking.is_refunded && (
                  <Typography variant="body2" color="info.main" fontWeight="bold">
                    * Advance Refunded to Wallet
                  </Typography>
                )}
              </Box>

              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={handleBack} disabled={busy}>Back</Button>

                {/* Show Pay Balance if In Progress or Completed (and unpaid) */}
                {(booking.status === 'in_progress' || booking.status === 'completed') && booking.remaining_payment > 0 && !booking.is_fully_paid && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePayRemaining}
                    disabled={busy}
                  >
                    Pay Remaining balance
                  </Button>
                )}

                {/* Show Cancel if status allows it (pending/confirmed) */}
                {canCancel(booking.status) && (
                  <Button
                    color="error"
                    variant="contained"
                    onClick={() => setCancelConfirmOpen(true)}
                    disabled={busy}
                  >
                    {busy ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Cancel Booking"}
                  </Button>
                )}
              </Stack>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
              Created: {booking.created_at}
            </Typography>
          </>
        )}
      </Paper>

      <ConfirmModal
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={handleCancel}
        message="Are you sure you want to cancel this booking?"
        confirmLabel="Cancel Booking"
        color="danger"
      />

      {/* Payment Modal */}
      <Modal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        aria-labelledby="pay-remaining-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 450,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <Typography variant="h6" mb={2} fontWeight="bold">
            Complete Remaining Payment
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Paying the remaining balance of <strong>₹{booking?.remaining_payment}</strong> for {booking?.service_name || 'service'}.
          </Typography>

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm buttonLabel={`Pay ₹${booking?.remaining_payment} Now`} />
            </Elements>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
