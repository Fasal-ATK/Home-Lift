import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Chip, Button, Stack, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, TextField, InputAdornment, IconButton,
  Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import {
  CheckCircle, Cancel, InfoOutlined as InfoIcon, Search, Clear,
  AccountBalanceWallet as WalletIcon
} from "@mui/icons-material";
import api from "../../API/apiConfig";
import apiEndpoints from "../../API/apiEndpoints";
import { toast } from "react-toastify";
import DataTable from "../../components/admin/DataTable";
import ConfirmModal from "../../components/common/Confirm";
import SearchBarWithFilter from "../../components/admin/SearchBar";

// ── Constants ───────────────────────────────────────────────────────────────
const STATUS_FILTER_OPTIONS = [
  { value: "all",       label: "All Withdrawals"  },
  { value: "pending",   label: "Pending"          },
  { value: "completed", label: "Completed"        },
  { value: "failed",    label: "Failed / Rejected" },
];

function getStatusColor(s) {
  if (s === "completed") return "success";
  if (s === "failed")    return "error";
  return "warning";
}

// ── Stat Card ────────────────────────────────────────────────────────────────
const SAFE_COLORS = {
  success: { border: "#c8e6c9", bg: "#f1f8e9", text: "success.main" },
  warning: { border: "#ffe0b2", bg: "#fff8e1", text: "warning.main" },
  error:   { border: "#ffcdd2", bg: "#fff5f5", text: "error.main"   },
  info:    { border: "#b3e5fc", bg: "#e3f2fd", text: "info.main"    },
  grey:    { border: "#e0e0e0", bg: "#fafafa", text: "text.primary"  },
};

