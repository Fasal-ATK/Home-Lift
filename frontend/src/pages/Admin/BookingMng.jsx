import React, { useEffect, useState } from "react";
import { Box, Typography, Select, MenuItem, Stack, Tooltip, IconButton } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../../components/admin/DataTable";
import SearchBarWithFilter from "../../components/admin/SearchBar";
import { fetchAdminBookings, selectTotalAdminBookingsCount, updateBookingStatusAdmin } from "../../redux/slices/admin/bookingMngSlice";
import Chip from "@mui/material/Chip";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/common/Confirm";
import { bookingService } from "../../services/apiServices";

// Status Colors
const getStatusColor = (status) => {
  switch (status) {
    case "pending": return "warning";
    case "confirmed": return "info";
    case "in_progress": return "primary";
    case "completed": return "success";
    case "cancelled": return "error";
    default: return "default";
  }
};

const STATUS_OPTIONS = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

export default function BookingMng() {
  const dispatch = useDispatch();
  const { bookings, loading, actionLoading } = useSelector((state) => state.adminBookings);
  const totalCount = useSelector(selectTotalAdminBookingsCount);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [targetStatus, setTargetStatus] = useState("");

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });

  useEffect(() => {
    const params = {
      page,
      search: searchTerm,
      status: statusFilter === "all" ? undefined : statusFilter
    };
    dispatch(fetchAdminBookings(params));
  }, [dispatch, page, searchTerm, statusFilter]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusClick = (booking, newStatus) => {
    setSelectedBooking(booking);
    setTargetStatus(newStatus);
    setConfirmOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (selectedBooking && targetStatus) {
      try {
        await dispatch(updateBookingStatusAdmin({ id: selectedBooking.id, status: targetStatus })).unwrap();
        toast.success(`Booking #${selectedBooking.id} updated to ${targetStatus}`);
      } catch (err) {
        toast.error(typeof err === 'string' ? err : "Failed to update status");
      } finally {
        setConfirmOpen(false);
        setSelectedBooking(null);
      }
    }
  };

  const handleDownloadInvoice = async (id) => {
    try {
      const blob = await bookingService.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_Booking_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error("Failed to download invoice");
    }
  };

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
      )
    },
    {
      key: "service_name",
      label: "Service",
      sortable: true,
      render: (row) => row.service_name || "-"
    },
    {
      key: "provider_name",
      label: "Provider",
      sortable: true,
      render: (row) => row.provider_name ? (
        <Typography variant="body2">{row.provider_name}</Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">Unassigned</Typography>
      )
    },
    {
      key: "booking_date",
      label: "Slot",
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2">{row.booking_date}</Typography>
          <Typography variant="caption">{row.booking_time}</Typography>
        </Box>
      )
    },
    {
      key: "price",
      label: "Payment",
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2">Total: ₹{row.price}</Typography>
          <Typography variant="caption" color={row.is_advance_paid ? "success.main" : "warning.main"}>
            Advance: ₹{row.advance} ({row.is_advance_paid ? "Paid" : "Pending"})
          </Typography>
        </Box>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Select
          size="small"
          value={row.status}
          onChange={(e) => handleStatusClick(row, e.target.value)}
          sx={{
            minWidth: 120,
            fontSize: '0.75rem',
            '& .MuiSelect-select': { py: 0.5 }
          }}
        >
          {STATUS_OPTIONS.map(s => (
            <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>
              <Chip
                label={s.toUpperCase()}
                size="small"
                color={getStatusColor(s)}
                sx={{ height: 20, fontSize: '0.65rem' }}
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
        <Stack direction="row" spacing={1}>
          <Tooltip title="Download Invoice">
            <IconButton size="small" onClick={() => handleDownloadInvoice(row.id)}>
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // Client-side sort
  const sortedRows = [...bookings].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (typeof valA === "string") {
      return sortConfig.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortConfig.direction === "asc" ? valA - valB : valB - valA;
  });

  return (
    <Box p={3}>
      <Typography variant="h4" fontFamily="monospace" fontWeight="bold" mb={2}>
        Booking Management
      </Typography>

      <SearchBarWithFilter
        placeholder="Search bookings..."
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        onFilterChange={(val) => { setStatusFilter(val); setPage(1); }}
      />

      <DataTable
        columns={columns}
        rows={sortedRows}
        loading={loading}
        sortConfig={sortConfig}
        onSort={handleSort}
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmStatusChange}
        title="Update Booking Status"
        message={`Are you sure you want to change status of Booking #${selectedBooking?.id} to ${targetStatus.toUpperCase()}?`}
        confirmLabel="Update Status"
        color="info"
      />
    </Box>
  );
}
