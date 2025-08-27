// src/components/Provider/modal/ProviderApplicationModal.jsx
import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 8,
  boxShadow: 24,
  padding: theme.spacing(4),
}));

const ProviderApplicationModal = ({ open, onClose, onSubmit, userId }) => {
  const [documentFile, setDocumentFile] = useState(null);

  const handleFileChange = (e) => {
    setDocumentFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!documentFile) {
      alert('Please upload your document.');
      return;
    }

    const formData = new FormData();
    formData.append('user', userId);
    formData.append('document', documentFile);
    formData.append('status', 'pending'); // hidden field

    await onSubmit(formData); // function to handle API call
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <StyledBox>
        <Typography variant="h6" gutterBottom>
          Apply to Become a Provider
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box mt={2}>
            <InputLabel>Upload Document (PDF, DOCX)</InputLabel>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg"
              onChange={handleFileChange}
              style={{ marginTop: '8px' }}
            />
          </Box>

          <Box mt={4} display="flex" justifyContent="flex-end">
            <Button variant="contained" color="primary" type="submit">
              Submit Application
            </Button>
          </Box>
        </form>
      </StyledBox>
    </Modal>
  );
};

export default ProviderApplicationModal;
