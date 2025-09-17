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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import { useState } from "react";

const ViewApplicationModal = ({ open, onClose, application, onApprove, onReject }) => {
  const [actionLoading, setActionLoading] = useState(false);

  if (!application) return null;

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await onApprove();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await onReject();
    } finally {
      setActionLoading(false);
    }
  };

  return (
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
        {application.id_doc && (
          <Link
            href={application.id_doc}
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
                {s.id_doc ? (
                  <Link
                    href={s.id_doc}
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

        {/* Footer buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={actionLoading}
          >
            {actionLoading ? "Approving..." : "Approve"}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={actionLoading}
          >
            {actionLoading ? "Rejecting..." : "Reject"}
          </Button>
          <Button variant="outlined" onClick={onClose} disabled={actionLoading}>
            Close
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default ViewApplicationModal;
