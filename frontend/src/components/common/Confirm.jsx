// src/components/common/ConfirmModal.jsx
import React from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Stack,
} from "@mui/material";

const colorMap = {
  danger: { bg: "#fdecea", text: "#d32f2f" },   // red
  success: { bg: "#edf7ed", text: "#2e7d32" }, // green
  warning: { bg: "#fff4e5", text: "#ed6c02" }, // orange
  info: { bg: "#e3f2fd", text: "#0288d1" },    // blue
  default: { bg: "#f5f5f5", text: "#333" },
};

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  message = "Are you sure?",
  color = "default",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) => {
  const themeColor = colorMap[color] || colorMap.default;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 380,
          bgcolor: themeColor.bg,
          borderRadius: 2,
          boxShadow: 24,
          p: 3,
          textAlign: "center",
        }}
      >
        {/* Message */}
        <Typography variant="h6" sx={{  mb: 2 }}>
          {message}
        </Typography>

        {/* Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
          <Button variant="outlined" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: themeColor.text,
              "&:hover": { bgcolor: themeColor.text },
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default ConfirmModal;
