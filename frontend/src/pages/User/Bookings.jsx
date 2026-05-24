import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
import { getErrorMessage } from "../../utils/errorHelper";

import Modal from "@mui/material/Modal";

const STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

const STATUS_CONFIG = {
  pending: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Pending", muiColor: "warning" },
  confirmed: { color: "#0369a1", bg: "#eff6ff", border: "#bfdbfe", label: "Confirmed", muiColor: "info" },
  in_progress: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", label: "In Progress", muiColor: "primary" },
  completed: { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", label: "Completed", muiColor: "success" },
  cancelled: { color: "#dc2626", bg: "#fff1f2", border: "#fecdd3", label: "Cancelled", muiColor: "error" },
};

const statusColor = (status) => STATUS_CONFIG[status]?.muiColor || "default";

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
const stringifyError = (err) => getErrorMessage(err);

/* ---- OrderCard ---- */
function OrderCard({ booking, onView, onInvoice, onPayRemaining, onPayAdvance, onChat, services }) {
  const addr = booking.address_details;
  const thumb = resolveThumb(booking, services);
  const svcName =
    booking.service_name ||
    (services?.find((s) => String(s.id) === String(booking.service))?.name) ||
    booking.service ||
    "Service";
  const initials = svcName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const statusCfg = STATUS_CONFIG[booking.status] || {};
  const hasDiscount = parseFloat(booking.discount_amount || 0) > 0;

  return (
    <Paper elevation={0} sx={{
      mb: 2,
      borderRadius: 2.5,
      overflow: "hidden",
      border: "1px solid",
      borderColor: "grey.200",
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.07)" },
    }}>
      {/* Header bar */}
      <Box sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 2, px: 2.5, py: 1.2,
        bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "grey.100",
        flexWrap: "wrap",
      }}>
        <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ letterSpacing: 0.8, fontSize: '0.6rem' }}>PLACED</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>{fmtDate(booking.created_at || booking.booking_date)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ letterSpacing: 0.8, fontSize: '0.6rem' }}>TOTAL</Typography>
            {hasDiscount ? (
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Typography variant="caption" color="text.disabled" sx={{ textDecoration: 'line-through' }}>₹{booking.original_price}</Typography>
                <Typography variant="body2" fontWeight={700} color="success.main" sx={{ fontSize: '0.8rem' }}>₹{booking.price}</Typography>
              </Stack>
            ) : (
              <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>₹{booking.price}</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ letterSpacing: 0.8, fontSize: '0.6rem' }}>ORDER #</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>{booking.id}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.8} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            onClick={() => onView(booking.id)}
            sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700, fontSize: '0.75rem', py: 0.4 }}
          >
            Details
          </Button>
          {['confirmed', 'ongoing', 'in_progress', 'completed'].includes(booking.status) && (
            <Button
              size="small" variant="outlined" color="primary"
              onClick={() => onChat(booking)}
              sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700, fontSize: '0.75rem', py: 0.4 }}
            >
              Chat
            </Button>
          )}
          <Button
            size="small" variant="outlined" color="inherit"
            onClick={() => onInvoice(booking.id)}
            sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 700, fontSize: '0.75rem', py: 0.4, borderColor: 'grey.300', color: 'text.secondary' }}
            disabled={booking.status === 'pending' || booking.status === 'cancelled'}
          >
            Invoice
          </Button>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ px: 2.5, py: 2, display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Service image + info */}
        <Box sx={{ display: "flex", gap: 1.8, alignItems: "center", flex: 1.5, minWidth: 240 }}>
          <Box sx={{ width: 60, height: 60, flexShrink: 0, borderRadius: 2, overflow: "hidden", bgcolor: "grey.100" }}>
            {thumb ? (
              <Box component="img" src={thumb} alt="thumb" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Avatar sx={{ width: 60, height: 60, bgcolor: "primary.light", fontWeight: 700, borderRadius: 2, fontSize: '1rem' }}>{initials}</Avatar>
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.2, mb: 0.5 }}>{svcName}</Typography>
            <Chip
              label={statusCfg.label || booking.status}
              size="small"
              sx={{
                height: 20, fontSize: '0.65rem', fontWeight: 700, mb: 0.5,
                bgcolor: statusCfg.bg, color: statusCfg.color,
                border: `1px solid ${statusCfg.border || 'transparent'}`,
              }}
            />
            <Typography variant="caption" color="text.secondary" display="block">
              {booking.full_name} · {booking.phone}
            </Typography>
          </Box>
        </Box>

        {/* Schedule & Address */}
        <Box sx={{ flex: 1.5, minWidth: 230, borderLeft: { md: "1px solid #f1f5f9" }, pl: { md: 2.5 } }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.72rem' }}>
            📅 {booking.booking_date || fmtDate(booking.created_at)} · {fmtTime(booking.booking_time)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{
            mt: 0.5, fontSize: '0.72rem',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            📍 {addr ? `${addr.address_line}, ${addr.city}` : booking.address}
          </Typography>
          {booking.notes && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.4, fontStyle: 'italic', fontSize: '0.72rem' }}>
              💬 {booking.notes}
            </Typography>
          )}
        </Box>

        {/* Payment status & quick-pay */}
        <Box sx={{ flex: 1, minWidth: 170, borderLeft: { md: "1px solid #f1f5f9" }, pl: { md: 2.5 }, display: 'flex', flexDirection: 'column', gap: 0.8, alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
          {booking.is_refunded ? (
            <Chip label="Advance Refunded" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#eff6ff', color: '#0369a1' }} />
          ) : booking.is_advance_paid ? (
            <Chip icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />} label="Advance Paid" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f0fdf4', color: '#15803d', '& .MuiChip-icon': { fontSize: 12 } }} />
          ) : (
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Chip label="Advance Due" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#fffbeb', color: '#b45309' }} />
              {booking.status === 'pending' && (
                <Button size="small" variant="contained" color="warning"
                  onClick={() => onPayAdvance(booking)}
                  sx={{ textTransform: 'none', py: 0.2, px: 1.2, fontSize: '0.68rem', borderRadius: 1.5, boxShadow: 'none', minWidth: 0 }}
                >
                  Pay
                </Button>
              )}
            </Stack>
          )}

          {(booking.status === 'in_progress' || booking.status === 'completed') && booking.remaining_payment > 0 && (
            <Stack direction="row" spacing={0.8} alignItems="center">
              {booking.is_fully_paid ? (
                <Chip icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />} label="Fully Paid" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f0fdf4', color: '#15803d', '& .MuiChip-icon': { fontSize: 12 } }} />
              ) : (
                <>
                  <Typography variant="caption" fontWeight={700} color="primary.main">₹{booking.remaining_payment} due</Typography>
                  <Button size="small" variant="contained" color="primary"
                    onClick={() => onPayRemaining(booking)}
                    sx={{ textTransform: 'none', py: 0.2, px: 1.2, fontSize: '0.68rem', borderRadius: 1.5, boxShadow: 'none', minWidth: 0 }}
                  >
                    Pay
                  </Button>
                </>
              )}
            </Stack>
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
  const { list: services = [], isFullList: servicesFull } = useSelector((s) => s.services);
  const { list: categories = [], isFullList: categoriesFull } = useSelector((s) => s.categories);

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

    if (!servicesFull) dispatch(fetchServices({ no_pagination: true }));
    if (!categoriesFull) dispatch(fetchCategories({ no_pagination: true }));
  }, [dispatch, page, search, statusFilter, selectedCategory, dateFrom, dateTo, sortBy, servicesFull, categoriesFull]);

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
      ShowToast(getErrorMessage(err, "Wallet payment failed. Please try again."), "error");
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
    <Box sx={{ py: 3, px: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mb={3} spacing={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800}>My Bookings</Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {totalCount > 0 ? `${totalCount} booking${totalCount !== 1 ? 's' : ''} found` : 'No bookings yet'}
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Search by service, name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>),
            endAdornment: search ? (<InputAdornment position="end"><IconButton size="small" onClick={() => setSearch("")}><ClearIcon fontSize="small" /></IconButton></InputAdornment>) : null
          }}
          sx={{ minWidth: { sm: 280 }, bgcolor: "background.paper", borderRadius: 2 }}
        />
      </Stack>

      {/* Snackbar for transient errors */}
      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleCloseSnack}>
        <Alert onClose={handleCloseSnack} severity="error" sx={{ width: "100%" }}>
          {stringifyError(error)}
        </Alert>
      </Snackbar>

      {/* Filter bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'grey.200' }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="center" justifyContent="space-between" mb={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <FormControl size="small">
              <Select value={pastRange} onChange={(e) => setPastRange(e.target.value)} displayEmpty
                sx={{ minWidth: 130, fontSize: '0.82rem', fontWeight: 600, borderRadius: 1.5 }}
              >
                <MenuItem value="all">All time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="this_week">This week</MenuItem>
                <MenuItem value="this_month">This month</MenuItem>
                <MenuItem value="past3m">Past 3 months</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel sx={{ fontSize: '0.82rem' }}>Category</InputLabel>
              <Select
                value={selectedCategory} label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{ fontSize: '0.82rem', borderRadius: 1.5 }}
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
                      {c.icon ? <Avatar src={c.icon} sx={{ width: 24, height: 24 }} /> : <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>{(c.name || "C")[0]}</Avatar>}
                    </ListItemIcon>
                    <ListItemText primary={c.name} primaryTypographyProps={{ fontSize: '0.82rem' }} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ fontSize: '0.82rem' }}>Sort</InputLabel>
              <Select value={sortBy} label="Sort" onChange={(e) => setSortBy(e.target.value)} sx={{ fontSize: '0.82rem', borderRadius: 1.5 }}>
                <MenuItem value="date_desc">Newest first</MenuItem>
                <MenuItem value="date_asc">Oldest first</MenuItem>
                <MenuItem value="price_desc">Price: High → Low</MenuItem>
                <MenuItem value="price_asc">Price: Low → High</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {selectedCategory && (
              <Tooltip title="Clear category">
                <IconButton size="small" onClick={() => setSelectedCategory("")} sx={{ bgcolor: 'grey.100' }}><ClearIcon fontSize="small" /></IconButton>
              </Tooltip>
            )}
            <Button size="small" variant="outlined" onClick={clearFilters}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, fontSize: '0.78rem', borderColor: 'grey.300', color: 'text.secondary' }}
            >
              Reset All
            </Button>
          </Stack>
        </Stack>

        {/* Status filter chips */}
        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mr: 0.5 }}>Status:</Typography>
          {STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s] || {};
            const active = statusFilter.includes(s);
            return (
              <Chip
                key={s}
                label={cfg.label || s.replace("_", " ")}
                size="small"
                clickable
                onClick={() => toggleStatus(s)}
                sx={{
                  textTransform: "capitalize", fontWeight: 700, fontSize: '0.68rem', height: 24,
                  bgcolor: active ? cfg.bg : 'grey.100',
                  color: active ? cfg.color : 'text.secondary',
                  border: `1px solid ${active ? (cfg.border || cfg.color) : '#e5e7eb'}`,
                  transition: 'all 0.15s',
                }}
              />
            );
          })}
          {statusFilter.length > 0 && (
            <Button size="small" onClick={clearStatusSelection}
              sx={{ fontSize: '0.72rem', textTransform: 'none', color: 'text.secondary', fontWeight: 600, ml: 0.5, p: 0, minWidth: 0 }}
            >
              Clear
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
      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: 460 }, bgcolor: 'background.paper',
          borderRadius: 3, boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          maxHeight: '90vh', overflowY: 'auto'
        }}>
          <Box sx={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} mb={0.5}>
              {selectedBooking?.paymentType === 'advance' ? 'Pay Advance' : 'Pay Remaining Balance'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2.5}>
              {selectedBooking?.paymentType === 'advance'
                ? `₹${selectedBooking?.advance} advance for ${selectedBooking?.service_name || 'service'}`
                : `₹${selectedBooking?.remaining_payment} remaining for ${selectedBooking?.service_name || 'service'}`
              }
            </Typography>

            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem', display: 'block', mb: 1 }}>
              Payment Method
            </Typography>

            <Stack spacing={1} mb={2.5}>
              {[
                { value: 'card', label: 'Credit / Debit Card', sub: 'Powered by Stripe' },
                {
                  value: 'wallet', label: 'Wallet',
                  sub: `Balance: ₹${walletBalance}`,
                  disabled: Number(walletBalance) < Number(selectedBooking?.paymentType === 'advance' ? selectedBooking?.advance : selectedBooking?.remaining_payment),
                  balanceOk: Number(walletBalance) >= Number(selectedBooking?.paymentType === 'advance' ? selectedBooking?.advance : selectedBooking?.remaining_payment),
                },
              ].map((opt) => (
                <Box
                  key={opt.value}
                  onClick={() => !opt.disabled && setPaymentMethod(opt.value)}
                  sx={{
                    p: 1.5, borderRadius: 2, border: '1.5px solid',
                    borderColor: paymentMethod === opt.value ? '#6366f1' : 'grey.200',
                    bgcolor: paymentMethod === opt.value ? '#f5f3ff' : 'transparent',
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    opacity: opt.disabled ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 1.5, transition: 'all 0.15s',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{opt.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{opt.sub}</Typography>
                  </Box>
                  {opt.value === 'wallet' && (
                    <Chip
                      label={`₹${walletBalance}`} size="small"
                      sx={{
                        height: 18, fontSize: '0.6rem', fontWeight: 700,
                        bgcolor: opt.balanceOk ? '#f0fdf4' : '#fff1f2',
                        color: opt.balanceOk ? '#16a34a' : '#dc2626'
                      }}
                    />
                  )}
                  <Radio checked={paymentMethod === opt.value} size="small" sx={{ p: 0 }}
                    onClick={() => !opt.disabled && setPaymentMethod(opt.value)}
                  />
                </Box>
              ))}
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {paymentMethod === 'card' ? (
              clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    buttonLabel={selectedBooking?.paymentType === 'advance'
                      ? `Pay ₹${selectedBooking?.advance} Now`
                      : `Pay ₹${selectedBooking?.remaining_payment} Now`
                    }
                  />
                </Elements>
              )
            ) : (
              <Button
                variant="contained" fullWidth onClick={handleWalletPay}
                disabled={loading || Number(walletBalance) < Number(selectedBooking?.paymentType === 'advance' ? selectedBooking?.advance : selectedBooking?.remaining_payment)}
                sx={{ py: 1.3, fontWeight: 700, textTransform: 'none', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 2 }}
              >
                {loading
                  ? <CircularProgress size={22} color="inherit" />
                  : `Pay ₹${selectedBooking?.paymentType === 'advance' ? selectedBooking?.advance : selectedBooking?.remaining_payment} with Wallet`
                }
              </Button>
            )}
          </Box>
        </Box>
      </Modal>

      {/* Pagination */}
      {totalCount > perPage && (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount} bookings
          </Typography>
          <Pagination
            count={Math.ceil((totalCount || 0) / perPage)}
            page={page}
            onChange={(_, p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            color="primary"
            shape="rounded"
            size="small"
            showFirstButton showLastButton
          />
        </Box>
      )}
    </Box>
  );
}
