import React, { useState } from 'react';
import { Modal, Box, TextField, Typography, Button, Alert } from '@mui/material';

export default function OtpModal({ open, onClose, onVerify, email }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    onVerify(otp); 
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        bgcolor: 'white', p: 4, borderRadius: 2,
        boxShadow: 4, width: 300, mx: 'auto', mt: '20vh', textAlign: 'center'
      }}>
        <Typography variant="h6" mb={2}>Verify Email</Typography>
        <Typography variant="body2" mb={2}>Enter the OTP sent to {email}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          fullWidth
          label="OTP"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" fullWidth onClick={handleVerify}>
          Verify OTP
        </Button>
      </Box>
    </Modal>
  );
}
