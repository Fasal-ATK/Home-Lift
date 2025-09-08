// src/components/provider/ApplicationForm.jsx
import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  MenuItem,
  FormControl,
  Select,
  Paper,
  InputLabel,
} from '@mui/material';
import { Add, Remove, UploadFile, Close } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { applyProvider } from '../../redux/slices/user/userSlice';

const StyledBox = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
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

const ProviderApplicationModal = ({ open, onClose, categories, services }) => {
  const dispatch = useDispatch();
  const { loading, error, providerApplicationStatus } = useSelector(
    (state) => state.user
  );

  const [personalDoc, setPersonalDoc] = useState(null);
  const [serviceFields, setServiceFields] = useState([
    { category: '', service: '', doc: null },
  ]);

  const handlePersonalDocChange = (e) => setPersonalDoc(e.target.files[0]);

  const addServiceField = () => {
    if (serviceFields.length < 4) {
      setServiceFields([...serviceFields, { category: '', service: '', doc: null }]);
    }
  };

  const removeServiceField = (index) =>
    setServiceFields(serviceFields.filter((_, i) => i !== index));

  const handleCategoryChange = (index, value) => {
    const updated = [...serviceFields];
    updated[index].category = value;
    updated[index].service = '';
    updated[index].doc = null;
    setServiceFields(updated);
  };

  const handleServiceChange = (index, value) => {
    const updated = [...serviceFields];
    updated[index].service = value;
    setServiceFields(updated);
  };

  const handleServiceDocChange = (index, file) => {
    const updated = [...serviceFields];
    updated[index].doc = file;
    setServiceFields(updated);
  };

  // ✅ Filter services by category
  const getServiceOptions = (index) => {
    const selectedCategory = serviceFields[index].category;
    if (!selectedCategory) return [];
    return services.filter((svc) => svc.category === parseInt(selectedCategory));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!personalDoc) return alert('Please upload your personal verification document.');
    for (let s of serviceFields) {
      if (!s.category || !s.service) return alert('Please select category and service for all fields.');
    }

    const selectedServices = serviceFields.map((s) => s.service);
    if (new Set(selectedServices).size !== selectedServices.length) {
      return alert('Each service can only be selected once.');
    }

    const applicationData = {
      id_doc: personalDoc,
      document_type: 'id_proof',
      services: serviceFields.map((s) => ({
        service_id: s.service, // send ID to backend
        doc: s.doc,
      })),
    };

    dispatch(applyProvider(applicationData))
      .unwrap()
      .then(() => {
        alert('Application submitted successfully!');
        handleClose();
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to submit application.');
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
        {/* Close Button */}
        <Box display="flex" justifyContent="flex-end">
          <IconButton size="small" onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>

        <SectionTitle variant="h6">Apply to Become a Provider</SectionTitle>

        <form onSubmit={handleSubmit}>
          {/* Personal Verification Document */}
          <Box display="flex" alignItems="center" mb={4} gap={2}>
            <InputLabel sx={{ fontWeight: 500 }}>
              Personal Identity Verification Document
            </InputLabel>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg"
              onChange={handlePersonalDocChange}
              style={{ display: 'none' }}
              id="personal-doc"
            />
            <label htmlFor="personal-doc">
              <FileButton
                variant="outlined"
                component="span"
                startIcon={<UploadFile />}
              >
                {personalDoc ? personalDoc.name : 'Upload File'}
              </FileButton>
            </label>
          </Box>

          {/* Services Selection */}
          <SectionTitle variant="subtitle2">
            Select Services (up to 4) & Optional Documents
          </SectionTitle>

          {serviceFields.map((s, index) => (
            <Box
              key={index}
              mb={3}
              p={2}
              border="1px solid #e0e0e0"
              borderRadius={2}
              boxShadow={1}
            >
              <Box display="flex" alignItems="flex-start" mb={1} gap={1}>
                <FormControl fullWidth>
                  <Select
                    value={s.category}
                    onChange={(e) => handleCategoryChange(index, e.target.value)}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="" disabled>
                      Select Category
                    </MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <Select
                    value={s.service}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                    displayEmpty
                    disabled={!s.category}
                    size="small"
                  >
                    <MenuItem value="" disabled>
                      Select Service
                    </MenuItem>
                    {getServiceOptions(index).map((svc) => (
                      <MenuItem key={svc.id} value={svc.id}>
                        {svc.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box display="flex" flexDirection="column" mt={0.5}>
                  {index === serviceFields.length - 1 && serviceFields.length < 4 && (
                    <IconButton size="small" onClick={addServiceField} color="primary">
                      <Add />
                    </IconButton>
                  )}
                </Box>
              </Box>

              {/* Optional Service Doc + Remove Button */}
              {s.service && (
                <Box display="flex" alignItems="center" mt={1} gap={1}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg"
                    style={{ display: 'none' }}
                    id={`service-doc-${index}`}
                    onChange={(e) => handleServiceDocChange(index, e.target.files[0])}
                  />
                  <label htmlFor={`service-doc-${index}`}>
                    <FileButton
                      variant="outlined"
                      component="span"
                      startIcon={<UploadFile />}
                      size="small"
                    >
                      {s.doc ? s.doc.name : 'Upload Optional Document'}
                    </FileButton>
                  </label>

                  {s.doc && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleServiceDocChange(index, null)}
                    >
                      <Remove />
                    </IconButton>
                  )}

                  {serviceFields.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeServiceField(index)}
                    >
                      <Remove />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
          ))}

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

          {error && (
            <Typography color="error" mt={2}>
              {error}
            </Typography>
          )}
          {providerApplicationStatus === 'pending' && (
            <Typography color="primary" mt={2}>
              Your application is under review.
            </Typography>
          )}
        </form>
      </StyledBox>
    </Modal>
  );
};

export default ProviderApplicationModal;
