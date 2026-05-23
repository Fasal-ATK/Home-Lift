// src/components/provider/ProviderRequestModal.jsx
import React from 'react';
import {
  Modal, Box, Typography, Button, IconButton, MenuItem, FormControl, Select, Paper, InputLabel, TextField, FormHelperText, Alert
} from '@mui/material';
import { Add, Remove, UploadFile, Close } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { providerService } from '../../services/apiServices';

const StyledBox = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  width: 700,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 12,
  boxShadow: theme.shadows[10],
  padding: theme.spacing(4),
  maxHeight: '90vh',
  overflowY: 'auto',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

const FileButton = styled(Button)(({ theme }) => ({
  borderColor: theme.palette.primary.main,
  textTransform: 'none',
  minWidth: 180,
}));

// ================= FileUpload Component =================
const FileUpload = ({ value, onChange, label, uniqueId, maxSizeMB = 10, error }) => {
  const [localError, setLocalError] = React.useState(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) {
      onChange(null);
      setLocalError(null);
      return;
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setLocalError(`File size exceeds ${maxSizeMB} MB limit.`);
      onChange(null);
      return;
    }
    setLocalError(null);
    onChange(selectedFile);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg"
          style={{ display: 'none' }}
          id={uniqueId}
          onChange={(e) => handleFileChange(e.target.files[0])}
        />
        <label htmlFor={uniqueId}>
          <FileButton variant="outlined" component="span" startIcon={<UploadFile />} color={error || localError ? "error" : "primary"}>
            {value ? value.name : label}
          </FileButton>
        </label>
        {value && (
          <IconButton size="small" color="error" onClick={() => handleFileChange(null)}>
            <Remove />
          </IconButton>
        )}
      </Box>
      {value && !localError && !error && (
        <Typography variant="caption" color="text.secondary">
          Size: {formatFileSize(value.size)} (Max: {maxSizeMB} MB)
        </Typography>
      )}
      {(error || localError) && (
        <Typography variant="caption" color="error">
          {error?.message || localError}
        </Typography>
      )}
    </Box>
  );
};

// Validation Schema
const schema = yup.object().shape({
  services: yup.array().of(
    yup.object().shape({
      category: yup.string().required('Category is required'),
      service: yup.string().required('Service is required'),
      price: yup.number()
        .transform((value, originalValue) => originalValue === "" ? null : value)
        .nullable()
        .typeError('Price must be a number')
        .min(0, 'Price cannot be negative'),
      experience_years: yup.number()
        .typeError('Experience must be a number')
        .min(0, 'Experience cannot be negative')
        .max(50, 'Max 50 years')
        .required('Experience is required'),
      doc: yup.mixed().nullable()
    })
  ).min(1, 'Add at least one service')
   .max(4, 'Maximum 4 services allowed')
   .test('unique-services', 'Each service can only be selected once', function (value) {
      if (!value) return true;
      const serviceIds = value.map(item => item.service).filter(Boolean);
      return new Set(serviceIds).size === serviceIds.length;
   })
});

// ================= ProviderRequestModal =================
const ProviderRequestModal = ({ open, onClose, categories, catalogue, onSuccess, onError }) => {
  const [saving, setSaving] = React.useState(false);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      services: [{ category: '', service: '', price: null, experience_years: 0, doc: null }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'services'
  });

  const watchServices = watch('services');

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await Promise.all(data.services.map(field => {
        const formData = new FormData();
        formData.append('service', field.service);
        if (field.price !== null && field.price !== undefined) formData.append('price', field.price);
        formData.append('experience_years', field.experience_years || 0);
        if (field.doc) formData.append('doc', field.doc);
        return providerService.submitServiceRequest(formData);
      }));

      onSuccess("Service request(s) submitted for admin approval.");
      handleClose();
    } catch (err) {
      const msg = err?.response?.data?.detail || Object.values(err?.response?.data || {}).flat().join(" ") || "Something went wrong.";
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose?.();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <StyledBox>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <SectionTitle variant="h6" sx={{ mb: 0 }}>Request New Services</SectionTitle>
          <IconButton size="small" onClick={handleClose} disabled={saving}><Close /></IconButton>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Adding new services requires administrator approval.
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {errors.services?.root && (
             <Typography color="error" variant="caption" sx={{ display: 'block', mb: 2 }}>
               {errors.services.root.message}
             </Typography>
          )}

          {fields.map((item, index) => {
            const currentCat = watchServices[index]?.category;
            const currentSvc = watchServices[index]?.service;
            
            const serviceOptions = currentCat
              ? catalogue.filter((s) => {
                  const isInCategory = s.category === parseInt(currentCat) || s.category?.id === parseInt(currentCat);
                  const selectedIds = watchServices.map(w => w.service).filter(Boolean);
                  return isInCategory && (!selectedIds.includes(s.id) || s.id === currentSvc);
                })
              : [];

            return (
              <Box key={item.id} mb={3} p={2} border="1px solid" borderColor={errors.services?.[index] ? "error.main" : "#e0e0e0"} borderRadius={2} boxShadow={1}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Controller
                      name={`services.${index}.category`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormControl fullWidth size="small" error={!!fieldState.error}>
                          <Select {...field} displayEmpty>
                            <MenuItem value="" disabled>Select Category</MenuItem>
                            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                          </Select>
                          {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                        </FormControl>
                      )}
                    />

                    <Controller
                      name={`services.${index}.service`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormControl fullWidth size="small" error={!!fieldState.error}>
                          <Select {...field} displayEmpty disabled={!currentCat}>
                            <MenuItem value="" disabled>Select Service</MenuItem>
                            {serviceOptions.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                          </Select>
                          {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                        </FormControl>
                      )}
                    />

                    {fields.length > 1 && (
                      <IconButton size="small" color="error" onClick={() => remove(index)}>
                        <Remove />
                      </IconButton>
                    )}
                  </Box>

                  <Box display="flex" alignItems="flex-start" gap={2}>
                     <Box flex={1}>
                      <Controller
                        name={`services.${index}.price`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ""}
                            label="Requested Price (₹)"
                            type="number"
                            size="small"
                            fullWidth
                            helperText={fieldState.error ? fieldState.error.message : "Leave blank for default"}
                            error={!!fieldState.error}
                            sx={{ mb: 2 }}
                          />
                        )}
                      />
                      <Controller
                        name={`services.${index}.experience_years`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Experience (Years)"
                            type="number"
                            size="small"
                            fullWidth
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                     </Box>
                     
                     <Box flex={1}>
                        <Controller
                          name={`services.${index}.doc`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <FileUpload
                              value={field.value}
                              onChange={field.onChange}
                              label="Service Doc (Optional)"
                              uniqueId={`bio-svc-doc-${index}`}
                              error={fieldState.error}
                            />
                          )}
                        />
                     </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}

          {fields.length < 4 && (
            <Box mb={3}>
              <Button variant="outlined" startIcon={<Add />} onClick={() => append({ category: '', service: '', price: null, experience_years: 0, doc: null })} size="small">
                Add Another Service
              </Button>
            </Box>
          )}

          <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={handleClose} disabled={saving}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={saving}>
              {saving ? "Submitting…" : "Submit Requests"}
            </Button>
          </Box>
        </form>
      </StyledBox>
    </Modal>
  );
};

export default ProviderRequestModal;
