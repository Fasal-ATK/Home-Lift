// src/components/admin/emp/ProviderApplications.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Button, Chip, Stack, Paper,
  Avatar, IconButton, Tooltip,
} from "@mui/material";
import {
  CheckCircle, Cancel, InfoOutlined as InfoIcon, PersonAdd,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../DataTable";
import SearchBarWithFilter from "../SearchBar";
import {
  fetchApplications,
  approveApplication,
  rejectApplication,
  selectApplicationTotalCount,
} from "../../../redux/slices/admin/applicationsSlice";
import ViewApplicationModal from "../modal/ViewApplicationModal";
import ConfirmModal from "../../common/Confirm";
import { toast } from "react-toastify";

// ── Constants ────────────────────────────────────────────────────────────────
const APP_FILTER_OPTIONS = [
  { value: "all",      label: "All Applications" },
  { value: "pending",  label: "Pending"          },
  { value: "approved", label: "Approved"         },
  { value: "rejected", label: "Rejected"         },
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

// ── Main Component ───────────────────────────────────────────────────────────
export default function ProviderApplications() {
  const dispatch = useDispatch();
  const { list: applications, loading, actionLoading } = useSelector(
    (s) => s.applications
  );
  const totalCount = useSelector(selectApplicationTotalCount);

  const [page, setPage]             = useState(1);
  const rowsPerPage                 = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // View modal
  const [viewOpen, setViewOpen]               = useState(false);
  const [selectedApp, setSelectedApp]         = useState(null);

  // Quick inline approve confirm
  const [confirmOpen, setConfirmOpen]         = useState(false);
  const [pendingApprove, setPendingApprove]   = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchApplications({
      page,
      search: searchTerm || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }));
  }, [dispatch, page, searchTerm, statusFilter]);

  // ── Derived Stats ──────────────────────────────────────────────────────────
  const pendingCount  = useMemo(() => (applications || []).filter((a) => a.status === "pending").length,  [applications]);
  const approvedCount = useMemo(() => (applications || []).filter((a) => a.status === "approved").length, [applications]);
  const rejectedCount = useMemo(() => (applications || []).filter((a) => a.status === "rejected").length, [applications]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAction = async (id, type, reason = "") => {
    try {
      if (type === "approve") {
        await dispatch(approveApplication({ id, data: {} })).unwrap();
        toast.success("Application approved!");
      } else {
        await dispatch(rejectApplication({ id, data: { rejection_reason: reason } })).unwrap();
        toast.success("Application rejected.");
      }
      setViewOpen(false);
      dispatch(fetchApplications({ page, search: searchTerm || undefined, status: statusFilter !== "all" ? statusFilter : undefined }));
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Action failed");
    }
  };

  const handleQuickApprove = async () => {
    if (!pendingApprove) return;
    await handleAction(pendingApprove.id, "approve");
    setConfirmOpen(false);
    setPendingApprove(null);
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    { key: "id", label: "ID", sortable: true },
    {
      key: "user_name",
      label: "Applicant",
      sortable: true,
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark", width: 32, height: 32, fontSize: 13, fontWeight: "bold" }}>
            {(row.user_name || "?")[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{row.user_name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.user_email}</Typography>
          </Box>
        </Stack>
      ),
    },
    { key: "user_phone", label: "Phone", render: (row) => row.user_phone || "—" },
    {
      key: "created_at",
      label: "Applied On",
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
      render: (row) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View Full Application">
            <IconButton
              size="small"
              color="info"
              onClick={() => { setSelectedApp(row); setViewOpen(true); }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {row.status === "pending" && (
            <>
              <Tooltip title="Quick Approve">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => { setPendingApprove(row); setConfirmOpen(true); }}
                  disabled={actionLoading}
                >
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject (with reason)">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => { setSelectedApp(row); setViewOpen(true); }}
                  disabled={actionLoading}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box p={3}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <PersonAdd color="primary" sx={{ fontSize: 34 }} />
        <Box>
          <Typography variant="h4" fontFamily="monospace" fontWeight="bold">
            Provider Applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and action new provider registration requests
          </Typography>
        </Box>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
        <StatCard label="Total (page)" value={applications?.length} color="grey"    />
        <StatCard label="Pending"      value={pendingCount}          color="warning" />
        <StatCard label="Approved"     value={approvedCount}         color="success" />
        <StatCard label="Rejected"     value={rejectedCount}         color="error"   />
      </Stack>

      {/* Search + Filter */}
      <SearchBarWithFilter
        placeholder="Search by name or email..."
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        onFilterChange={(val) => { setStatusFilter(val); setPage(1); }}
        filterOptions={APP_FILTER_OPTIONS}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        rows={applications || []}
        loading={loading}
        emptyMessage="No applications found."
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />

      {/* Quick Approve Confirm */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingApprove(null); }}
        onConfirm={handleQuickApprove}
        title="Approve Application"
        message={`Approve ${pendingApprove?.user_name}'s provider application? They will be granted provider access immediately.`}
        confirmLabel="Approve"
        color="success"
      />

      {/* Full View/Action Modal */}
      {selectedApp && (
        <ViewApplicationModal
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          application={selectedApp}
          onApprove={() => handleAction(selectedApp.id, "approve")}
          onReject={(reason) => handleAction(selectedApp.id, "reject", reason)}
          actionLoading={actionLoading}
        />
      )}
    </Box>
  );
}
