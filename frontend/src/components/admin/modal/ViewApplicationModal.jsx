// src/pages/admin/ViewApplicationModal.jsx
import {
  Modal,
  Box,
  Typography,
  Stack,
  IconButton,
  Divider,
  Button,
  TextField,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import DownloadIcon from "@mui/icons-material/Download";
import { useState, useEffect } from "react";
import ConfirmModal from "../../common/Confirm";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Return the raw URL without query-string (for extension detection) */
const stripQuery = (url) => (url ? url.split("?")[0] : "");

/** True if the URL points at an image file */
const isImage = (url) => {
  const ext = stripQuery(url).split(".").pop().toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
};

/** True if the URL points at a PDF */
const isPDF = (url) => stripQuery(url).split(".").pop().toLowerCase() === "pdf";

/**
 * DocLink — renders an appropriate action button for a document URL:
 *  • image  → opens in a new tab (browser handles it)
 *  • PDF    → opens in a new tab (browser PDF viewer)
 *  • other  → download link
 */
const DocLink = ({ url, label = "View Document" }) => {
  if (!url) return <Typography variant="body2">No document uploaded</Typography>;

  // Force HTTPS
  const secureUrl = url.replace(/^http:\/\//i, "https://");

  if (isImage(secureUrl)) {
    return (
      <Button
        variant="text"
        size="small"
        startIcon={<ImageIcon />}
        href={secureUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ textTransform: "none" }}
      >
        {label}
      </Button>
    );
  }

  if (isPDF(secureUrl)) {
    return (
      <Button
        variant="text"
        size="small"
        startIcon={<DescriptionIcon />}
        href={secureUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ textTransform: "none" }}
      >
        {label} (PDF)
      </Button>
    );
  }

  // Fallback: offer download
  return (
    <Button
      variant="text"
      size="small"
      startIcon={<DownloadIcon />}
      href={secureUrl}
      download
      rel="noopener noreferrer"
      sx={{ textTransform: "none" }}
    >
      Download Document
    </Button>
  );
};

// ─── Modal ───────────────────────────────────────────────────────────────────

const ViewApplicationModal = ({ open, onClose, application, onApprove, onReject }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setRejectionReason("");
    }
  }, [open, application?.id]);

  if (!application) return null;

  const handleApprove = async () => {
    setApproveConfirmOpen(false);
    setActionLoading(true);
    try {
      await onApprove();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setRejectConfirmOpen(false);
    setActionLoading(true);
    try {
      await onReject(rejectionReason);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 520,
            maxHeight: "90vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 24,
            p: 3,
          }}
        >
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Application ID: {application.id}</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Applicant Info */}
          <Stack spacing={1} mb={2}>
            <Typography><strong>Name:</strong> {application.user_name}</Typography>
            <Typography><strong>Email:</strong> {application.user_email}</Typography>
            <Typography><strong>Phone:</strong> {application.user_phone}</Typography>
            <Typography><strong>Status:</strong> {application.status}</Typography>
            {application.rejection_reason && (
              <Typography><strong>Rejection Reason:</strong> {application.rejection_reason}</Typography>
            )}
            <Typography>
              <strong>Applied Date:</strong>{" "}
              {new Date(application.created_at).toLocaleDateString()}
            </Typography>
            {application.replied_at && (
              <Typography>
                <strong>Replied Date:</strong>{" "}
                {new Date(application.replied_at).toLocaleDateString()}
              </Typography>
            )}
            <Typography>
              <strong>Expiration Date:</strong>{" "}
              {new Date(application.expiration_date).toLocaleDateString()}
            </Typography>
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* ID Document */}
          {application.id_doc_url && (
            <Box mb={2}>
              <DocLink url={application.id_doc_url} label="View ID Document" />
            </Box>
          )}

          {/* Services */}
          {application.services?.length > 0 && (
            <>
              <Typography variant="subtitle1" mb={1}><strong>Services:</strong></Typography>
              {application.services.map((s) => (
                <Box key={s.id} sx={{ ml: 2, mb: 1.5 }}>
                  <Typography><strong>{s.service_name}</strong></Typography>
                  <DocLink
                    url={s.id_doc_url}
                    label="View Service Document"
                  />
                  {s.experience_years !== undefined && (
                    <Typography variant="body2">
                      Experience: {s.experience_years} years
                    </Typography>
                  )}
                </Box>
              ))}
            </>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Rejection Reason Input */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" mb={1}>
              <strong>Rejection Reason:</strong> (Required for rejection)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={actionLoading}
              size="small"
            />
          </Box>

          {/* Footer buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              color="success"
              onClick={() => setApproveConfirmOpen(true)}
              disabled={actionLoading}
            >
              {actionLoading ? "Approving..." : "Approve"}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => setRejectConfirmOpen(true)}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? "Rejecting..." : "Reject"}
            </Button>
            <Button variant="outlined" onClick={onClose} disabled={actionLoading}>
              Close
            </Button>
          </Stack>
        </Box>
      </Modal>

      <ConfirmModal
        open={approveConfirmOpen}
        onClose={() => setApproveConfirmOpen(false)}
        onConfirm={handleApprove}
        message={`Are you sure you want to approve ${application.user_name}'s application?`}
        confirmLabel="Approve"
        color="success"
      />

      <ConfirmModal
        open={rejectConfirmOpen}
        onClose={() => setRejectConfirmOpen(false)}
        onConfirm={handleReject}
        message={`Are you sure you want to reject ${application.user_name}'s application?`}
        confirmLabel="Reject"
        color="danger"
      />
    </>
  );
};

export default ViewApplicationModal;
