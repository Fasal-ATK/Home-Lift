import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Button, Chip, Stack, Paper,
  Avatar, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Divider,
} from "@mui/material";
import {
  CheckCircle, Cancel, Build as BuildIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import DataTable from "../DataTable";
import SearchBarWithFilter from "../SearchBar";
import ConfirmModal from "../../common/Confirm";
import { adminProviderManagementService } from "../../../services/apiServices";
import { openDocumentInNewTab } from "../../../utils/documentViewer";

// ── Constants ────────────────────────────────────────────────────────────────
const SR_FILTER_OPTIONS = [
  { value: "all",      label: "All Requests" },
  { value: "pending",  label: "Pending"      },
  { value: "approved", label: "Approved"     },
  { value: "rejected", label: "Rejected"     },
];

const STATUS_COLOR = { pending: "warning", approved: "success", rejected: "error" };

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

// ── Reject Dialog ─────────────────────────────────────────────────────────────
function RejectDialog({ open, onClose, request, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: "bold" }}>Reject Service Request</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" mb={2} color="text.secondary">
          You are rejecting <strong>{request?.provider_name}</strong>'s request to add{" "}
          <strong>{request?.service_name}</strong>
          {request?.category_name ? ` (${request.category_name})` : ""}.
        </Typography>
        <TextField
          autoFocus
          label="Reason for Rejection *"
          multiline
          rows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={!reason.trim()}
          helperText={!reason.trim() ? "A reason is required" : ""}
          size="small"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(reason)}
          variant="contained"
          color="error"
          disabled={loading || !reason.trim()}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          {loading ? "Rejecting..." : "Confirm Reject"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ServiceRequests() {
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]               = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const rowsPerPage                   = 10;

  // Approve confirm modal
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [pendingApprove, setPendingApprove]         = useState(null);

  // Reject dialog
  const [rejectOpen, setRejectOpen]         = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await adminProviderManagementService.getServiceRequests(params);
      setRequests(data?.results || []);
      setTotalCount(data?.count || 0);
    } catch {
      toast.error("Failed to load service requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [page, statusFilter]);

  // search debounce
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchRequests(); }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Derived Stats ──────────────────────────────────────────────────────────
  const pendingCount  = useMemo(() => requests.filter((r) => r.status === "pending").length,  [requests]);
  const approvedCount = useMemo(() => requests.filter((r) => r.status === "approved").length, [requests]);
  const rejectedCount = useMemo(() => requests.filter((r) => r.status === "rejected").length, [requests]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!pendingApprove) return;
    setActionLoading(true);
    try {
      await adminProviderManagementService.actionServiceRequest(pendingApprove.id, { status: "approved" });
      toast.success("Service request approved!");
      fetchRequests();
    } catch {
      toast.error("Failed to approve request.");
    } finally {
      setActionLoading(false);
      setApproveConfirmOpen(false);
      setPendingApprove(null);
    }
  };

  const handleReject = async (reason) => {
    if (!selectedRequest || !reason.trim()) return;
    setActionLoading(true);
    try {
      await adminProviderManagementService.actionServiceRequest(selectedRequest.id, {
        status: "rejected",
        rejection_reason: reason,
      });
      toast.success("Request rejected.");
      setRejectOpen(false);
      fetchRequests();
    } catch {
      toast.error("Failed to reject request.");
    } finally {
      setActionLoading(false);
      setSelectedRequest(null);
    }
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    { key: "id", label: "ID", sortable: true },
    {
      key: "provider_name",
      label: "Provider",
      sortable: true,
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: "success.light", color: "success.dark", width: 32, height: 32, fontSize: 13, fontWeight: "bold" }}>
            {(row.provider_name || "?")[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{row.provider_name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.provider_email}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: "service",
      label: "Service Requested",
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">{row.service_name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.category_name}</Typography>
        </Box>
      ),
    },
    {
      key: "price_detail",
      label: "Price / Exp",
      render: (row) => (
        <Typography variant="body2">
          {row.price ? `₹${row.price}` : "Default"} · {row.experience_years ?? "—"} yrs
        </Typography>
      ),
    },
    {
      key: "doc_url",
      label: "Document",
      render: (row) =>
        row.doc_url ? (
          <Button
            variant="text"
            size="small"
            onClick={(e) => {
              e.preventDefault();
              openDocumentInNewTab(row.doc_url);
            }}
            sx={{ textTransform: "none", fontSize: "0.75rem", p: 0.5 }}
          >
            View Doc
          </Button>
        ) : (
          <Typography variant="caption" color="text.disabled">No Doc</Typography>
        ),
    },
    {
      key: "created_at",
      label: "Requested On",
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      }),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Chip
          label={row.status?.toUpperCase()}
          size="small"
          color={STATUS_COLOR[row.status] || "default"}
          sx={{ fontWeight: "bold" }}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) =>
        row.status === "pending" ? (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Approve">
              <IconButton
                size="small"
                color="success"
                onClick={() => { setPendingApprove(row); setApproveConfirmOpen(true); }}
                disabled={actionLoading}
              >
                <CheckCircle fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reject with reason">
              <IconButton
                size="small"
                color="error"
                onClick={() => { setSelectedRequest(row); setRejectOpen(true); }}
                disabled={actionLoading}
              >
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            {row.status === "approved" ? "Approved" : `Rejected: ${row.rejection_reason || "—"}`}
          </Typography>
        ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box p={3}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <BuildIcon color="warning" sx={{ fontSize: 34 }} />
        <Box>
          <Typography variant="h4" fontFamily="monospace" fontWeight="bold">
            Service Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review service add/update requests submitted by providers
          </Typography>
        </Box>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
        <StatCard label="Total (page)" value={requests.length} color="grey"    />
        <StatCard label="Pending"      value={pendingCount}    color="warning" />
        <StatCard label="Approved"     value={approvedCount}   color="success" />
        <StatCard label="Rejected"     value={rejectedCount}   color="error"   />
      </Stack>

      {/* Search + Filter */}
      <SearchBarWithFilter
        placeholder="Search by provider name or email..."
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        onFilterChange={(val) => { setStatusFilter(val); setPage(1); }}
        filterOptions={SR_FILTER_OPTIONS}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        rows={requests}
        loading={loading}
        emptyMessage="No service requests found."
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />

      {/* Approve Confirm */}
      <ConfirmModal
        open={approveConfirmOpen}
        onClose={() => { setApproveConfirmOpen(false); setPendingApprove(null); }}
        onConfirm={handleApprove}
        title="Approve Service Request"
        message={`Approve ${pendingApprove?.provider_name}'s request to add "${pendingApprove?.service_name}"?`}
        confirmLabel="Approve"
        color="success"
      />

      {/* Reject Dialog */}
      <RejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        request={selectedRequest}
        onConfirm={handleReject}
        loading={actionLoading}
      />
    </Box>
  );
}
