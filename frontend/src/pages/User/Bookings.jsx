// src/pages/User/Bookings.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { fetchBookings, clearError } from "../../redux/slices/bookingSlice";
import { fetchServices } from "../../redux/slices/serviceSlice";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { useNavigate } from "react-router-dom";

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
function OrderCard({ booking, onView, services }) {
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
            <Button size="small" variant="text" sx={{ textTransform: "none" }}>
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
            : booking.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
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

          <Box sx={{ minWidth: 100, textAlign: "right" }}>
            <Chip label={booking.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} color={statusColor(booking.status)} sx={{ fontWeight: 700, textTransform: "capitalize" }} />
          </Box>
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
  const services = useSelector((s) => s.services.list || []);
  const categories = useSelector((s) => s.categories.list || []);

  // local state
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  // default to 'all' as requested
  const [pastRange, setPastRange] = useState("all");

  // snackbar state for transient error display
  const [snackOpen, setSnackOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchBookings());
    if (!services.length) dispatch(fetchServices());
    if (!categories.length) dispatch(fetchCategories());
  }, [dispatch, services.length, categories.length]);

  useEffect(() => setPage(1), [statusFilter, selectedCategory, dateFrom, dateTo, sortBy, perPage, search, pastRange]);

  // open snackbar automatically when error changes
  useEffect(() => {
    if (error) setSnackOpen(true);
  }, [error]);

  const toggleStatus = (s) => setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
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
    // clear store error as well when resetting
    if (error) dispatch(clearError());
  };

  // date presets; "this_week" = today → today+6 days (7 days total)
  const applyPastRangeToDates = (range) => {
    const now = new Date();
    const pad = (d) => d.toISOString().slice(0, 10);

    if (range === "all") {
      // clear bounds — show everything
      setDateFrom("");
      setDateTo("");
      return;
    }

    if (range === "today") {
      // set exact local YYYY-MM-DD for today as both from and to
      const ymd = pad(now);
      setDateFrom(ymd);
      setDateTo(ymd);
      return;
    }

    if (range === "this_week") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() + 6); // today + 6
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
      // start from that date, up to today
      setDateFrom(start.toISOString().slice(0, 10));
      setDateTo(pad(now));
      return;
    }
  };

  useEffect(() => {
    applyPastRangeToDates(pastRange);
  }, [pastRange]);

  // handlers for snackbar and retry
  const handleRetry = () => {
    dispatch(fetchBookings());
  };

  const handleCloseSnack = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackOpen(false);
    dispatch(clearError());
  };

  // ---------- compute orders count within the currently selected date range (always uses created_at) ----------
  const ordersInRange = useMemo(() => {
    if (!Array.isArray(bookings) || bookings.length === 0) return 0;

    // If user picked "all", show total
    if (pastRange === "all") return bookings.length;

    // Build local YMD strings for bounds
    const fromStr = dateFrom || null;
    const toStr =
      dateTo ||
      (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      })();

    return bookings.reduce((acc, b) => {
      // Always use created_at for "order placed"
      const raw = b.created_at || b.booking_date;
      const dStr = toLocalYMD(raw);
      if (!dStr) return acc;
      if (fromStr && dStr < fromStr) return acc;
      if (toStr && dStr > toStr) return acc;
      return acc + 1;
    }, 0);
  }, [bookings, dateFrom, dateTo, pastRange]);

  // filtering + sorting (client side) — date filtering always uses created_at (order placed)
  const filteredSorted = useMemo(() => {
    let list = Array.isArray(bookings) ? bookings.slice() : [];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => {
        const combined = `${b.service_name || ""} ${b.service || ""} ${b.full_name || ""} ${b.phone || ""}`.toLowerCase();
        return combined.includes(q);
      });
    }

    // category: use categories list — match services that belong to selectedCategory
    if (selectedCategory) {
      const serviceIdsForCat = services
        .filter((s) => {
          const cat = s.category;
          if (!cat) return false;
          if (typeof cat === "object") return String(cat.id ?? cat.name) === String(selectedCategory);
          return String(cat) === String(selectedCategory) || String(s.category_name) === String(selectedCategory);
        })
        .map((s) => String(s.id));
      list = list.filter((b) => serviceIdsForCat.includes(String(b.service)));
    }

    if (statusFilter && statusFilter.length) {
      list = list.filter((b) => statusFilter.includes(b.status));
    }

    // apply date filtering for "order placed" only if user didn't pick 'all'
    if (pastRange !== "all") {
      const fromStr = dateFrom || null;
      const toStr =
        dateTo ||
        (() => {
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        })();

      list = list.filter((b) => {
        const raw = b.created_at || b.booking_date;
        const dStr = toLocalYMD(raw);
        if (!dStr) return false;
        if (fromStr && dStr < fromStr) return false;
        if (toStr && dStr > toStr) return false;
        return true;
      });
    }

    list.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.booking_date || b.created_at) - new Date(a.booking_date || a.created_at);
      if (sortBy === "date_asc") return new Date(a.booking_date || a.created_at) - new Date(b.booking_date || b.created_at);
      if (sortBy === "price_desc") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "price_asc") return Number(a.price || 0) - Number(b.price || 0);
      return 0;
    });

    return list;
  }, [bookings, statusFilter, selectedCategory, dateFrom, dateTo, sortBy, search, services, pastRange]);

  const total = filteredSorted.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredSorted.slice(start, start + perPage);
  }, [filteredSorted, page, perPage]);

  const handleView = (id) => navigate("/bookings/details", { state: { bookingId: id } });

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 6 }, maxWidth: 1200, mx: "auto" }}>
      {/* header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Your Orders</Typography>
          <Typography variant="body2" color="text.secondary">Orders placed in your account</Typography>
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
          <Button variant="contained" startIcon={<FilterListIcon />}>Search Orders</Button>
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
            <Typography variant="body2"><strong>{ordersInRange}</strong> orders placed in</Typography>

            {/* Past range */}
            <FormControl size="small">
              <Select value={pastRange} onChange={(e) => setPastRange(e.target.value)} displayEmpty sx={{ minWidth: 150 }}>
                <MenuItem value="all">All</MenuItem>
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

            <Button variant="outlined" onClick={clearFilters}>Reset filters</Button>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Sort</InputLabel>
              <Select value={sortBy} label="Sort" onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="date_desc">Date (new → old)</MenuItem>
                <MenuItem value="date_asc">Date (old → new)</MenuItem>
                <MenuItem value="price_desc">Price (high → low)</MenuItem>
                <MenuItem value="price_asc">Price (low → high)</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Per page</InputLabel>
              <Select value={perPage} label="Per page" onChange={(e) => setPerPage(Number(e.target.value))}>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
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
      {loading && bookings.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : null}

      {/* If there's an error and no bookings, show full fallback; otherwise show list */}
      {!loading && error && bookings.length === 0 ? (
        <Box sx={{ py: 10, textAlign: "center" }}>
          <Typography variant="h6" color="error" gutterBottom>
            {stringifyError(error)}
          </Typography>
          <Button variant="contained" onClick={handleRetry} sx={{ mr: 1 }}>
            Retry
          </Button>
          <Button variant="outlined" onClick={() => dispatch(clearError())}>
            Dismiss
          </Button>
        </Box>
      ) : (
        paginated.map((b) => (
          <OrderCard key={b.id} booking={b} onView={handleView} services={services} />
        ))
      )}

      {/* pagination */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" showFirstButton showLastButton />
      </Box>
    </Box>
  );
}
