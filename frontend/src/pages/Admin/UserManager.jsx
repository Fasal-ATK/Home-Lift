import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { Block, LockOpen } from "@mui/icons-material";
import DataTable from "../../components/admin/DataTable";
import SearchBarWithFilter from "../../components/admin/SearchBar";
import ConfirmModal from "../../components/common/Confirm";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCustomers,
  toggleCustomerActive,
  selectTotalCustomersCount,
} from "../../redux/slices/adminCustomerSlice";

export default function UserManager() {
  const dispatch = useDispatch();
  const { customers, loading } = useSelector((state) => state.adminCustomers);
  const totalCount = useSelector(selectTotalCustomersCount);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "username",
    direction: "asc",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    const params = {
      page,
      search: searchTerm,
      status: filter === 'all' ? undefined : filter
    };
    dispatch(fetchCustomers(params));
  }, [dispatch, page, searchTerm, filter]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleConfirmToggle = () => {
    if (selectedRow) {
      dispatch(
        toggleCustomerActive({
          id: selectedRow.id,
          is_active: !selectedRow.is_active,
        })
      );
    }
    setConfirmOpen(false);
    setSelectedRow(null);
  };

  // Client-side sorting for current page
  const sortedCustomers = [...(customers || [])].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (typeof valA === "string") {
      return sortConfig.direction === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return sortConfig.direction === "asc" ? valA - valB : valB - valA;
  });

  const columns = [
    { key: "id", label: "ID", sortable: true },
    { key: "username", label: "Username", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone", sortable: true },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (row) =>
        row.is_active ? (
          <span style={{ color: "green", fontWeight: "bold" }}>Active</span>
        ) : (
          <span style={{ color: "red", fontWeight: "bold" }}>Blocked</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Tooltip title={row.is_active ? "Block" : "Unblock"}>
          <IconButton
            onClick={() => {
              setSelectedRow(row);
              setConfirmOpen(true);
            }}
          >
            {row.is_active ? (
              <Block sx={{ color: "red" }} />
            ) : (
              <LockOpen sx={{ color: "green" }} />
            )}
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Typography
        variant="h4"
        fontFamily="monospace"
        fontWeight="bold"
        color="black"
      >
        Customer Management
      </Typography>

      <SearchBarWithFilter
        placeholder="Search customers..."
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        onFilterChange={(val) => { setFilter(val); setPage(1); }}
      />

      <DataTable
        columns={columns}
        rows={sortedCustomers}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        // Pagination
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
        message={`Are you sure you want to ${selectedRow?.is_active ? "Block" : "Unblock"
          } "${selectedRow?.username}"?`}
        confirmLabel="Yes"
        cancelLabel="No"
      />
    </Box>
  );
}
