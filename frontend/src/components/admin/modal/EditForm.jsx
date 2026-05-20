// EditForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, Stack,
  IconButton, MenuItem, Select, InputLabel,
  FormControl, Alert, Divider, Chip,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload, InsertDriveFile, Image as ImageIcon } from '@mui/icons-material';

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
};

// ── File Upload Field ─────────────────────────────────────────────────────────
function FileUploadField({ field, value, currentUrl, onChange }) {
  // value = newly selected File object; currentUrl = existing image URL from backend
  const hasNewFile = !!value?.name;
  const hasExisting = !!currentUrl && !hasNewFile;
  const isImage = value?.type?.startsWith('image/');

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
        {field.label}{field.required ? ' *' : ''}
      </Typography>

      <Button
        component="label"
        variant="outlined"
        fullWidth
        startIcon={<CloudUpload />}
        sx={{
          borderStyle: 'dashed',
          borderRadius: 2,
          py: 1.5,
          textTransform: 'none',
          color: hasNewFile ? 'success.main' : 'text.secondary',
          borderColor: hasNewFile ? 'success.main' : 'divider',
          bgcolor: hasNewFile ? 'success.50' : 'grey.50',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
        }}
      >
        {hasNewFile ? 'Change File' : hasExisting ? 'Replace File' : `Upload ${field.label}`}
        <input
          type="file"
          hidden
          accept={field.accept || '*/*'}
          onChange={onChange}
        />
      </Button>

      {/* Existing image from backend */}
      {hasExisting && (
        <Box mt={1} p={1.5} borderRadius={1.5} bgcolor="grey.50"
          sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <ImageIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" flex={1}>Current image</Typography>
            <Chip label="Existing" size="small" variant="outlined" />
          </Stack>
          <Box
            component="img"
            src={currentUrl}
            alt="Current"
            sx={{
              width: '100%',
              maxHeight: 160,
              objectFit: 'contain',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'white',
            }}
          />
        </Box>
      )}

      {/* New file selected */}
      {hasNewFile && (
        <Box mt={1} p={1.5} borderRadius={1.5} bgcolor="grey.50"
          sx={{ border: '1px solid', borderColor: 'success.light' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={isImage ? 1 : 0}>
            <InsertDriveFile fontSize="small" color="action" />
            <Box flex={1} overflow="hidden">
              <Typography variant="body2" noWrap fontWeight="medium">{value.name}</Typography>
              <Typography variant="caption" color="text.secondary">{formatFileSize(value.size)}</Typography>
            </Box>
            <Chip label="New" size="small" color="success" variant="outlined" />
          </Stack>

          {isImage && (
            <Box
              component="img"
              src={URL.createObjectURL(value)}
              alt="Preview"
              sx={{
                width: '100%',
                maxHeight: 160,
                objectFit: 'contain',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'white',
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const EditForm = ({
  open,
  onClose,
  title,
  fields,
  initialData = {},
  onSubmit,
  submitLabel = 'Update',
}) => {
  const getInitialValues = () =>
    fields.reduce((acc, f) => {
      acc[f.name] = f.type === 'file'
        ? null                              // files always start null (user must re-select)
        : (initialData[f.name] ?? '');
      return acc;
    }, {});

  const [formValues, setFormValues] = useState(getInitialValues);
  const [fileError, setFileError]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Re-populate whenever the modal opens with new data
  useEffect(() => {
    if (open) {
      setFormValues(getInitialValues());
      setFileError(null);
    }
  }, [open, initialData]);

  const handleChange = (name, type, e) => {
    if (type === 'file') {
      const file = e.target.files[0];
      if (!file) return;
      const maxMB = file.type.startsWith('image/') ? 5 : 10;
      if (file.size > maxMB * 1024 * 1024) {
        setFileError(`File exceeds ${maxMB} MB limit (${formatFileSize(file.size)}).`);
        return;
      }
      setFileError(null);
      setFormValues((prev) => ({ ...prev, [name]: file }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: e.target.value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formValues);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {/* Title */}
      <DialogTitle sx={{ pb: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">{title}</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>
      <Divider sx={{ mt: 1.5 }} />

      {/* Content — scrollable */}
      <DialogContent sx={{ pt: 2 }}>
        <form id="edit-form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {fields.map((field, i) =>
              field.type === 'file' ? (
                <FileUploadField
                  key={i}
                  field={field}
                  value={formValues[field.name]}
                  currentUrl={initialData[field.name]}
                  onChange={(e) => handleChange(field.name, 'file', e)}
                />
              ) : field.type === 'select' ? (
                <FormControl key={i} fullWidth required={field.required} size="small">
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    label={field.label}
                    value={formValues[field.name] ?? ''}
                    onChange={(e) => handleChange(field.name, 'select', e)}
                  >
                    {field.options?.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  key={i}
                  label={field.label}
                  type={field.type || 'text'}
                  value={formValues[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, field.type, e)}
                  fullWidth
                  required={field.required}
                  size="small"
                />
              )
            )}

            {fileError && (
              <Alert severity="error" onClose={() => setFileError(null)} sx={{ borderRadius: 2 }}>
                {fileError}
              </Alert>
            )}
          </Stack>
        </form>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit-form"
          variant="contained"
          disabled={submitting}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
        >
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditForm;
