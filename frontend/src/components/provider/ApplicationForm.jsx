// src/components/provider/ApplicationForm.jsx
import React, { useState } from 'react';
import {
  Modal, Box, Typography, Button, IconButton, MenuItem, FormControl, Select, Paper, InputLabel
} from '@mui/material';
import { Add, Remove, UploadFile, Close } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { applyProvider } from '../../redux/slices/user/userSlice';

const StyledBox = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  width: 620,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 12,
  boxShadow: theme.shadows[10],
  padding: theme.spacing(5),
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
const FileUpload = ({ file, onChange, label, uniqueId, maxSizeMB = 10 }) => {
  const [error, setError] = React.useState(null);

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
      setError(null);
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB} MB limit. Your file is ${formatFileSize(selectedFile.size)}.`);
      onChange(null);
      return;
    }

    setError(null);
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
          <FileButton variant="outlined" component="span" startIcon={<UploadFile />}>
            {file ? file.name : label}
          </FileButton>
        </label>
        {file && (
          <IconButton size="small" color="error" onClick={() => handleFileChange(null)}>
            <Remove />
          </IconButton>
        )}
      </Box>
      {file && !error && (
        <Typography variant="caption" color="text.secondary">
          Size: {formatFileSize(file.size)} (Max: {maxSizeMB} MB)
        </Typography>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
};

// ================= ServiceField Component =================
const ServiceField = ({
  index, field, categories, services,
  handleCategoryChange, handleServiceChange,
  handleServiceDocChange, removeField, canRemove
}) => {
  const serviceOptions = field.category
    ? services.filter((s) => s.category === parseInt(field.category))
    : [];

  return (
    <Box mb={3} p={2} border="1px solid #e0e0e0" borderRadius={2} boxShadow={1}>
      <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
        <FormControl fullWidth size="small">
          <Select
            value={field.category}
            onChange={(e) => handleCategoryChange(index, e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled>Select Category</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <Select
            value={field.service}
            onChange={(e) => handleServiceChange(index, e.target.value)}
            displayEmpty
            disabled={!field.category}
          >
            <MenuItem value="" disabled>Select Service</MenuItem>
            {serviceOptions.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>

        {canRemove && (
          <IconButton size="small" color="error" onClick={() => removeField(index)}>
            <Remove />
          </IconButton>
        )}
      </Box>

      {field.service && (
        <Box display="flex" alignItems="center" gap={1} mt={1}>
          <FileUpload
            file={field.doc}
            onChange={(file) => handleServiceDocChange(index, file)}
            label="Upload Optional Document"
            uniqueId={`service-doc-${index}`}
          />
        </Box>
      )}
    </Box>
  );
};

// ================= ProviderApplicationModal =================
const ProviderApplicationModal = ({ open, onClose, categories, services }) => {
  const dispatch = useDispatch();
  const { loading, error, providerApplicationStatus } = useSelector((state) => state.user);

  const [personalDoc, setPersonalDoc] = useState(null);
  const [serviceFields, setServiceFields] = useState([{ category: '', service: '', doc: null }]);

  const addField = () => serviceFields.length < 4 && setServiceFields([...serviceFields, { category: '', service: '', doc: null }]);
  const removeField = (i) => setServiceFields(serviceFields.filter((_, idx) => idx !== i));
  const handleCategoryChange = (i, value) => {
    const updated = [...serviceFields];
    updated[i] = { category: value, service: '', doc: null };
    setServiceFields(updated);
  };
  const handleServiceChange = (i, value) => {
    const updated = [...serviceFields];
    updated[i].service = value;
    setServiceFields(updated);
  };
  const handleServiceDocChange = (i, file) => {
    const updated = [...serviceFields];
    updated[i].doc = file;
    setServiceFields(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!personalDoc) return alert('Please upload your personal verification document.');
    for (let s of serviceFields) if (!s.category || !s.service) return alert('Please select category and service for all fields.');

    const selectedServices = serviceFields.map((s) => s.service);
    if (new Set(selectedServices).size !== selectedServices.length) return alert('Each service can only be selected once.');

    const applicationData = {
      id_doc: personalDoc,
      services: serviceFields.map((s) => ({ service_id: s.service, doc: s.doc })),
    };
    console.log('🚀 Submitting application with data:', applicationData);

    dispatch(applyProvider(applicationData))
      .unwrap()
      .then(() => {
        alert('Application submitted successfully!');
        handleClose();
      })
      .catch((err) => {
        console.error('❌ Application submission error:', err);
        if (typeof err === 'object') {
          alert('Failed to submit application:\n' + JSON.stringify(err, null, 2));
        } else {
          alert('Failed to submit application: ' + err);
        }
      });
  };

  const handleClose = () => {
    setPersonalDoc(null);
    setServiceFields([{ category: '', service: '', doc: null }]);
    onClose?.();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <StyledBox>
        <Box display="flex" justifyContent="flex-end">
          <IconButton size="small" onClick={handleClose}><Close /></IconButton>
        </Box>

        <SectionTitle variant="h6">Apply to Become a Provider</SectionTitle>

        <form onSubmit={handleSubmit}>
          {/* Personal Identity Verification */}
          <Box display="flex" alignItems="center" mb={3} gap={2}>
            <InputLabel sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>Upload your Personal Identity Verification document/image</InputLabel>
            <FileUpload
              file={personalDoc}
              onChange={setPersonalDoc}
              label="Upload File"
              uniqueId="personal-doc"
            />
          </Box>

          {/* Services Section */}
          <SectionTitle variant="subtitle2">Select Services (up to 4) & Optional Documents</SectionTitle>
          {serviceFields.map((f, i) => (
            <ServiceField
              key={i}
              index={i}
              field={f}
              categories={categories}
              services={services}
              handleCategoryChange={handleCategoryChange}
              handleServiceChange={handleServiceChange}
              handleServiceDocChange={handleServiceDocChange}
              removeField={removeField}
              canRemove={serviceFields.length > 1}
            />
          ))}

          {serviceFields.length < 4 && (
            <Box mb={3}>
              <Button variant="outlined" startIcon={<Add />} onClick={addField}>
                Add Another Service
              </Button>
            </Box>
          )}

          <Box mt={4} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={
                !personalDoc ||
                serviceFields.some((s) => !s.category || !s.service) ||
                loading
              }
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </Box>

          {error && <Typography color="error" mt={2}>{error}</Typography>}
          {providerApplicationStatus === 'pending' && (
            <Typography color="primary" mt={2}>Your application is under review.</Typography>
          )}
        </form>
      </StyledBox>
    </Modal>
  );
};

export default ProviderApplicationModal;
