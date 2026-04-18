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

// Validation rules per field name
const VALIDATORS = {
  first_name: (v) => {
    if (!v || !v.trim()) return "First name is required.";
    if (!/^[A-Za-z\s'-]+$/.test(v.trim())) return "First name can only contain letters, spaces, hyphens, or apostrophes.";
    if (v.trim().length < 2) return "First name must be at least 2 characters.";
    if (v.trim().length > 50) return "First name must be at most 50 characters.";
    return "";
  },
  last_name: (v) => {
    if (!v || !v.trim()) return "Last name is required.";
    if (!/^[A-Za-z\s'-]+$/.test(v.trim())) return "Last name can only contain letters, spaces, hyphens, or apostrophes.";
    if (v.trim().length < 2) return "Last name must be at least 2 characters.";
    if (v.trim().length > 50) return "Last name must be at most 50 characters.";
    return "";
  },
  username: (v) => {
    if (!v || !v.trim()) return "Username is required.";
    if (!/^[A-Za-z0-9_]+$/.test(v.trim())) return "Username can only contain letters, numbers, and underscores.";
    if (v.trim().length < 3) return "Username must be at least 3 characters.";
    if (v.trim().length > 30) return "Username must be at most 30 characters.";
    return "";
  },
  phone: (v) => {
    if (!v || !v.trim()) return ""; // Phone is optional; skip if empty
    if (!/^\+?[0-9]{7,15}$/.test(v.trim())) return "Enter a valid phone number (7–15 digits, optional leading +).";
    return "";
  },
  email: () => "", // read-only; no client-side validation needed
};

function validateField(name, value) {
  const validator = VALIDATORS[name];
  return validator ? validator(value) : "";
}

export default function ReusableFormModal({
  open,
  handleClose,
  title = "Edit",
  fields = [],
  initialData = {},
  onSave,
}) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens with new data
  useEffect(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all editable fields
    const newErrors = {};
    let hasError = false;
    fields.forEach((field) => {
      if (!field.readOnly) {
        const msg = validateField(field.name, formData[field.name]);
        newErrors[field.name] = msg;
        if (msg) hasError = true;
      }
    });
    setErrors(newErrors);

    if (hasError) return;

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
                onBlur={handleBlur}
                error={!!errors[field.name]}
                helperText={errors[field.name] || ""}
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