function StatCard({ label, value, color = "grey", sub }) {
  const c = SAFE_COLORS[color] || SAFE_COLORS.grey;
  return (
    <Paper elevation={0} sx={{
      p: 2, flex: 1, borderRadius: 3, textAlign: "center",
      border: `1.5px solid ${c.border}`,
      bgcolor: c.bg, minWidth: 120,
    }}>
      <Typography variant="h5" fontWeight="bold" color={c.text}>{value ?? "—"}</Typography>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      {sub && <Typography variant="caption" color={c.text} fontWeight="bold">{sub}</Typography>}
    </Paper>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────
function WithdrawalDetailModal({ open, onClose, withdrawal }) {
  if (!withdrawal) return null;
  const rows = [
    ["Withdrawal ID",    `#${withdrawal.id}`],
    ["Provider Email",   withdrawal.provider_email || `User #${withdrawal.provider}`],
    ["Amount",           `₹${withdrawal.amount}`],
    ["Status",           withdrawal.status],
    ["Stripe Txn ID",    withdrawal.stripe_transfer_id || "N/A"],
    ["Requested On",     new Date(withdrawal.created_at).toLocaleString("en-IN")],
  ];
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: "bold", pb: 0 }}>Withdrawal Details — #{withdrawal.id}</DialogTitle>
      <Divider sx={{ mt: 1 }} />
      <DialogContent>
        <Stack spacing={1} mt={1}>
          {rows.map(([label, val]) => (
            <Box key={label} display="flex" justifyContent="space-between" py={0.5}
              sx={{ borderBottom: "1px solid #f0f0f0" }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>{label}</Typography>
              <Typography variant="body2" fontWeight="medium" textAlign="right">
                {label === "Status"
                  ? <Chip size="small" label={val.toUpperCase()} color={getStatusColor(val)} />
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
export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState("all");
  const [searchTerm, setSearchTerm]       = useState("");

  // Pagination
  const [page, setPage]           = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const rowsPerPage               = 10;

  // Modals
  const [confirmOpen, setConfirmOpen]       = useState(false);
  const [pendingAction, setPendingAction]   = useState(null); // { id, action }
  const [detailOpen, setDetailOpen]         = useState(false);
  const [detailItem, setDetailItem]         = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get(apiEndpoints.wallet.adminWithdrawals, { params });
      setWithdrawals(res.data.results || []);
      setTotalCount(res.data.count    || 0);
    } catch {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWithdrawals(); }, [statusFilter, page]);

  // search debounce — refetch when search is stable
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchWithdrawals(); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Derived Stats ──────────────────────────────────────────────────────────
  const pendingCount   = useMemo(() => withdrawals.filter((w) => w.status === "pending").length,   [withdrawals]);
  const completedCount = useMemo(() => withdrawals.filter((w) => w.status === "completed").length, [withdrawals]);
  const failedCount    = useMemo(() => withdrawals.filter((w) => w.status === "failed").length,    [withdrawals]);
  const totalAmount    = useMemo(() =>
    withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0).toFixed(2),
    [withdrawals]
  );

  // ── Action Handlers ────────────────────────────────────────────────────────
  const requestAction = (id, action) => {
    setPendingAction({ id, action });
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const { id, action } = pendingAction;
    try {
      await api.patch(apiEndpoints.wallet.adminWithdrawalAction(id), { action });
      toast.success(`Withdrawal ${action}d successfully`);
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to ${action} withdrawal`);
    } finally {
      setConfirmOpen(false);
      setPendingAction(null);
    }
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    { key: "id", label: "ID", render: (row) => `#${row.id}` },
    {
      key: "provider_email",
      label: "Provider",
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {row.provider_email || `User #${row.provider}`}
          </Typography>
        </Box>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => (
        <Typography variant="body2" fontWeight="bold" color="primary.main">
          ₹{row.amount}
        </Typography>
      ),
    },
    {
      key: "created_at",
      label: "Requested",
      render: (row) => new Date(row.created_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      }),
    },
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
    {
      key: "stripe_transfer_id",
      label: "Stripe Txn",
      render: (row) =>
        row.stripe_transfer_id ? (
          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
            {row.stripe_transfer_id}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
          {/* Detail button always visible */}
          <IconButton
            size="small"
            color="info"
            onClick={() => { setDetailItem(row); setDetailOpen(true); }}
          >
            <InfoIcon fontSize="small" />
          </IconButton>

          {row.status === "pending" ? (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircle />}
                onClick={() => requestAction(row.id, "approve")}
                sx={{ boxShadow: 0, textTransform: "none", borderRadius: 1.5, py: 0.4 }}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<Cancel />}
                onClick={() => requestAction(row.id, "reject")}
                sx={{ textTransform: "none", borderRadius: 1.5, py: 0.4 }}
              >
                Reject
              </Button>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary" ml={1}>
              {row.status === "completed" ? "Processed" : "Rejected"}
            </Typography>
          )}
        </Stack>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <WalletIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" fontFamily="monospace" fontWeight="bold">
            Withdrawal Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage provider payout requests
          </Typography>
        </Box>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
        <StatCard label="Total (page)"  value={withdrawals.length} color="grey"    sub={`₹${totalAmount} total`} />
        <StatCard label="Pending"       value={pendingCount}        color="warning" />
        <StatCard label="Completed"     value={completedCount}      color="success" />
        <StatCard label="Rejected"      value={failedCount}         color="error"   />
      </Stack>

      {/* Filters Row */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 250 }}>
          <SearchBarWithFilter
            placeholder="Search by provider email..."
            onSearch={(val) => { setSearchTerm(val); setPage(1); }}
            showFilter={false} // Use external dropdown for status
          />
        </Box>

        {/* Status Filter */}
        <FormControl size="small" sx={{ minWidth: 190, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={withdrawals}
        loading={loading}
        emptyMessage="No withdrawal requests found."
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />

      {/* Confirm Approve/Reject */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingAction(null); }}
        onConfirm={handleConfirmAction}
        title={`${pendingAction?.action === "approve" ? "Approve" : "Reject"} Withdrawal`}
        message={`Are you sure you want to ${pendingAction?.action} withdrawal #${pendingAction?.id}? This action cannot be undone.`}
        confirmLabel={pendingAction?.action === "approve" ? "Approve" : "Reject"}
        color={pendingAction?.action === "approve" ? "success" : "error"}
      />

      {/* Detail Modal */}
      <WithdrawalDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        withdrawal={detailItem}
      />
    </Box>
  );
}
