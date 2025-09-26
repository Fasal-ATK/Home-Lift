// components/common/ReusableFormModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";

export default function ReusableFormModal({
  open,
  handleClose,
  title = "Edit",
  fields = [],
  initialData = {},
  onSave,
}) {
  const [formData, setFormData] = useState(initialData);

  // Reset form when modal opens with new data
  useEffect(() => {
    setFormData(initialData);
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2}>
            {fields.map((field) => (
              <TextField
                key={field.name}
                name={field.name}
                fullWidth
                label={field.label}
                type={field.type || "text"}
                value={formData[field.name] || ""}
                onChange={handleChange}
                InputProps={
                  field.readOnly
                    ? {
                        readOnly: true,
                        style: { backgroundColor: "rgba(0,0,0,0.05)" },
                      }
                    : {}
                }
              />
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
