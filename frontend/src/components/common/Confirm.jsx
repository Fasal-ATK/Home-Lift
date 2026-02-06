// src/components/common/ConfirmModal.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Slide,
} from "@mui/material";

const colorMap = {
  danger: { main: "#D32F2F", hover: "#b71c1c" },
  success: { main: "#2e7d32", hover: "#1b5e20" },
  warning: { main: "#ed6c02", hover: "#e65100" },
  info: { main: "#0066CC", hover: "#004c99" },
  default: { main: "#1976D2", hover: "#1565c0" },
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  color = "default",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) => {
  const themeColor = colorMap[color] || colorMap.default;

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      PaperProps={{
        sx: { borderRadius: 3, px: 2, py: 1, minWidth: 320 },
      }}
      sx={{ zIndex: 1500 }} // Ensure it appears above other modals
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{ fontWeight: "bold", fontSize: 20 }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body1"
          id="confirm-dialog-description"
          sx={{ mt: 1 }}
        >
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{ color: "#1976D2", fontWeight: "bold", textTransform: "none" }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
          }}
          variant="contained"
          sx={{
            bgcolor: themeColor.main,
            "&:hover": { bgcolor: themeColor.hover },
            fontWeight: "bold",
            color: "white",
            textTransform: "none",
            borderRadius: 2,
            px: 3,
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmModal;
