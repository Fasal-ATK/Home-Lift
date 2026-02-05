import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../../components/admin/DataTable";
import SearchBarWithFilter from "../../components/admin/SearchBar";
import { fetchAdminBookings, selectTotalAdminBookingsCount } from "../../redux/slices/admin/bookingMngSlice";
import Chip from "@mui/material/Chip";

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

export default function BookingMng() {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector((state) => state.adminBookings);
  const totalCount = useSelector(selectTotalAdminBookingsCount);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Sort config (client-side for current page for now, or could map to server)
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });

  useEffect(() => {
    const params = {
      page,
      search: searchTerm,
      status: statusFilter === "all" ? undefined : statusFilter
      // Date filtering could be added here if we add DateRangePicker to SearchBar
    };
    dispatch(fetchAdminBookings(params));
  }, [dispatch, page, searchTerm, statusFilter]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const columns = [
    { key: "id", label: "ID", sortable: true },
    {
      key: "service",
      label: "Service",
      render: (row) => row.service?.name || "-"
    },
    {
      key: "user",
      label: "User",
      render: (row) => row.user?.username || row.user?.email || "-"
    },
    {
      key: "provider",
      label: "Provider",
      render: (row) => row.provider?.user?.username || "-"
    },
    { key: "booking_date", label: "Date", sortable: true },
    { key: "price", label: "Price", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Chip
          label={row.status.toUpperCase()}
          color={getStatusColor(row.status)}
          size="small"
          sx={{ fontWeight: "bold" }}
        />
      ),
    },
  ];

  // Client-side sort for current page
  const sortedRows = [...bookings].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    // Handle nested
    if (sortConfig.key === 'service') {
      valA = a.service?.name || '';
      valB = b.service?.name || '';
    }

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
        // Pagination
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />
    </Box>
  );
}
