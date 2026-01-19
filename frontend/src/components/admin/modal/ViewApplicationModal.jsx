// src/pages/admin/ViewApplicationModal.jsx
import {
  Modal,
  Box,
  Typography,
  Stack,
  IconButton,
  Link,
  Divider,
  Button,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import { useState, useEffect } from "react";
import ConfirmModal from "../../common/Confirm";

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

  // Helper: check if file is likely viewable directly (image or PDF)
  const isDirectView = (url) => {
    if (!url) return false;
    const cleanUrl = url.split("?")[0];
    const extension = cleanUrl.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "pdf"].includes(extension);
  };

  // Helper: get view URL (Google Docs Viewer for docs, direct for images/PDFs)
  const getViewUrl = (url) => {
    if (!url) return "";
    // Force HTTPS to avoid mixed content / 401 errors
    const secureUrl = url.replace(/^http:\/\//i, 'https://');
    return isDirectView(secureUrl)
      ? secureUrl
      : `https://docs.google.com/viewer?url=${encodeURIComponent(secureUrl)}&embedded=true`;
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
            width: 500,
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
            <Typography><strong>Applied Date:</strong> {new Date(application.created_at).toLocaleDateString()}</Typography>
            {application.replied_at && (
              <Typography><strong>Replied Date:</strong> {new Date(application.replied_at).toLocaleDateString()}</Typography>
            )}
            <Typography><strong>Expiration Date:</strong> {new Date(application.expiration_date).toLocaleDateString()}</Typography>
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* ID Document */}
          {application.id_doc_url && (
            <Link
              href={getViewUrl(application.id_doc_url)}
              target="_blank"
              underline="hover"
              sx={{ display: "flex", alignItems: "center", mb: 2 }}
            >
              <DescriptionIcon sx={{ mr: 1 }} /> View ID Document
            </Link>
          )}

          {/* Services */}
          {application.services?.length > 0 && (
            <>
              <Typography variant="subtitle1" mb={1}><strong>Services:</strong></Typography>
              {application.services.map((s) => (
                <Box key={s.id} sx={{ ml: 2, mb: 1 }}>
                  <Typography><strong>{s.service_name}</strong></Typography>
                  {s.id_doc_url ? (
                    <Link
                      href={getViewUrl(s.id_doc_url)}
                      target="_blank"
                      underline="hover"
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <DescriptionIcon sx={{ mr: 1 }} /> View Service Document
                    </Link>
                  ) : (
                    <Typography variant="body2">No document uploaded</Typography>
                  )}
                  {s.price && <Typography>Price: {s.price}</Typography>}
                  {s.experience_years !== undefined && <Typography>Experience: {s.experience_years} years</Typography>}
                </Box>
              ))}
            </>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Rejection Reason Input */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" mb={1}><strong>Rejection Reason:</strong> (Required for rejection)</Typography>
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
