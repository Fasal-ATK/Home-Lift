import React, { useState, useEffect } from 'react';
import { Modal, Box, TextField, Typography, Button, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function OtpModal({
  open,
  onClose,
  onVerify,
  email,
  onResend,
  resending,
  purpose = 'signup', // 'signup' or 'forgot-password'
  expiryTimestamp
}) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(60);

  useEffect(() => {
    if (open && expiryTimestamp) {
      setOtp('');
      setError('');
      setResendCountdown(60); // Reset independent resend timer

      const calculateTimeLeft = () => {
        const now = Date.now() / 1000;
        const secondsLeft = Math.max(0, Math.floor(expiryTimestamp - now));
        setTimeLeft(secondsLeft);
      };

      calculateTimeLeft();
      const timer = setInterval(() => {
        calculateTimeLeft();
        setResendCountdown(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    } else if (!open) {
      setOtp('');
      setError('');
    }
  }, [open, expiryTimestamp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    const cleanOtp = otp.toString().replace(/\s/g, '');
    if (cleanOtp.length < 4) {
      setError('OTP must be at least 4 digits');
      return;
    }
    console.log('Submitting OTP:', cleanOtp);
    onVerify(cleanOtp);
  };

  // Customize text based on purpose
  const getTitle = () => {
    return purpose === 'forgot-password' ? 'Reset Password' : 'Verify Email';
  };

  const getMessage = () => {
    return purpose === 'forgot-password'
      ? `Enter the OTP sent to ${email} to reset your password`
      : `Enter the OTP sent to ${email}`;
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        bgcolor: 'white', p: 4, borderRadius: 2,
        boxShadow: 4, width: 300, mx: 'auto', mt: '20vh', textAlign: 'center', position: 'relative'
      }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" mb={2}>{getTitle()}</Typography>
        <Typography variant="body2" mb={2}>
          {getMessage()}
          {timeLeft > 0 && (
            <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold', color: 'primary.main' }}>
              Expires in: {formatTime(timeLeft)}
            </Box>
          )}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
            const value = e.target.value.replace(/[^0-9]/g, '');
            setOtp(value);
          }}
          sx={{ mb: 2 }}
          placeholder="Enter 6-digit OTP"
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleVerify}
          sx={{ mt: 2 }}
        >
          Verify OTP
        </Button>

        <Button
          variant="text"
          fullWidth
          onClick={onResend}
          disabled={resending || resendCountdown > 0}
          sx={{ mt: 1 }}
        >
          {resending ? 'Resending...' : (resendCountdown > 0 ? `Resend available in ${formatTime(resendCountdown)}` : 'Resend OTP')}
        </Button>
      </Box>
    </Modal>
  );
}