import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Divider,
  IconButton,
  Tooltip,
  InputAdornment,
  Avatar,
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import MapIcon from "@mui/icons-material/Map";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookings, clearError, selectTotalBookingCount } from "../../redux/slices/bookingSlice";
import { fetchServices } from "../../redux/slices/serviceSlice";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchWallet, payWithWalletThunk } from "../../redux/slices/walletSlice";
import { bookingService, createPaymentIntent } from "../../services/apiServices";
import { ShowToast } from "../../components/common/Toast";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "../../../stripe/stripe";
import CheckoutForm from "../../components/common/payment";

import Modal from "@mui/material/Modal";

const STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

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

const DEFAULT_STATUS = [];

const fmtDate = (d) => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return d;
  }
};

const fmtTime = (t) => (t ? t : "-");

/* ---- small helpers ---- */
const resolveThumb = (booking, services) => {
  if (!booking) return null;
  if (booking.service_icon) return booking.service_icon;
  // try find service in services list by id
  const svc = services?.find((s) => String(s.id) === String(booking.service));
  if (svc) return svc.icon || svc.thumbnail || null;
  return null;
};

// normalize a date string/timestamp to local YYYY-MM-DD (works for 'YYYY-MM-DD' and ISO timestamps)
const toLocalYMD = (dateStr) => {
  if (!dateStr) return null;
  try {
    // If already in YYYY-MM-DD format, return that
    const simpleMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    if (simpleMatch) return dateStr;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return null;
  }
};

