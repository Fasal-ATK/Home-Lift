import React, { useState, useEffect } from 'react';
import { Modal, Box, TextField, Typography, Button, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function OtpModal({ open, onClose, onVerify, email, onResend, resending }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

    useEffect(() => {
    if (!open) {
      setOtp('');
      setError('');
    }
  }, [open]);

  const handleVerify = () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    // Ensure OTP is a string and remove any spaces
    const cleanOtp = otp.toString().replace(/\s/g, '');
    if (cleanOtp.length < 4) {
      setError('OTP must be at least 4 digits');
      return;
    }
    console.log('Submitting OTP:', cleanOtp);
    onVerify(cleanOtp); 
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        bgcolor: 'white', p: 4, borderRadius: 2,
        boxShadow: 4, width: 300, mx: 'auto', mt: '20vh', textAlign: 'center', position: 'relative'
      }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" mb={2}>Verify Email</Typography>
        <Typography variant="body2" mb={2}>Enter the OTP sent to {email}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          fullWidth
          label="OTP"
          type="text"
          inputProps={{ 
            maxLength: 6,
            pattern: '[0-9]*'
          }}
          value={otp}
          onChange={e => {
            // Only allow numbers
            const value = e.target.value.replace(/[^0-9]/g, '');
            setOtp(value);
          }}
          sx={{ mb: 2 }}
          placeholder="Enter 6-digit OTP"
        />
        <Button variant="contained" fullWidth onClick={handleVerify} sx={{ mt: 2 }}>
          Verify OTP
        </Button>
        <Button
          variant="text"
          fullWidth
          onClick={onResend}
          disabled={resending}
          sx={{ mt: 1 }}
        >
          {resending ? 'Resending...' : 'Resend OTP'}
        </Button>
      </Box>
    </Modal>
  );
}
