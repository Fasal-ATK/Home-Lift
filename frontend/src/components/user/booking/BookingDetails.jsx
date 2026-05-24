// src/components/user/booking/BookingDetails.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Divider,
  Radio,
  FormControl,
  FormLabel,
  Rating,
  TextField,
  Grid,
  Avatar,
  Skeleton,
  IconButton,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookingDetails, updateBooking, fetchBookings } from "../../../redux/slices/bookingSlice";
import { fetchWallet, payWithWalletThunk } from "../../../redux/slices/walletSlice";
import ConfirmModal from "../../common/Confirm";
import { createPaymentIntent, bookingService } from "../../../services/apiServices";
import { ShowToast } from "../../common/Toast";
import { stripePromise } from "../../../../stripe/stripe";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../../common/payment";
import Modal from "@mui/material/Modal";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import NotesIcon from "@mui/icons-material/Notes";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import FlagIcon from "@mui/icons-material/Flag";
import StarIcon from "@mui/icons-material/Star";
import CancelIcon from "@mui/icons-material/Cancel";
import PaymentIcon from "@mui/icons-material/Payment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getErrorMessage } from "../../../utils/errorHelper";

const STATUS_CONFIG = {
  pending:     { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Pending" },
  confirmed:   { color: "#0369a1", bg: "#eff6ff", border: "#bfdbfe", label: "Confirmed" },
  in_progress: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", label: "In Progress" },
  completed:   { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", label: "Completed" },
  cancelled:   { color: "#dc2626", bg: "#fff1f2", border: "#fecdd3", label: "Cancelled" },
};

const InfoRow = ({ icon, label, value, valueColor }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Box sx={{ color: "text.disabled", mt: 0.2, flexShrink: 0 }}>
      {React.cloneElement(icon, { sx: { fontSize: 16 } })}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.6rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color={valueColor || "text.primary"} sx={{ lineHeight: 1.4 }}>
        {value}
      </Typography>
    </Box>
  </Stack>
);

const PriceRow = ({ label, value, strikethrough, bold, color }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Typography variant="body2" color={color || "text.secondary"} sx={{ textDecoration: strikethrough ? "line-through" : "none" }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={bold ? 700 : 500} color={color || "text.primary"} sx={{ textDecoration: strikethrough ? "line-through" : "none" }}>
      {value}
    </Typography>
  </Stack>
);

export default function BookingDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentBooking, loading, error } = useSelector((s) => s.bookings);
  const booking = currentBooking?.data ?? currentBooking;
  const [busy, setBusy] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [payType, setPayType] = useState("remaining");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const { balance: walletBalance } = useSelector((state) => state.wallet);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const bookingIdFromState = location.state?.bookingId;
  const searchParams = new URLSearchParams(location.search);
  const bookingIdFromQuery = searchParams.get("id");
  const bookingId = bookingIdFromState || bookingIdFromQuery;

  useEffect(() => {
    if (!bookingId) { navigate("/bookings", { replace: true }); return; }
    dispatch(fetchBookingDetails(bookingId));
  }, [dispatch, bookingId, navigate]);

  const canCancel = (s) => s && !["cancelled", "completed", "in_progress"].includes(s);

  const handleCancel = async () => {
    if (!bookingId) return;
    setCancelConfirmOpen(false);
    setBusy(true);
    try {
      await dispatch(updateBooking({ id: bookingId, data: { status: "cancelled" } })).unwrap();
      await dispatch(fetchBookings());
      await dispatch(fetchBookingDetails(bookingId));
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  const openPayModal = async (type) => {
    try {
      setBusy(true);
      setPaymentMethod("card");
      dispatch(fetchWallet());
      setPayType(type);
      const secret = await createPaymentIntent(bookingId, type);
      setClientSecret(secret);
      setPayModalOpen(true);
    } catch (err) {
      ShowToast("Could not initiate payment. Please try again.", "error");
    } finally { setBusy(false); }
  };

  const handleWalletPay = async () => {
    if (!bookingId) return;
    try {
      setBusy(true);
      await dispatch(payWithWalletThunk({ bookingId, paymentType: payType })).unwrap();
      ShowToast(`${payType === "advance" ? "Advance" : "Remaining balance"} paid via wallet.`, "success");
      setPayModalOpen(false);
      dispatch(fetchBookingDetails(bookingId));
      dispatch(fetchBookings());
    } catch (err) {
      ShowToast(getErrorMessage(err, "Wallet payment failed."), "error");
    } finally { setBusy(false); }
  };

  const handleReviewSubmit = async () => {
    if (!rating) { ShowToast("Please provide a star rating.", "error"); return; }
    setBusy(true);
    try {
      await bookingService.reviewBooking(bookingId, { rating, comment });
      ShowToast("Review submitted successfully!", "success");
      setReviewModalOpen(false);
      dispatch(fetchBookingDetails(bookingId));
      dispatch(fetchBookings());
    } catch (e) {
      ShowToast(e?.response?.data?.error || e?.response?.data?.detail || "Failed to submit review", "error");
    } finally { setBusy(false); }
  };

  const statusCfg = booking ? (STATUS_CONFIG[booking.status] || {}) : {};
  const hasDiscount = parseFloat(booking?.discount_amount || 0) > 0;

  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 4 }, maxWidth: 1450, mx: "auto" }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/bookings")}
        sx={{ mb: 2, textTransform: "none", fontWeight: 600, color: "text.secondary" }}
      >
        Back to Bookings
      </Button>

      {loading && !booking ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
          <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={80} />
        </Paper>
      ) : error ? (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: "center", border: '1px solid', borderColor: 'grey.200' }}>
          <Typography color="error" fontWeight={600}>{getErrorMessage(error, "Failed to load booking.")}</Typography>
        </Paper>
      ) : !booking ? (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: "center", border: '1px solid', borderColor: 'grey.200' }}>
          <Typography color="text.secondary">Booking not found.</Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2.5}>
          {/* Left Column: Details (Service, Schedule, Location, Provider, Review) */}
          <Grid item xs={12} md={7.5}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', bgcolor: 'white', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
              {/* Header */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                {booking.service_image && (
                  <Box
                    component="img"
                    src={booking.service_image}
                    sx={{ width: 52, height: 52, borderRadius: 2, objectFit: "cover", flexShrink: 0 }}
                  />
                )}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                    {booking.category_name} · #{booking.id}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mt: 0.2 }}>
                    {booking.service_name || booking.service}
                  </Typography>
                </Box>
                <Chip
                  label={statusCfg.label || booking.status}
                  size="small"
                  sx={{
                    bgcolor: statusCfg.bg,
                    color: statusCfg.color,
                    border: `1px solid ${statusCfg.border}`,
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    letterSpacing: 0.3,
                    flexShrink: 0,
                  }}
                />
              </Stack>

              {booking.service_description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5, fontSize: '0.8rem' }}>
                  {booking.service_description}
                </Typography>
              )}

              <Divider sx={{ mb: 2.5 }} />

              {/* Info Grid (2x2 style cards) */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* Schedule */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.100', height: '100%' }}>
                    <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem', display: 'block', mb: 1 }}>
                      Schedule
                    </Typography>
                    <Stack spacing={1}>
                      <InfoRow icon={<CalendarTodayIcon />} label="Date" value={booking.booking_date} />
                      <InfoRow icon={<AccessTimeIcon />} label="Time" value={booking.booking_time} />
                    </Stack>
                  </Box>
                </Grid>

                {/* Customer */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.100', height: '100%' }}>
                    <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem', display: 'block', mb: 1 }}>
                      Customer Info
                    </Typography>
                    <Stack spacing={1}>
                      <InfoRow icon={<PersonIcon />} label="Customer" value={`${booking.full_name}`} />
                      <InfoRow icon={<PhoneIcon />} label="Phone" value={booking.phone} />
                    </Stack>
                  </Box>
                </Grid>

                {/* Address */}
                {(booking.address_details || booking.address) && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.100' }}>
                      <InfoRow
                        icon={<LocationOnIcon />}
                        label="Service Location Address"
                        value={
                          booking.address_details
                            ? `${booking.address_details.address_line}, ${booking.address_details.city}${booking.address_details.district ? `, ${booking.address_details.district}` : ""}`
                            : booking.address
                        }
                      />
                    </Box>
                  </Grid>
                )}

                {/* Provider Contact */}
                {booking.provider_contact && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f5f3ff', border: '1px solid', borderColor: '#ddd6fe' }}>
                      <Typography variant="caption" fontWeight={800} color="#7c3aed" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem', display: 'block', mb: 1 }}>
                        Provider Assigned
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={4}>
                          <InfoRow icon={<PersonIcon />} label="Name" value={booking.provider_contact.name || `@${booking.provider_contact.username}`} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <InfoRow icon={<EmailIcon />} label="Email" value={booking.provider_contact.email} />
                        </Grid>
                        {booking.provider_contact.phone && (
                          <Grid item xs={12} sm={4}>
                            <InfoRow icon={<PhoneIcon />} label="Phone" value={booking.provider_contact.phone} />
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {booking.notes && (
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.100', mb: 2 }}>
                  <InfoRow icon={<NotesIcon />} label="Notes" value={booking.notes} />
                </Box>
              )}

              {/* Review */}
              {booking.review && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Paper elevation={0} sx={{ p: 1.8, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', bgcolor: '#fffbeb' }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <StarIcon sx={{ color: '#d97706', fontSize: 18, mt: 0.2 }} />
                      <Box>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
                          Your Review
                        </Typography>
                        <Rating value={booking.review.rating} readOnly size="small" sx={{ display: 'block', my: 0.3 }} />
                        {booking.review.comment && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            "{booking.review.comment}"
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              )}

              {/* Created Date */}
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Typography variant="caption" color="text.disabled" fontWeight={500}>
                  Created: {new Date(booking.created_at).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "numeric", minute: "numeric", hour12: true,
                  })}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column: Payment & Action Buttons */}
          <Grid item xs={12} md={4.5}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
              <Box>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem', display: 'block', mb: 2 }}>
                  Payment Summary
                </Typography>

                <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'white', mb: 2 }}>
                  <Stack spacing={1}>
                    {hasDiscount ? (
                      <>
                        <PriceRow label="Original Price" value={`₹${booking.original_price}`} strikethrough color="text.disabled" />
                        <PriceRow label="Discount" value={`-₹${booking.discount_amount}`} color="#16a34a" bold />
                        <Divider sx={{ my: 0.4 }} />
                        <PriceRow label="Total" value={`₹${booking.price}`} bold />
                      </>
                    ) : (
                      <PriceRow label="Total Price" value={`₹${booking.price}`} bold />
                    )}

                    <Divider sx={{ my: 0.4 }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Advance</Typography>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Typography variant="body2" fontWeight={600}>₹{booking.advance}</Typography>
                        <Chip
                          icon={booking.is_advance_paid ? <CheckCircleIcon sx={{ fontSize: '10px !important' }} /> : undefined}
                          label={booking.is_advance_paid ? "Paid" : "Pending"}
                          size="small"
                          sx={{
                            height: 16, fontSize: '0.58rem', fontWeight: 700,
                            bgcolor: booking.is_advance_paid ? '#f0fdf4' : '#fffbeb',
                            color: booking.is_advance_paid ? '#15803d' : '#b45309',
                            '& .MuiChip-icon': { fontSize: 10 }
                          }}
                        />
                      </Stack>
                    </Stack>

                    {booking.remaining_payment > 0 && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Remaining</Typography>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Typography variant="body2" fontWeight={600} color="primary.main">₹{booking.remaining_payment}</Typography>
                          <Chip
                            icon={booking.is_fully_paid ? <CheckCircleIcon sx={{ fontSize: '10px !important' }} /> : undefined}
                            label={booking.is_fully_paid ? "Paid" : "Due"}
                            size="small"
                            sx={{
                              height: 16, fontSize: '0.58rem', fontWeight: 700,
                              bgcolor: booking.is_fully_paid ? '#f0fdf4' : '#eff6ff',
                              color: booking.is_fully_paid ? '#15803d' : '#0369a1',
                              '& .MuiChip-icon': { fontSize: 10 }
                            }}
                          />
                        </Stack>
                      </Stack>
                    )}

                    {booking.is_refunded && (
                      <Typography variant="caption" color="info.main" fontWeight={700} sx={{ mt: 0.5 }}>
                        ↩ Advance refunded to wallet
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              </Box>

              {/* Action Buttons grouped beautifully under Payment details */}
              <Stack spacing={1} sx={{ mt: 2 }}>
                {(booking.status === "in_progress" || booking.status === "completed") &&
                  booking.remaining_payment > 0 && !booking.is_fully_paid && (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => openPayModal("remaining")}
                      disabled={busy}
                      startIcon={<PaymentIcon />}
                      sx={{ textTransform: "none", fontWeight: 700, fontSize: '0.8rem', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, py: 1, borderRadius: 2 }}
                    >
                      Pay ₹{booking.remaining_payment}
                    </Button>
                  )}

                {booking.status === "pending" && !booking.is_advance_paid && (
                  <Button
                    variant="contained"
                    fullWidth
                    color="warning"
                    onClick={() => openPayModal("advance")}
                    disabled={busy}
                    startIcon={<PaymentIcon />}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: '0.8rem', py: 1, borderRadius: 2 }}
                  >
                    Pay Advance ₹{booking.advance}
                  </Button>
                )}

                {booking.status === "completed" && !booking.review && (
                  <Button
                    variant="outlined"
                    fullWidth
                    color="secondary"
                    onClick={() => setReviewModalOpen(true)}
                    disabled={busy}
                    startIcon={<StarIcon />}
                    sx={{ textTransform: "none", fontWeight: 600, fontSize: '0.8rem', py: 1, borderRadius: 2 }}
                  >
                    Rate & Review
                  </Button>
                )}

                {canCancel(booking.status) && (
                  <Button
                    variant="outlined"
                    fullWidth
                    color="error"
                    onClick={() => setCancelConfirmOpen(true)}
                    disabled={busy}
                    startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <CancelIcon />}
                    sx={{ textTransform: "none", fontWeight: 600, fontSize: '0.8rem', py: 1, borderRadius: 2 }}
                  >
                    Cancel Booking
                  </Button>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  color="inherit"
                  component={Link}
                  to="/support"
                  state={{ prefill: `Issue with Booking #${booking.id}`, type: "provider" }}
                  startIcon={<FlagIcon />}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: '0.8rem', borderColor: 'grey.300', color: 'text.secondary', py: 1, borderRadius: 2 }}
                >
                  Report Issue
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={handleCancel}
            message="Are you sure you want to cancel this booking?"
            confirmLabel="Cancel Booking"
            color="danger"
          />

          {/* Review Modal */}
          <Modal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)}>
            <Box sx={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              width: { xs: "90vw", sm: 420 }, bgcolor: "background.paper", borderRadius: 3,
              boxShadow: "0 24px 64px rgba(0,0,0,0.15)", overflow: 'hidden'
            }}>
              <Box sx={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} mb={0.5}>Rate Your Experience</Typography>
                <Typography variant="body2" color="text.secondary" mb={2.5}>
                  for {booking.service_name || "this service"}
                </Typography>
                <Box display="flex" flexDirection="column" alignItems="center" mb={2.5}>
                  <Rating
                    size="large"
                    value={rating}
                    onChange={(_, v) => setRating(v)}
                    sx={{ fontSize: '2.5rem' }}
                  />
                  <Typography variant="caption" color="text.secondary" mt={0.5}>
                    {rating ? ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating] : "Tap to rate"}
                  </Typography>
                </Box>
                <TextField
                  fullWidth multiline rows={3}
                  label="Share your experience (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mb: 2.5 }}
                  size="small"
                />
                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button onClick={() => setReviewModalOpen(false)} disabled={busy} sx={{ textTransform: 'none' }}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleReviewSubmit}
                    disabled={busy || !rating}
                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
                  >
                    {busy ? <CircularProgress size={20} color="inherit" /> : "Submit Review"}
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Modal>

          {/* Payment Modal */}
          <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)}>
            <Box sx={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              width: { xs: "90vw", sm: 460 }, bgcolor: "background.paper", borderRadius: 3,
              boxShadow: "0 24px 64px rgba(0,0,0,0.15)", maxHeight: '90vh', overflowY: 'auto'
            }}>
              <Box sx={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} mb={0.5}>
                  {payType === "advance" ? "Pay Advance" : "Pay Remaining Balance"}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2.5}>
                  {payType === "advance"
                    ? `₹${booking.advance} advance for ${booking.service_name || "service"}`
                    : `₹${booking.remaining_payment} remaining for ${booking.service_name || "service"}`
                  }
                </Typography>

                <FormControl component="fieldset" sx={{ mb: 2.5 }}>
                  <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.8rem', mb: 1 }}>
                    Payment Method
                  </FormLabel>
                  <Stack spacing={1}>
                    {[
                      { value: "card", icon: <CreditCardIcon sx={{ fontSize: 18 }} />, label: "Credit / Debit Card", sub: "Powered by Stripe" },
                      {
                        value: "wallet",
                        icon: <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />,
                        label: "Wallet",
                        sub: `Balance: ₹${walletBalance}`,
                        disabled: Number(walletBalance) < Number(payType === "advance" ? booking.advance : booking.remaining_payment),
                        chipColor: Number(walletBalance) >= Number(payType === "advance" ? booking.advance : booking.remaining_payment) ? "#16a34a" : "#dc2626",
                        chipBg: Number(walletBalance) >= Number(payType === "advance" ? booking.advance : booking.remaining_payment) ? "#f0fdf4" : "#fff1f2",
                      },
                    ].map((opt) => (
                      <Box
                        key={opt.value}
                        onClick={() => !opt.disabled && setPaymentMethod(opt.value)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: '1.5px solid',
                          borderColor: paymentMethod === opt.value ? '#6366f1' : 'grey.200',
                          bgcolor: paymentMethod === opt.value ? '#f5f3ff' : 'transparent',
                          cursor: opt.disabled ? 'not-allowed' : 'pointer',
                          opacity: opt.disabled ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          transition: 'all 0.15s',
                        }}
                      >
                        <Box sx={{ color: paymentMethod === opt.value ? '#6366f1' : 'text.secondary' }}>
                          {opt.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={700}>{opt.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{opt.sub}</Typography>
                        </Box>
                        {opt.chipColor && (
                          <Chip
                            label={`₹${walletBalance}`}
                            size="small"
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: opt.chipBg, color: opt.chipColor }}
                          />
                        )}
                        <Radio checked={paymentMethod === opt.value} size="small" sx={{ p: 0 }} />
                      </Box>
                    ))}
                  </Stack>
                </FormControl>

                <Divider sx={{ mb: 2.5 }} />

                {paymentMethod === "card" ? (
                  clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm
                        buttonLabel={payType === "advance"
                          ? `Pay ₹${booking.advance} Now`
                          : `Pay ₹${booking.remaining_payment} Now`
                        }
                      />
                    </Elements>
                  )
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleWalletPay}
                    disabled={busy || Number(walletBalance) < Number(payType === "advance" ? booking.advance : booking.remaining_payment)}
                    sx={{
                      py: 1.3, fontWeight: 700, textTransform: "none",
                      bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' },
                      borderRadius: 2,
                    }}
                  >
                    {busy
                      ? <CircularProgress size={22} color="inherit" />
                      : `Pay ₹${payType === "advance" ? booking.advance : booking.remaining_payment} with Wallet`
                    }
                  </Button>
                )}
              </Box>
            </Box>
          </Modal>
        </>
      )}
    </Box>
  );
}
