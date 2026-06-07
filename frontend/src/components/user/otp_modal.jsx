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

  const handleVerify = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    const cleanOtp = otp.toString().replace(/\s/g, '');
    if (cleanOtp.length < 4) {
      setError('OTP must be at least 4 digits');
      return;
    }
    try {
      await onVerify(cleanOtp);
    } catch (err) {
      setError(err.message);
    }
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
        background: 'rgba(30, 27, 75, 0.85)', // dark indigo glass base
        backdropFilter: 'blur(20px)',
        webkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        p: 4,
        borderRadius: 5,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        width: 320,
        mx: 'auto',
        mt: '20vh',
        textAlign: 'center',
        position: 'relative',
        color: '#ffffff',
      }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: 'rgba(255, 255, 255, 0.65)',
            '&:hover': { color: '#ffffff', transform: 'rotate(90deg)' },
            transition: 'all 0.28s ease',
          }}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" mb={1} fontWeight="bold" sx={{ color: '#ffffff' }}>
          {getTitle()}
        </Typography>
        <Typography variant="body2" mb={3} sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
          {getMessage()}
          {timeLeft > 0 && (
            <Box component="span" sx={{ display: 'block', mt: 1.5, fontWeight: 'bold', color: '#818cf8' }}>
              Expires in: {formatTime(timeLeft)}
            </Box>
          )}
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: '12px',
              bgcolor: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              textAlign: 'left',
              '& .MuiAlert-icon': {
                color: '#f87171',
              }
            }}
          >
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="OTP"
          type="text"
          inputProps={{
            maxLength: 6,
            pattern: '[0-9]*',
            style: { textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', fontWeight: 'bold' }
          }}
          value={otp}
          onChange={e => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            setOtp(value);
          }}
          sx={{
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '12px',
                transition: 'border-color 0.2s ease',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.55)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#818cf8',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.6)',
              '&.Mui-focused': {
                color: '#818cf8',
              },
            },
          }}
          placeholder="••••••"
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleVerify}
          sx={{
            mt: 1,
            bgcolor: '#ffffff',
            color: '#1e1b4b',
            fontWeight: 'bold',
            borderRadius: '12px',
            py: 1.3,
            textTransform: 'none',
            fontSize: '0.95rem',
            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.15)',
            '&:hover': {
              bgcolor: '#f3f4f6',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(255, 255, 255, 0.25)',
            },
            transition: 'all 0.25s ease',
          }}
        >
          Verify OTP
        </Button>

        <Button
          variant="text"
          fullWidth
          onClick={onResend}
          disabled={resending || resendCountdown > 0}
          sx={{
            mt: 2,
            color: '#a5b4fc',
            textTransform: 'none',
            fontSize: '0.85rem',
            '&:hover': {
              color: '#c7d2fe',
              background: 'rgba(255, 255, 255, 0.05)',
            },
            '&:disabled': {
              color: 'rgba(255, 255, 255, 0.35)',
            }
          }}
        >
          {resending ? 'Resending...' : (resendCountdown > 0 ? `Resend available in ${formatTime(resendCountdown)}` : 'Resend OTP')}
        </Button>
      </Box>
    </Modal>
  );
}