// convert error payload to readable string
const stringifyError = (err) => {
  if (!err) return "";
  if (typeof err === "string") return err;
  try {
    if (err.message) return err.message;
    if (err.error) return err.error;
    // If it's an object (e.g. { detail: ..., ... }), try common keys
    if (err.detail) return err.detail;
    if (err.non_field_errors) return Array.isArray(err.non_field_errors) ? err.non_field_errors.join(", ") : String(err.non_field_errors);
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

/* ---- OrderCard (uses services list & shows city/state only in header) ---- */
function OrderCard({ booking, onView, onInvoice, onPayRemaining, onPayAdvance, onChat, services }) {
  const addr = booking.address_details;
  const thumb = resolveThumb(booking, services);
  const svcName =
    booking.service_name ||
    (services?.find((s) => String(s.id) === String(booking.service))?.name) ||
    booking.service ||
    "Service";
  const initials = svcName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Paper sx={{ mb: 2.5, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "grey.200", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      {/* header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, px: 2.5, py: 1.5, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "grey.200", flexWrap: "wrap" }}>
        
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">ORDER PLACED</Typography>
              <Typography variant="body2" fontWeight={600}>{fmtDate(booking.created_at || booking.booking_date)}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">TOTAL</Typography>
              {parseFloat(booking.discount_amount || 0) > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                    ₹{booking.original_price}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    ₹{booking.price}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" fontWeight={700}>₹{booking.price}</Typography>
              )}
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">ORDER #</Typography>
              <Typography variant="body2" fontWeight={600}>{booking.id}</Typography>
            </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button size="small" variant="outlined" onClick={() => onView(booking.id)} sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 600 }}>
            View Details
          </Button>
          {['confirmed', 'ongoing', 'in_progress', 'completed'].includes(booking.status) && (
            <Button size="small" variant="outlined" color="primary" onClick={() => onChat(booking)} sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 600 }}>
              Chat
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => onInvoice(booking.id)}
            sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 600 }}
            disabled={booking.status === 'pending' || booking.status === 'cancelled'}
          >
            Invoice
          </Button>
        </Stack>
      </Box>

      {/* body */}
      <Box sx={{ px: 2.5, py: 2, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Product Image & Title */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1.5, minWidth: 250 }}>
          <Box sx={{ width: 72, height: 72, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "grey.100", borderRadius: 2, overflow: "hidden" }}>
            {thumb ? (
              <Box component="img" src={thumb} alt="thumb" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Avatar sx={{ width: 72, height: 72, bgcolor: "primary.light", fontWeight: 700, borderRadius: 2 }}>{initials}</Avatar>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.5 }}>
              {svcName}
            </Typography>
            <Chip
              label={(booking.status || "").replace("_", " ").toUpperCase()}
              size="small"
              color={statusColor(booking.status)}
              sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem', borderRadius: 1, mb: 0.5 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {booking.full_name} • {booking.phone}
            </Typography>
          </Box>
        </Box>

        {/* Schedule & Address */}
        <Box sx={{ flex: 1.5, minWidth: 250, borderLeft: { md: "1px solid #eee" }, pl: { md: 3 } }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Scheduled:</strong> {booking.booking_date || fmtDate(booking.created_at)} at {fmtTime(booking.booking_time)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              <strong>Address:</strong> {addr ? `${addr.title} - ${addr.address_line}, ${addr.city}` : booking.address}
            </Typography>
            {booking.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                Note: {booking.notes}
              </Typography>
            )}
        </Box>

        {/* Payment & Actions */}
        <Box sx={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 1, borderLeft: { md: "1px solid #eee" }, pl: { md: 3 } }}>
            {/* Advance Status */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {booking.is_refunded ? (
                <>
                  <CheckCircleIcon sx={{ fontSize: 16, color: "info.main" }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: "info.main" }}>
                    Advance Refunded
                  </Typography>
                </>
              ) : booking.is_advance_paid ? (
                <>
                  <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: "success.main" }}>
                    Advance Paid
                  </Typography>
                </>
              ) : (
                <>
                  <CancelIcon sx={{ fontSize: 16, color: "warning.main" }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: "warning.main" }}>
                    Advance Pending
                  </Typography>
                  {booking.status === 'pending' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      onClick={() => onPayAdvance(booking)}
                      sx={{ textTransform: 'none', py: 0.25, px: 1.5, fontSize: '0.7rem', ml: 1, borderRadius: 1.5, boxShadow: 'none' }}
                    >
                      Pay
                    </Button>
                  )}
                </>
              )}
            </Box>

            {/* Remaining Payment */}
            {(booking.status === 'in_progress' || booking.status === 'completed') && booking.remaining_payment > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                <Typography variant="caption" color="text.secondary">
                  Remaining: <strong>₹{booking.remaining_payment}</strong>
                </Typography>
                {!booking.is_fully_paid && (
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => onPayRemaining(booking)}
                    sx={{ textTransform: 'none', fontWeight: 'bold', mt: 0.5, borderRadius: 1.5, boxShadow: 'none' }}
                  >
                    Pay Balance
                  </Button>
                )}
                {booking.is_fully_paid && (
                  <Typography variant="caption" fontWeight={700} sx={{ color: "success.main", mt: 0.5 }}>
                    Fully Paid
                  </Typography>
                )}
              </Box>
            )}
        </Box>
      </Box>
    </Paper>
  );
}

