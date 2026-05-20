import React, { useEffect, useState } from "react";
import {
  Box, Typography, Select, MenuItem, Stack, Tooltip, IconButton,
  Paper, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Divider, TextField,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../../components/admin/DataTable";
import SearchBarWithFilter from "../../components/admin/SearchBar";
import {
  fetchAdminBookings,
  selectTotalAdminBookingsCount,
  updateBookingStatusAdmin,
} from "../../redux/slices/admin/bookingMngSlice";
import {
  FileDownload as FileDownloadIcon,
  InfoOutlined as InfoOutlinedIcon,
  BookOnline as BookOnlineIcon
} from "@mui/icons-material";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/common/Confirm";
import { bookingService, providerService } from "../../services/apiServices";
import AssignProviderModal from "../../components/admin/modal/AssignProviderModal";

// ── Constants ──────────────────────────────────────────────────────────────
const getStatusColor = (s) => {
  switch (s) {
    case "pending":     return "warning";
    case "confirmed":   return "info";
    case "in_progress": return "primary";
    case "completed":   return "success";
    case "cancelled":   return "error";
    default:            return "default";
  }
};

const STATUS_OPTIONS = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

const BOOKING_FILTER_OPTIONS = [
  { value: "all",         label: "All Statuses" },
  { value: "pending",     label: "Pending" },
  { value: "confirmed",   label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed" },
  { value: "cancelled",   label: "Cancelled" },
];

// ── Stat Card ───────────────────────────────────────────────────────────────
const SAFE_COLORS = {
  success: { border: "#c8e6c9", bg: "#f1f8e9", text: "success.main" },
  warning: { border: "#ffe0b2", bg: "#fff8e1", text: "warning.main" },
  error:   { border: "#ffcdd2", bg: "#fff5f5", text: "error.main"   },
  info:    { border: "#b3e5fc", bg: "#e3f2fd", text: "info.main"    },
  primary: { border: "#bbdefb", bg: "#e3f2fd", text: "primary.main" },
  grey:    { border: "#e0e0e0", bg: "#fafafa", text: "text.primary"  },
};

function StatCard({ label, value, color = "grey" }) {
  const c = SAFE_COLORS[color] || SAFE_COLORS.grey;
  return (
    <Paper elevation={0} sx={{
      p: 2, borderRadius: 3, textAlign: "center",
      border: `1.5px solid ${c.border}`,
      bgcolor: c.bg, minWidth: 120, flex: 1,
    }}>
      <Typography variant="h5" fontWeight="bold" color={c.text}>
        {value ?? "—"}
      </Typography>
      <Typography variant="caption" color="text.secondary" textTransform="capitalize">
        {label}
      </Typography>
    </Paper>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────
function BookingDetailModal({ open, onClose, booking }) {
  if (!booking) return null;

  const rows = [
    ["Booking ID",   `#${booking.id}`],
    ["Customer",     booking.full_name],
    ["Phone",        booking.phone],
    ["Service",      booking.service_name],
    ["Provider",     booking.provider_name || "Unassigned"],
    ["Date",         booking.booking_date],
    ["Time",         booking.booking_time],
    ["Status",       booking.status],
    ["Original Price", `₹${booking.original_price || booking.price}`],
    ...(parseFloat(booking.discount_amount || 0) > 0 ? [["Discount Applied", `-₹${booking.discount_amount}`]] : []),
    ["Final Total",  `₹${booking.price}`],
    ["Advance",      `₹${booking.advance}`],
    ["Advance Paid", booking.is_advance_paid ? "Yes" : "No"],
    ["Fully Paid",   booking.is_fully_paid  ? "Yes" : "No"],
    ["Notes",        booking.notes || "—"],
    ["Address",      booking.address_details
      ? `${booking.address_details.address_line || ""}, ${booking.address_details.city || ""}, ${booking.address_details.state || ""}`.trim()
      : "—"],
    ["Created",      new Date(booking.created_at).toLocaleString()],
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: "bold", pb: 0 }}>
        Booking Details — #{booking.id}
      </DialogTitle>
      <Divider sx={{ mt: 1 }} />
      <DialogContent>
        <Stack spacing={1} mt={1}>
          {rows.map(([label, val]) => (
            <Box key={label} display="flex" justifyContent="space-between" py={0.5}
              sx={{ borderBottom: "1px solid #f0f0f0" }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
                {label}
              </Typography>
              <Typography variant="body2" fontWeight="medium" textAlign="right">
                {label === "Status"
                  ? <Chip size="small" label={val.replace("_", " ").toUpperCase()} color={getStatusColor(val)} />
                  : val}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function BookingMng() {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector((state) => state.adminBookings);
  const totalCount = useSelector(selectTotalAdminBookingsCount);

  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [page, setPage]                 = useState(1);
  const rowsPerPage                     = 10;

  // Confirmation modal
  const [confirmOpen, setConfirmOpen]       = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [targetStatus, setTargetStatus]     = useState("");

  // Provider assign modal
  const [assignModalOpen, setAssignModalOpen]     = useState(false);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [providersLoading, setProvidersLoading]   = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState("");

  // Detail modal
  const [detailOpen, setDetailOpen]   = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = {
      page,
      search:     searchTerm || undefined,
      status:     statusFilter !== "all" ? statusFilter : undefined,
      date_from:  dateFrom || undefined,
      date_to:    dateTo   || undefined,
    };
    dispatch(fetchAdminBookings(params));
  }, [dispatch, page, searchTerm, statusFilter, dateFrom, dateTo]);

  // ── Derived Stats ──────────────────────────────────────────────────────────
  // Counts across the CURRENT page for a quick summary
  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = (bookings || []).filter((b) => b.status === s).length;
    return acc;
  }, {});

  // ── Handlers ───────────────────────────────────────────────────────────────
  const resetPage = () => setPage(1);

  const handleStatusClick = async (booking, newStatus) => {
    if (newStatus === booking.status) return;
    setSelectedBooking(booking);
    setTargetStatus(newStatus);

    const needsProvider =
      (newStatus === "confirmed" || newStatus === "in_progress") && !booking.provider_name;

    if (needsProvider) {
      setAssignModalOpen(true);
      setProvidersLoading(true);
      try {
        const providers = await providerService.getAvailableProviders(booking.service);
        setAvailableProviders(providers);
      } catch {
        toast.error("Failed to load providers");
        setAssignModalOpen(false);
      } finally {
        setProvidersLoading(false);
      }
    } else {
      setConfirmOpen(true);
    }
  };

  const handleConfirmStatusChange = async (providerId = null) => {
    if (!selectedBooking || !targetStatus) return;
    try {
      await dispatch(
        updateBookingStatusAdmin({
          id:         selectedBooking.id,
          status:     targetStatus,
          providerId: providerId || undefined,
        })
      ).unwrap();
      toast.success(`Booking #${selectedBooking.id} → ${targetStatus}`);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update status");
    } finally {
      setConfirmOpen(false);
      setAssignModalOpen(false);
      setSelectedBooking(null);
      setSelectedProviderId("");
    }
  };

  const handleDownloadInvoice = async (id) => {
    try {
      const blob = await bookingService.downloadInvoice(id);
      const url  = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `Invoice_Booking_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    { key: "id", label: "ID", sortable: true },
    {
      key: "full_name",
      label: "Customer",
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">{row.full_name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.phone}</Typography>
        </Box>
      ),
    },
    {
      key: "service_name",
      label: "Service",
      sortable: true,
      render: (row) => row.service_name || "—",
    },
    {
      key: "provider_name",
      label: "Provider",
      sortable: true,
      render: (row) =>
        row.provider_name ? (
          <Typography variant="body2">{row.provider_name}</Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">Unassigned</Typography>
        ),
    },
    {
      key: "booking_date",
      label: "Slot",
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2">{row.booking_date}</Typography>
          <Typography variant="caption" color="text.secondary">{row.booking_time}</Typography>
        </Box>
      ),
    },
    {
      key: "price",
      label: "Payment",
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2">₹{row.price}</Typography>
          <Typography
            variant="caption"
            color={row.is_advance_paid ? "success.main" : "warning.main"}
          >
            Adv: ₹{row.advance} ({row.is_advance_paid ? "Paid" : "Pending"})
          </Typography>
        </Box>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Select
          size="small"
          value={row.status}
          onChange={(e) => handleStatusClick(row, e.target.value)}
          sx={{ minWidth: 130, fontSize: "0.75rem", "& .MuiSelect-select": { py: 0.5 } }}
        >
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s} sx={{ fontSize: "0.8rem" }}>
              <Chip
                label={s.replace("_", " ").toUpperCase()}
                size="small"
                color={getStatusColor(s)}
                sx={{ height: 20, fontSize: "0.65rem" }}
              />
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => { setDetailBooking(row); setDetailOpen(true); }}
            >
              <InfoOutlinedIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Invoice">
            <IconButton size="small" onClick={() => handleDownloadInvoice(row.id)}>
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box p={3}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <BookOnlineIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" fontFamily="monospace" fontWeight="bold">
            Booking Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer bookings and monitor their statuses
          </Typography>
        </Box>
      </Stack>

      {/* Stats Summary */}
      <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
        <StatCard label="Total (page)" value={bookings?.length}   color="grey" />
        <StatCard label="Pending"      value={statusCounts.pending}     color="warning" />
        <StatCard label="Confirmed"    value={statusCounts.confirmed}   color="info" />
        <StatCard label="In Progress"  value={statusCounts.in_progress} color="primary" />
        <StatCard label="Completed"    value={statusCounts.completed}   color="success" />
        <StatCard label="Cancelled"    value={statusCounts.cancelled}   color="error" />
      </Stack>

      {/* Filters */}
      <SearchBarWithFilter
        placeholder="Search by customer, service, provider or ID..."
        onSearch={(val) => { setSearchTerm(val); resetPage(); }}
        onFilterChange={(val) => { setStatusFilter(val); resetPage(); }}
        filterOptions={BOOKING_FILTER_OPTIONS}
      />

      {/* Date Range */}
      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="From Date"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
          sx={{ width: 180 }}
        />
        <TextField
          label="To Date"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
          sx={{ width: 180 }}
        />
        {(dateFrom || dateTo) && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => { setDateFrom(""); setDateTo(""); resetPage(); }}
            sx={{ textTransform: "none" }}
          >
            Clear Dates
          </Button>
        )}
      </Stack>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={bookings || []}
        loading={loading}
        emptyMessage="No bookings found."
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />

      {/* Status Change Confirm */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => handleConfirmStatusChange()}
        title="Update Booking Status"
        message={`Change Booking #${selectedBooking?.id} to ${targetStatus.replace("_", " ").toUpperCase()}?`}
        confirmLabel="Update Status"
        color="info"
      />

      {/* Assign Provider Modal */}
      <AssignProviderModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onConfirm={() => handleConfirmStatusChange(selectedProviderId)}
        providers={availableProviders}
        loading={providersLoading}
        selectedProviderId={selectedProviderId}
        setSelectedProviderId={setSelectedProviderId}
      />

      {/* Booking Detail Modal */}
      <BookingDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        booking={detailBooking}
      />
    </Box>
  );
}
