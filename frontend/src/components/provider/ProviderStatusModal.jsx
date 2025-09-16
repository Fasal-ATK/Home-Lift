import React from "react";
import { Modal, Box, Typography, Button } from "@mui/material";

const ProviderStatusModal = ({ open, onClose, status, rejectionReason }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          p: 4,
          backgroundColor: "white",
          borderRadius: 2,
          maxWidth: 400,
          mx: "auto",
          mt: "20vh",
          textAlign: "center",
        }}
      >
        {status === "pending" && (
          <>
            <Typography variant="h6" fontWeight="bold">
              Application Pending
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Your provider application is under review. Please wait for admin approval.
            </Typography>
          </>
        )}

        {status === "rejected" && (
          <>
            <Typography variant="h6" fontWeight="bold" color="error">
              Application Rejected
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Reason: {rejectionReason || "Not provided"}
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => {
                // TODO: open ProviderApplicationModal again for re-apply
              }}
            >
              Apply Again
            </Button>
          </>
        )}

        {/* Close Button */}
        <Button
          variant="outlined"
          sx={{ mt: 3 ,":hover": { borderColor: 'grey.500' }}}
          onClick={onClose}
        >
          Close
        </Button>
      </Box>
    </Modal>
  );
};

export default ProviderStatusModal;
