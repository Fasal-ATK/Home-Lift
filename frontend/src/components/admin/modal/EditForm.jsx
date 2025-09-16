// EditFormModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const EditFormModal = ({
  open,
  onClose,
  title,
  fields,
  initialData = {}, // 👈 pre-filled data from backend
  onSubmit,
  submitLabel = "Update"
}) => {
  const getInitialValues = () =>
    fields.reduce((acc, field) => {
      acc[field.name] =
        initialData[field.name] ||
        (field.type === "file" ? null : "");
      return acc;
    }, {});

  const [formValues, setFormValues] = useState(getInitialValues());

  // Reset when opening modal or initialData changes
  useEffect(() => {
    if (open) {
      setFormValues(getInitialValues());
    }
  }, [open, initialData]);

  const handleChange = (e, name, type) => {
    if (type === "file") {
      setFormValues({ ...formValues, [name]: e.target.files[0] });
    } else {
      setFormValues({ ...formValues, [name]: e.target.value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formValues);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 420,
          maxHeight: '90vh',   // ✅ limit modal height to viewport
          overflowY: 'auto',   // ✅ enable scrolling if content is taller
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 3,
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <form onSubmit={handleSubmit}>
          {fields.map((field, index) => (
            <Box key={index} mb={2}>
              {field.type === "file" ? (
                <>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                  >
                    {formValues[field.name]
                      ? "Change File"
                      : `Upload ${field.label}`}
                    <input
                      type="file"
                      hidden
                      accept={field.accept || "*/*"}
                      onChange={(e) =>
                        handleChange(e, field.name, "file")
                      }
                    />
                  </Button>

                  {/* Show existing image from backend if no new one chosen */}
                  {initialData[field.name] &&
                    !formValues[field.name]?.name && (
                      <Box mt={1}>
                        <Typography variant="body2">
                          Current: {initialData[field.name]}
                        </Typography>
                        <Box
                          component="img"
                          src={initialData[field.name]} // must be absolute URL
                          alt="Current"
                          sx={{
                            mt: 1,
                            width: "100%",
                            maxHeight: 200,
                            objectFit: "contain",
                            borderRadius: 1,
                            border: "1px solid #ccc"
                          }}
                        />
                      </Box>
                    )}

                  {/* Show preview if new file selected */}
                  {formValues[field.name]?.name && (
                    <Box mt={1}>
                      <Typography variant="body2">
                        Selected: {formValues[field.name].name}
                      </Typography>
                      {formValues[field.name].type?.startsWith(
                        "image/"
                      ) && (
                        <Box
                          component="img"
                          src={URL.createObjectURL(
                            formValues[field.name]
                          )}
                          alt="Preview"
                          sx={{
                            mt: 1,
                            width: "100%",
                            maxHeight: 200,
                            objectFit: "contain",
                            borderRadius: 1,
                            border: "1px solid #ccc"
                          }}
                        />
                      )}
                    </Box>
                  )}
                </>
              ) : (
                <TextField
                  label={field.label}
                  type={field.type || "text"}
                  value={formValues[field.name]}
                  onChange={(e) =>
                    handleChange(e, field.name, field.type)
                  }
                  fullWidth
                  required={field.required}
                />
              )}
            </Box>
          ))}

          {/* Buttons */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            mt={3}
          >
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
            >
              {submitLabel}
            </Button>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
};

export default EditFormModal;

// before change 