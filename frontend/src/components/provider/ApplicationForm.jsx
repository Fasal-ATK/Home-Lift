// src/components/provider/ApplicationForm.jsx
import React from 'react';
import {
  Modal, Box, Typography, Button, IconButton, MenuItem, FormControl,
  Select, Paper, InputLabel, TextField, FormHelperText, useMediaQuery,
  useTheme, Divider
} from '@mui/material';
import { Add, Remove, UploadFile, Close } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { applyProvider } from '../../redux/slices/user/userSlice';
import { ShowToast } from '../../components/common/Toast';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

// ================= Styled Components =================
const StyledBox = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  width: '95vw',
  maxWidth: 640,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 12,
  boxShadow: theme.shadows[10],
  padding: theme.spacing(2.5),
  maxHeight: '92vh',
  overflowY: 'auto',
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
    width: '88vw',
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(5),
    width: 620,
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

// ================= FileUpload Component =================
const FileUpload = ({ value, onChange, label, uniqueId, maxSizeMB = 10, error }) => {
  const [localError, setLocalError] = React.useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) { onChange(null); setLocalError(null); return; }
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg"
          style={{ display: 'none' }}
          id={uniqueId}
          onChange={(e) => handleFileChange(e.target.files[0])}
        />
        <label htmlFor={uniqueId} style={{ width: isMobile ? '100%' : 'auto' }}>
          <Button
            variant="outlined"
            component="span"
            startIcon={<UploadFile />}
            color={error || localError ? 'error' : 'primary'}
            fullWidth={isMobile}
            sx={{ textTransform: 'none', minWidth: { xs: '100%', sm: 180 } }}
          >
            {value ? value.name : label}
          </Button>
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

