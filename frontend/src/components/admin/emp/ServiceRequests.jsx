import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { toast } from "react-toastify";
import DataTable from "../DataTable";
import { adminProviderManagementService } from "../../../services/apiServices";

export default function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject dialog state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch pending requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await adminProviderManagementService.getServiceRequests();
      // Assume paginated structure is returned (data.results) or plain array
      setRequests(data?.results || data || []);
    } catch (err) {
      toast.error("Failed to load service requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ── Actions ────────────────────────────────────────────────────────

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this service request?")) return;
    try {
      await adminProviderManagementService.actionServiceRequest(id, {
        status: "approved",
      });
      toast.success("Service request approved!");
      fetchRequests();
    } catch (err) {
      toast.error("Failed to approve request.");
    }
  };

  const openRejectDialog = (req) => {
    setSelectedRequest(req);
    setRejectReason("");
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setActionLoading(true);
    try {
      await adminProviderManagementService.actionServiceRequest(
        selectedRequest.id,
        {
          status: "rejected",
          rejection_reason: rejectReason,
        }
      );
      toast.success("Request rejected.");
      setRejectOpen(false);
      fetchRequests();
    } catch (err) {
      toast.error("Failed to reject request.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Table config ───────────────────────────────────────────────────

  const columns = [
    { key: "id", label: "Req ID", sortable: true },
    { key: "provider_name", label: "Provider", sortable: true },
    { key: "provider_email", label: "Email", sortable: true },
    {
      key: "service",
      label: "Requested Service",
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {row.service_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.category_name}
          </Typography>
        </Box>
      ),
    },
    {
      key: "price_detail",
      label: "Custom Price / Exp",
      render: (row) => (
        <Typography variant="body2">
          {row.price ? `₹${row.price}` : "Default"} • {row.experience_years} yrs
        </Typography>
      ),
    },
    {
      key: "doc_url",
      label: "Document",
      render: (row) => row.doc_url ? (
        <Button 
          variant="text" 
          size="small" 
          href={row.doc_url} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          View Doc
        </Button>
      ) : (
        <Typography variant="caption" color="text.secondary">No Doc</Typography>
      )
    },
    {
      key: "created_at",
      label: "Requested On",
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Chip
          label="Pending"
          size="small"
          color="warning"
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => handleApprove(row.id)}
          >
            Approve
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => openRejectDialog(row)}
          >
            Reject
          </Button>
        </Box>
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
        mb={2}
      >
        Pending Service Requests
      </Typography>

      <DataTable
        columns={columns}
        rows={requests}
        loading={loading}
        emptyMessage="No pending service requests right now."
      />

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Service Request</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" mb={2} color="text.secondary">
            You are rejecting the request by{" "}
            <strong>{selectedRequest?.provider_name}</strong> to add{" "}
            <strong>{selectedRequest?.service_name}</strong>.
          </Typography>
          <TextField
            autoFocus
            label="Reason for Rejection"
            multiline
            rows={3}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            error={rejectReason.length === 0}
            helperText={rejectReason.length === 0 ? "Reason is required" : ""}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={actionLoading || rejectReason.trim() === ""}
          >
            {actionLoading ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
