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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookings, clearError, selectTotalBookingCount } from "../../redux/slices/bookingSlice";
import { fetchServices } from "../../redux/slices/serviceSlice";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { bookingService, createPaymentIntent } from "../../services/apiServices";
import { ShowToast } from "../../components/common/Toast";
import { stripePromise } from "../../../stripe/stripe";
import { Elements } from "@stripe/react-stripe-js";
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
function OrderCard({ booking, onView, onInvoice, onPayRemaining, services }) {
  const addr = booking.address_details;
  const thumb = resolveThumb(booking, services);
  const svcName =
    booking.service_name ||
    (services?.find((s) => String(s.id) === String(booking.service))?.name) ||
    booking.service ||
    "Service";
  const initials = svcName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Paper sx={{ mb: 3, borderRadius: 1.5, overflow: "hidden", boxShadow: 1 }}>
      {/* header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.25, bgcolor: "grey.100", flexWrap: "wrap" }}>
        <Box sx={{ minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">ORDER PLACED</Typography>
          <Typography variant="body2" fontWeight={700}>{fmtDate(booking.created_at || booking.booking_date)}</Typography>
        </Box>

        <Box sx={{ minWidth: 120 }}>
          <Typography variant="caption" color="text.secondary">TOTAL</Typography>
          <Typography variant="body2" fontWeight={700}>₹{booking.price}</Typography>
        </Box>

        <Box sx={{ minWidth: 220, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">SHIP TO</Typography>
          <Typography variant="body2" fontWeight={700} noWrap>
            {addr ? addr.title : booking.full_name}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 220, textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary">ORDER # {booking.id}</Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
            <Button size="small" variant="text" onClick={() => onView(booking.id)} sx={{ textTransform: "none" }}>
              View order details
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => onInvoice(booking.id)}
              sx={{ textTransform: "none" }}
              disabled={booking.status === 'pending' || booking.status === 'cancelled'}
            >
              Invoice ▾
            </Button>
          </Stack>
        </Box>
      </Box>

      <Divider />

      {/* body */}
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
          {booking.status === "completed" || booking.status === "confirmed"
            ? "Delivered"
            : (booking.status || "").replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          {booking.status === "completed" && booking.booking_date ? ` ${fmtDate(booking.booking_date)}` : ""}
        </Typography>

        {/* product area */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Box sx={{ width: 92, height: 92, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.paper", borderRadius: 1, overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
            {thumb ? (
              <Box component="img" src={thumb} alt="thumb" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }} />
            ) : (
              <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.light", fontWeight: 700 }}>{initials}</Avatar>
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              {svcName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {booking.full_name} • {booking.phone}
            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Date:</strong> {booking.booking_date || fmtDate(booking.created_at)} &nbsp; <strong>Time:</strong> {fmtTime(booking.booking_time)}
            </Typography>

            {addr ? (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Address:</strong> {addr.title} — {addr.address_line}
                <br />
                <Typography component="span" variant="body2" color="text.secondary">
                  {addr.city}{addr.district ? `, ${addr.district}` : ""}, {addr.state} {addr.postal_code}
                </Typography>
              </Typography>
            ) : booking.address ? (
              <Typography variant="body2" sx={{ mb: 1 }}><strong>Address:</strong> {booking.address}</Typography>
            ) : null}

            {booking.notes && (
              <Typography variant="body2" color="text.secondary">
                <strong>Notes:</strong> {booking.notes}
              </Typography>
            )}
          </Box>

          <Box sx={{ minWidth: 150, textAlign: "right", display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Chip
              label={(booking.status || "").replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              color={statusColor(booking.status)}
              sx={{ fontWeight: 700, textTransform: "capitalize" }}
            />

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
                    Advance Payment Completed
                  </Typography>
                </>
              ) : (
                <>
                  <CancelIcon sx={{ fontSize: 16, color: "warning.main" }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: "warning.main" }}>
                    Advance Payment Pending
                  </Typography>
                </>
              )}
            </Box>

            {/* Remaining Payment (only show if in_progress or completed) */}
            {(booking.status === 'in_progress' || booking.status === 'completed') && booking.remaining_payment > 0 && (
              <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Remaining: <strong>₹{booking.remaining_payment}</strong>
                </Typography>
                {!booking.is_fully_paid && (
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => onPayRemaining(booking)}
                    sx={{ textTransform: 'none', fontWeight: 'bold' }}
                  >
                    Pay Balance
                  </Button>
                )}
                {booking.is_fully_paid && (
                  <Typography variant="caption" fontWeight={700} sx={{ color: "success.main" }}>
                    Fully Paid
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Paper >
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
      setSelectedBooking(booking);
      const secret = await createPaymentIntent(booking.id, "remaining");
      setClientSecret(secret);
      setPayModalOpen(true);
    } catch (err) {
      console.error("Failed to create payment intent", err);
      ShowToast("Could not initiate payment. Please try again.", "error");
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
          p: 4,
          borderRadius: 2
        }}>
          <Typography variant="h6" mb={2} fontWeight="bold">
            Complete Remaining Payment
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Paying the remaining balance of <strong>₹{selectedBooking?.remaining_payment}</strong> for {selectedBooking?.service_name || 'service'}.
          </Typography>

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm buttonLabel={`Pay ₹${selectedBooking?.remaining_payment} Now`} />
            </Elements>
          )}
        </Box>
      </Modal>

      {/* pagination */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Pagination
          count={Math.ceil((totalCount || 0) / 20)} // Assuming backend page size is 20
          page={page}
          onChange={(_, p) => setPage(p)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
}