// ================= Validation Schema =================
const schema = yup.object().shape({
  personalDoc: yup.mixed().required('Personal Verification Document is required'),
  services: yup.array().of(
    yup.object().shape({
      category: yup.string().required('Category is required'),
      service: yup.string().required('Service is required'),
      experience_years: yup.number()
        .typeError('Must be a number')
        .min(0, 'Cannot be negative')
        .max(50, 'Max 50 years')
        .required('Required'),
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

// ================= ProviderApplicationModal =================
const ProviderApplicationModal = ({ open, onClose, categories, services }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { loading, error: reduxError, providerApplicationStatus } = useSelector((state) => state.user);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      personalDoc: null,
      services: [{ category: '', service: '', experience_years: 0, doc: null }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'services' });
  const watchServices = watch('services');

  const onSubmit = (data) => {
    const applicationData = {
      id_doc: data.personalDoc,
      services: data.services.map((s) => ({
        service_id: s.service,
        doc: s.doc,
        experience_years: s.experience_years
      })),
    };
    dispatch(applyProvider(applicationData))
      .unwrap()
      .then(() => {
        ShowToast('Application submitted successfully!', 'success');
        handleClose();
      })
      .catch((err) => {
        ShowToast(
          typeof err === 'object'
            ? 'Failed to submit application:\n' + JSON.stringify(err, null, 2)
            : 'Failed to submit application: ' + err,
          'error'
        );
      });
  };

  const handleClose = () => { reset(); onClose?.(); };

  return (
    <Modal open={open} onClose={handleClose}>
      <StyledBox>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <SectionTitle variant="h6" sx={{ mb: 0, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Apply to Become a Provider
          </SectionTitle>
          <IconButton size="small" onClick={handleClose}><Close /></IconButton>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── Personal Identity Verification ── */}
          <Box mb={3}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              mb={1}
              color="text.secondary"
              sx={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: 0.8 }}
            >
              Personal Identity Verification
            </Typography>
            <Controller
              name="personalDoc"
              control={control}
              render={({ field, fieldState }) => (
                <FileUpload
                  value={field.value}
                  onChange={field.onChange}
                  label="Upload ID Document"
                  uniqueId="personal-doc"
                  error={fieldState.error}
                />
              )}
            />
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* ── Services Section header ── */}
          <Box mb={2}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              mb={0.5}
              color="text.secondary"
              sx={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: 0.8 }}
            >
              Services (up to 4)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Select your service categories and optionally upload supporting documents.
            </Typography>
          </Box>

          {errors.services?.root && (
            <Typography color="error" variant="caption" sx={{ display: 'block', mb: 1.5 }}>
              {errors.services.root.message}
            </Typography>
          )}
          {typeof errors.services?.message === 'string' && (
            <Typography color="error" variant="caption" sx={{ display: 'block', mb: 1.5 }}>
              {errors.services.message}
            </Typography>
          )}

          {/* ── Service rows ── */}
          {fields.map((item, index) => {
            const currentCat = watchServices[index]?.category;
            const currentSvc = watchServices[index]?.service;
            const serviceOptions = currentCat
              ? services.filter((s) => {
                  const isInCategory =
                    s.category === parseInt(currentCat) ||
                    s.category?.id === parseInt(currentCat);
                  const selectedIds = watchServices.map(w => w.service).filter(Boolean);
                  return isInCategory && (!selectedIds.includes(s.id) || s.id === currentSvc);
                })
              : [];

            return (
              <Box
                key={item.id}
                mb={2}
                p={{ xs: 1.5, sm: 2 }}
                border="1px solid"
                borderColor={errors.services?.[index] ? 'error.main' : '#e0e0e0'}
                borderRadius={2}
                boxShadow={1}
              >
                {/* Card header: label + remove */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Service {index + 1}
                  </Typography>
                  {fields.length > 1 && (
                    <IconButton size="small" color="error" onClick={() => remove(index)}>
                      <Remove fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {/* Category + Service: column on xs, row on sm+ */}
                <Box
                  display="flex"
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  gap={1.5}
                  mb={1.5}
                >
                  <Controller
                    name={`services.${index}.category`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormControl fullWidth size="small" error={!!fieldState.error}>
                        <InputLabel>Category</InputLabel>
                        <Select {...field} label="Category">
                          {categories.map((c) => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                          ))}
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
                        <InputLabel>Service</InputLabel>
                        <Select {...field} label="Service" disabled={!currentCat}>
                          {serviceOptions.map((s) => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                          ))}
                        </Select>
                        {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Box>

                {/* Experience: full width on mobile */}
                <Controller
                  name={`services.${index}.experience_years`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Years of Experience"
                      type="number"
                      size="small"
                      sx={{ width: { xs: '100%', sm: 200 } }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      inputProps={{ min: 0, max: 50 }}
                    />
                  )}
                />

                {/* Optional document */}
                {currentSvc && (
                  <Box mt={1.5}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      Optional: Upload a supporting document
                    </Typography>
                    <Controller
                      name={`services.${index}.doc`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <FileUpload
                          value={field.value}
                          onChange={field.onChange}
                          label="Upload Document"
                          uniqueId={`service-doc-${index}`}
                          error={fieldState.error}
                        />
                      )}
                    />
                  </Box>
                )}
              </Box>
            );
          })}

          {/* Add service */}
          {fields.length < 4 && (
            <Box mb={3}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => append({ category: '', service: '', experience_years: 0, doc: null })}
                fullWidth={isMobile}
                sx={{ textTransform: 'none' }}
              >
                Add Another Service
              </Button>
            </Box>
          )}

          {/* Submit */}
          <Box mt={3} display="flex" justifyContent={{ xs: 'stretch', sm: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              fullWidth={isMobile}
              size={isMobile ? 'large' : 'medium'}
              sx={{ minWidth: { sm: 160 } }}
            >
              {loading ? 'Submitting…' : 'Submit Application'}
            </Button>
          </Box>

          {reduxError && (
            <Typography color="error" mt={2} variant="body2">{reduxError}</Typography>
          )}
          {providerApplicationStatus === 'pending' && (
            <Typography color="primary" mt={2} variant="body2">
              Your application is under review.
            </Typography>
          )}
        </form>
      </StyledBox>
    </Modal>
  );
};

export default ProviderApplicationModal;