/* ---- Page ---- */
export default function Bookings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // redux slices
  const { bookings = [], loading, error } = useSelector((s) => s.bookings);
  const totalCount = useSelector(selectTotalBookingCount);
  const services = useSelector((s) => s.services.list || []);
  const categories = useSelector((s) => s.categories.list || []);

  // local state
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS); // 'all' or specific statuses
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [pastRange, setPastRange] = useState("all");

  // Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card" or "wallet"
  const { balance: walletBalance } = useSelector((state) => state.wallet);

  // snackbar state for transient error display
  const [snackOpen, setSnackOpen] = useState(false);

  // Fetch bookings when filters change
  useEffect(() => {
    // Determine status params
    // If statusFilter is empty or DEFAULT, send 'all' (or omit). Backend expects specific status or handles 'all'.
    // Front-end allows multi-select status? "toggleStatus" implies multi.
    // Backend Implementation currently supports single 'status' param: `qs = qs.filter(status=status_param)`
    // If multi-select is needed, backend needs `status__in`.
    // Let's assume single select or check backend again.
    // Backend code: `if status_param and status_param != 'all': qs = qs.filter(status=status_param)`
    // So backend only supports ONE status.
    // The previous frontend supported MULTIPLE.
    // For now, if multiple are selected, we might have issues.
    // Let's take the first one or sending 'all' if empty.

    // Actually, to support multiple, we should update backend or just pick one. 
    // Let's assume user picks one. But UI is chips.
    // Modify UI to single select? Or update backend to `status__in`?
    // Let's update backend to `status__in` later if needed, but for now let's use the first one or 'all'.

    const queryParams = {
      page,
      search,
      status: statusFilter.length > 0 ? statusFilter[0] : 'all', // Limitation: only one status filter for now
      category: selectedCategory,
      date_from: dateFrom,
      date_to: dateTo,
      ordering: sortBy
    };

    dispatch(fetchBookings(queryParams));

    if (!services.length) dispatch(fetchServices());
    if (!categories.length) dispatch(fetchCategories());
  }, [dispatch, page, search, statusFilter, selectedCategory, dateFrom, dateTo, sortBy, services.length, categories.length]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, selectedCategory, dateFrom, dateTo, sortBy, perPage, search, pastRange]);

  // open snackbar automatically when error changes
  useEffect(() => {
    if (error) setSnackOpen(true);
  }, [error]);

  const toggleStatus = (s) => {
    // Single select behavior for now to match backend simple filter
    setStatusFilter((prev) => prev.includes(s) ? [] : [s]);
  };

  const clearStatusSelection = () => setStatusFilter(DEFAULT_STATUS);
  const clearFilters = () => {
    setStatusFilter(DEFAULT_STATUS);
    setSelectedCategory("");
    setDateFrom("");
    setDateTo("");
    setSortBy("date_desc");
    setPerPage(10);
    setPage(1);
    setSearch("");
    setPastRange("all");
    if (error) dispatch(clearError());
  };

  // date presets
  const applyPastRangeToDates = (range) => {
    const now = new Date();
    const pad = (d) => d.toISOString().slice(0, 10);

    if (range === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    if (range === "today") {
      const ymd = pad(now);
      setDateFrom(ymd);
      setDateTo(ymd);
      return;
    }
    if (range === "this_week") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() + 6);
      setDateFrom(pad(start));
      setDateTo(pad(end));
      return;
    }
    if (range === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateFrom(pad(start));
      setDateTo(pad(end));
      return;
    }
    if (range === "past3m") {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      setDateFrom(start.toISOString().slice(0, 10));
      setDateTo(pad(now));
      return;
    }
  };

  useEffect(() => {
    applyPastRangeToDates(pastRange);
  }, [pastRange]);

  const handleRetry = () => {
    dispatch(fetchBookings({ page }));
  };

  const handleCloseSnack = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackOpen(false);
    dispatch(clearError());
  };

  const handleView = (id) => navigate("/bookings/details", { state: { bookingId: id } });

  const handleDownloadInvoice = async (id) => {
    try {
      const blob = await bookingService.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Invoice download failed", err);
    }
  };

  const handlePayRemaining = async (booking) => {
    try {
      setPaymentMethod("card");
      dispatch(fetchWallet());
      setSelectedBooking({ ...booking, paymentType: "remaining" });
      const secret = await createPaymentIntent(booking.id, "remaining");
      setClientSecret(secret);
      setPayModalOpen(true);
    } catch (err) {
      console.error("Failed to create payment intent", err);
      ShowToast("Could not initiate payment. Please try again.", "error");
    }
  };

  const handlePayAdvance = async (booking) => {
    try {
      setPaymentMethod("card");
      dispatch(fetchWallet());
      setSelectedBooking({ ...booking, paymentType: "advance" });
      const secret = await createPaymentIntent(booking.id, "advance");
      setClientSecret(secret);
      setPayModalOpen(true);
    } catch (err) {
      console.error("Failed to create payment intent", err);
      ShowToast("Could not initiate payment. Please try again.", "error");
    }
  };

  const handleWalletPay = async () => {
    if (!selectedBooking) return;
    try {
      await dispatch(payWithWalletThunk({
        bookingId: selectedBooking.id,
        paymentType: selectedBooking.paymentType
      })).unwrap();

      ShowToast(`${selectedBooking.paymentType === 'advance' ? 'Advance' : 'Remaining balance'} paid via wallet.`, "success");
      setPayModalOpen(false);
      dispatch(fetchBookings({ page }));
    } catch (err) {
      console.error("Wallet payment failed", err);
      ShowToast(err?.message || "Wallet payment failed. Please try again.", "error");
    }
  };

  const handleChat = async (booking) => {
    if (!booking.provider) {
      ShowToast("No provider assigned to this booking yet.", "info");
      return;
    }
    try {
      const response = await bookingService.initiateChat(booking.provider, booking.id);
      navigate('/chat', { state: { roomId: response.id } });
    } catch (err) {
      console.error("Chat initiation error:", err.response?.data || err);
      ShowToast(err.response?.data?.detail || err.message || "Failed to start chat.", "error");
    }
  };

  const paginated = bookings;

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 6 }, maxWidth: 1200, mx: "auto" }}>
      {/* header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Your Bookings</Typography>
          <Typography variant="body2" color="text.secondary">Bookings placed in your account</Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search orders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>),
              endAdornment: search ? (<InputAdornment position="end"><IconButton size="small" onClick={() => setSearch("")}><ClearIcon fontSize="small" /></IconButton></InputAdornment>) : null
            }}
            sx={{ minWidth: 320, bgcolor: "background.paper", borderRadius: 1 }}
          />
          {/* Search triggers largely by effect on 'search' change, simplified for now */}
        </Stack>
      </Stack>

      {/* Snackbar for transient errors */}
      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleCloseSnack}>
        <Alert onClose={handleCloseSnack} severity="error" sx={{ width: "100%" }}>
          {stringifyError(error)}
        </Alert>
      </Snackbar>

      {/* filter row */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2"><strong>{totalCount}</strong> orders found</Typography>

            {/* Past range */}
            <FormControl size="small">
              <Select value={pastRange} onChange={(e) => setPastRange(e.target.value)} displayEmpty sx={{ minWidth: 150 }}>
                <MenuItem value="all">All time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="this_week">This week</MenuItem>
                <MenuItem value="this_month">This month</MenuItem>
                <MenuItem value="past3m">Past 3 months</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* category selector (avatar + name) */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
                renderValue={(val) => {
                  if (!val) return "All categories";
                  const cat = categories.find(c => String(c.id) === String(val));
                  return cat ? cat.name : "Selected";
                }}
              >
                <MenuItem value="">All categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    <ListItemIcon>
                      {c.icon ? (
                        <Avatar src={c.icon} sx={{ width: 28, height: 28 }} />
                      ) : (
                        <Avatar sx={{ width: 28, height: 28 }}>{(c.name || "C")[0]}</Avatar>
                      )}
                    </ListItemIcon>
                    <ListItemText primary={c.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* clear category button only visible when selected */}
            {selectedCategory ? (
              <Tooltip title="Clear category">
                <IconButton size="small" onClick={() => setSelectedCategory("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}

            <Button variant="outlined" onClick={clearFilters}>Reset</Button>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Sort</InputLabel>
              <Select value={sortBy} label="Sort" onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="date_desc">Date (new → old)</MenuItem>
                <MenuItem value="date_asc">Date (old → new)</MenuItem>
                <MenuItem value="price_desc">Price (high → low)</MenuItem>
                <MenuItem value="price_asc">Price (low → high)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {/* status chips */}
        <Stack direction="row" spacing={1} alignItems="center" mt={2} sx={{ flexWrap: "wrap" }}>
          {STATUSES.map((s) => (
            <Chip
              key={s}
              label={s.replace("_", " ")}
              size="small"
              clickable
              onClick={() => toggleStatus(s)}
              color={statusFilter.includes(s) ? statusColor(s) : "default"}
              variant={statusFilter.includes(s) ? "filled" : "outlined"}
              sx={{ textTransform: "capitalize", fontWeight: 600, borderRadius: 2 }}
            />
          ))}

          {JSON.stringify(statusFilter) !== JSON.stringify(DEFAULT_STATUS) && (
            <Button size="small" onClick={clearStatusSelection} sx={{ ml: 1 }}>
              Clear status
            </Button>
          )}
        </Stack>
      </Paper>

      {/* list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : null}

      {!loading && error && bookings.length === 0 ? (
        <Box sx={{ py: 10, textAlign: "center" }}>
          <Typography variant="h6" color="error" gutterBottom>{stringifyError(error)}</Typography>
          <Button variant="contained" onClick={handleRetry}>Retry</Button>
        </Box>
      ) : (
        bookings.map((b) => (
          <OrderCard
            key={b.id}
            booking={b}
            onView={handleView}
            onInvoice={handleDownloadInvoice}
            onPayRemaining={handlePayRemaining}
            onPayAdvance={handlePayAdvance}
            onChat={handleChat}
            services={services}
          />
        ))
      )}

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
          p: 3,
          borderRadius: 3
        }}>
          <Typography variant="h6" mb={1} fontWeight="800">
            {selectedBooking?.paymentType === 'advance' ? 'Advance Payment' : 'Remaining Balance'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {selectedBooking?.paymentType === 'advance'
              ? `You are paying an advance of ₹${selectedBooking?.advance} for your ${selectedBooking?.service_name || 'service'} booking.`
              : `You are paying the remaining balance of ₹${selectedBooking?.remaining_payment} for your ${selectedBooking?.service_name || 'service'} booking.`
            }
          </Typography>

          <Typography variant="subtitle2" fontWeight={700} mb={1}>Select Payment Method</Typography>
          <RadioGroup
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <Paper variant="outlined" sx={{ mb: 1.5, p: 1, borderRadius: 2, borderColor: paymentMethod === 'card' ? 'primary.main' : 'grey.300', bgcolor: paymentMethod === 'card' ? 'primary.50' : 'transparent' }}>
              <FormControlLabel
                value="card"
                control={<Radio size="small" />}
                label={<Typography variant="body2" fontWeight={600}>Credit/Debit Card (Stripe)</Typography>}
                sx={{ width: '100%', m: 0 }}
              />
            </Paper>

            <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, borderColor: paymentMethod === 'wallet' ? 'primary.main' : 'grey.300', bgcolor: paymentMethod === 'wallet' ? 'primary.50' : 'transparent', opacity: Number(walletBalance) < Number(selectedBooking?.paymentType === 'advance' ? selectedBooking?.advance : selectedBooking?.remaining_payment) ? 0.5 : 1 }}>
              <FormControlLabel
                value="wallet"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight={600}>Wallet</Typography>
                    <Chip
                      label={`Balance: ₹${walletBalance}`}
                      size="small"
                      color={Number(walletBalance) >= Number(selectedBooking?.paymentType === 'advance' ? selectedBooking?.advance : selectedBooking?.remaining_payment) ? "success" : "error"}
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                    />
                  </Box>
                }
                sx={{ width: '100%', m: 0, '& .MuiFormControlLabel-label': { flex: 1 } }}
                disabled={Number(walletBalance) < Number(selectedBooking?.paymentType === 'advance' ? selectedBooking?.advance : selectedBooking?.remaining_payment)}
              />
            </Paper>
          </RadioGroup>

          <Divider sx={{ my: 3 }} />

          {paymentMethod === 'card' ? (
            clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm buttonLabel={selectedBooking?.paymentType === 'advance' ? `Pay ₹${selectedBooking?.advance} Now` : `Pay ₹${selectedBooking?.remaining_payment} Now`} />
              </Elements>
            )
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={handleWalletPay}
              disabled={loading || Number(walletBalance) < Number(selectedBooking?.paymentType === 'advance' ? selectedBooking?.advance : selectedBooking?.remaining_payment)}
              sx={{ py: 1.5, fontWeight: "bold", textTransform: 'none' }}
            >
              {loading ? <CircularProgress size={24} /> : `Pay ₹${selectedBooking?.paymentType === 'advance' ? selectedBooking?.advance : selectedBooking?.remaining_payment} with Wallet`}
            </Button>
          )}
        </Box>
      </Modal>

      {/* pagination */}
      {totalCount > perPage && (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount} bookings
          </Typography>
          <Pagination
            count={Math.ceil((totalCount || 0) / perPage)}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}
