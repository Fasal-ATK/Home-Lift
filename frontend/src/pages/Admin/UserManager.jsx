import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, IconButton, Tooltip, Stack, Paper, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Divider, Avatar,
} from "@mui/material";
import { Block, LockOpen, InfoOutlined as InfoIcon, Person } from "@mui/icons-material";
import DataTable from "../../components/admin/DataTable";
import SearchBarWithFilter from "../../components/admin/SearchBar";
import ConfirmModal from "../../components/common/Confirm";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCustomers,
  toggleCustomerActive,
  selectTotalCustomersCount,
} from "../../redux/slices/adminCustomerSlice";

// ── Constants ────────────────────────────────────────────────────────────────
const USER_FILTER_OPTIONS = [
  { value: "all",      label: "All Users"   },
  { value: "active",   label: "Active"      },
  { value: "inactive", label: "Blocked"     },
];

const SAFE_COLORS = {
  success: { border: "#c8e6c9", bg: "#f1f8e9", text: "success.main" },
  warning: { border: "#ffe0b2", bg: "#fff8e1", text: "warning.main" },
  error:   { border: "#ffcdd2", bg: "#fff5f5", text: "error.main"   },
  grey:    { border: "#e0e0e0", bg: "#fafafa", text: "text.primary"  },
};

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = "grey" }) {
  const c = SAFE_COLORS[color] || SAFE_COLORS.grey;
  return (
    <Paper elevation={0} sx={{
      p: 2, flex: 1, borderRadius: 3, textAlign: "center",
      border: `1.5px solid ${c.border}`, bgcolor: c.bg, minWidth: 120,
    }}>
      <Typography variant="h5" fontWeight="bold" color={c.text}>{value ?? "—"}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

// ── User Detail Modal ─────────────────────────────────────────────────────────
function UserDetailModal({ open, onClose, user }) {
  if (!user) return null;
  const rows = [
    ["User ID",   user.id],
    ["Username",  user.username],
    ["Full Name", `${user.first_name || ""} ${user.last_name || ""}`.trim() || "—"],
    ["Email",     user.email],
    ["Phone",     user.phone || "—"],
    ["Status",    user.is_active ? "Active" : "Blocked"],
    ["Joined",    user.date_joined ? new Date(user.date_joined).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    }) : "—"],
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: "bold", pb: 0 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: 16 }}>
            {(user.username || "?")[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight="bold">{user.username}</Typography>
            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <Divider sx={{ mt: 1.5 }} />
      <DialogContent>
        <Stack spacing={1} mt={1}>
          {rows.map(([label, val]) => (
            <Box key={label} display="flex" justifyContent="space-between" py={0.5}
              sx={{ borderBottom: "1px solid #f0f0f0" }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>{label}</Typography>
              <Typography variant="body2" fontWeight="medium" textAlign="right">
                {label === "Status"
                  ? <Chip size="small" label={val} color={val === "Active" ? "success" : "error"} />
                  : val}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", borderRadius: 2 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function UserManager() {
  const dispatch = useDispatch();
  const { customers, loading } = useSelector((s) => s.adminCustomers);
  const totalCount = useSelector(selectTotalCustomersCount);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter]         = useState("all");
  const [page, setPage]             = useState(1);
  const rowsPerPage                 = 10;

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchCustomers({
      page,
      search: searchTerm || undefined,
      status: filter !== "all" ? filter : undefined,
    }));
  }, [dispatch, page, searchTerm, filter]);

  // ── Derived Stats ──────────────────────────────────────────────────────────
  const activeCount   = useMemo(() => (customers || []).filter((u) =>  u.is_active).length, [customers]);
  const blockedCount  = useMemo(() => (customers || []).filter((u) => !u.is_active).length, [customers]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleConfirmToggle = () => {
    if (selectedRow) {
      dispatch(toggleCustomerActive({ id: selectedRow.id, is_active: !selectedRow.is_active }));
    }
    setConfirmOpen(false);
    setSelectedRow(null);
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    { key: "id",       label: "ID",       sortable: true },
    {
      key: "username",
      label: "User",
      sortable: true,
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark", width: 32, height: 32, fontSize: 13, fontWeight: "bold" }}>
            {(row.username || "?")[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{row.username}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.first_name ? `${row.first_name} ${row.last_name || ""}`.trim() : ""}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
    {
      key: "date_joined",
      label: "Joined",
      render: (row) => row.date_joined
        ? new Date(row.date_joined).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Chip
          size="small"
          label={row.is_active ? "Active" : "Blocked"}
          color={row.is_active ? "success" : "error"}
          variant="outlined"
          sx={{ fontWeight: "bold" }}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton size="small" color="info" onClick={() => { setDetailUser(row); setDetailOpen(true); }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.is_active ? "Block User" : "Unblock User"}>
            <IconButton
              size="small"
              onClick={() => { setSelectedRow(row); setConfirmOpen(true); }}
              sx={{ color: row.is_active ? "error.main" : "success.main" }}
            >
              {row.is_active ? <Block fontSize="small" /> : <LockOpen fontSize="small" />}
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
        <Person color="primary" sx={{ fontSize: 34 }} />
        <Box>
          <Typography variant="h4" fontFamily="monospace" fontWeight="bold">
            Customer Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all registered customers — block or unblock access
          </Typography>
        </Box>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
        <StatCard label="Total (page)" value={customers?.length} color="grey"    />
        <StatCard label="Active"       value={activeCount}        color="success" />
        <StatCard label="Blocked"      value={blockedCount}       color="error"   />
      </Stack>

      {/* Search + Filter */}
      <SearchBarWithFilter
        placeholder="Search by username, email or phone..."
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        onFilterChange={(val) => { setFilter(val); setPage(1); }}
        filterOptions={USER_FILTER_OPTIONS}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        rows={customers || []}
        loading={loading}
        emptyMessage="No customers found."
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />

      {/* Block / Unblock Confirm */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
        title={selectedRow?.is_active ? "Block User" : "Unblock User"}
        message={`Are you sure you want to ${selectedRow?.is_active ? "block" : "unblock"} "${selectedRow?.username}"?`}
        confirmLabel={selectedRow?.is_active ? "Block" : "Unblock"}
        color={selectedRow?.is_active ? "error" : "success"}
      />

      {/* Detail Modal */}
      <UserDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        user={detailUser}
      />
    </Box>
  );
}
