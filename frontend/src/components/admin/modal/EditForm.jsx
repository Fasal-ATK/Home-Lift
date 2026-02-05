// EditFormModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  Alert
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
  const [fileError, setFileError] = useState(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Reset when opening modal or initialData changes
  useEffect(() => {
    if (open) {
      setFormValues(getInitialValues());
    }
  }, [open, initialData]);

  const handleChange = (e, name, type) => {
    if (type === "file") {
      const file = e.target.files[0];
      if (file) {
        // Check file size (5 MB for images, 10 MB for documents)
        const isImage = file.type.startsWith('image/');
        const maxSizeMB = isImage ? 5 : 10;
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (file.size > maxSizeBytes) {
          setFileError(`File size exceeds ${maxSizeMB} MB limit. Your file is ${formatFileSize(file.size)}.`);
          return;
        }
        setFileError(null);
      }
      setFormValues({ ...formValues, [name]: file });
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
                      <Typography variant="caption" color="text.secondary">
                        Size: {formatFileSize(formValues[field.name].size)}
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

          {/* File size error */}
          {fileError && (
            <Alert severity="error" onClose={() => setFileError(null)} sx={{ mb: 2 }}>
              {fileError}
            </Alert>
          )}

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
