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
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        p: 4,
        borderRadius: 4,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        width: { xs: '90%', sm: 360 },
        maxWidth: 380,
        mx: 'auto',
        mt: '20vh',
        textAlign: 'center',
        position: 'relative',
        color: '#0f172a',
        userSelect: 'text',
      }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 14,
            right: 14,
            color: '#64748b',
            '&:hover': { color: '#0f172a', transform: 'rotate(90deg)' },
            transition: 'all 0.25s ease',
          }}
          aria-label="close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Typography variant="h5" mb={1} fontWeight="800" sx={{ color: '#0f172a' }}>
          {getTitle()}
        </Typography>
        <Typography variant="body2" mb={2.5} sx={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
          {getMessage()}
          {timeLeft > 0 && (
            <Box component="span" sx={{
              display: 'inline-block',
              mt: 1.5,
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#4f46e5',
              bgcolor: 'rgba(79, 70, 229, 0.08)'
            }}>
              Expires in: {formatTime(timeLeft)}
            </Box>
          )}
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              textAlign: 'left',
            }}
          >
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Verification Code"
          type="text"
          inputProps={{
            maxLength: 6,
            pattern: '[0-9]*',
            style: { textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', fontWeight: 800 }
          }}
          value={otp}
          onChange={e => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            setOtp(value);
          }}
          sx={{
            mb: 2.5,
          }}
          placeholder="••••••"
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleVerify}
          sx={{
            mt: 1,
            py: 1.3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.95rem',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)',
              boxShadow: '0 6px 18px rgba(79, 70, 229, 0.42)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          Verify Code
        </Button>

        <Button
          variant="text"
          fullWidth
          onClick={onResend}
          disabled={resending || resendCountdown > 0}
          sx={{
            mt: 2,
            color: '#4f46e5',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.85rem',
            '&:hover': {
              color: '#3730a3',
              background: 'rgba(79, 70, 229, 0.04)',
            },
            '&:disabled': {
              color: '#94a3b8',
            }
          }}
        >
          {resending ? 'Resending...' : (resendCountdown > 0 ? `Resend available in ${formatTime(resendCountdown)}` : 'Resend Code')}
        </Button>
      </Box>
    </Modal>
  );
}