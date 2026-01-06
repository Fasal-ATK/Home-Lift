// src/components/user/auth/NewPassword.jsx
import React, { useState, useEffect } from 'react';
import {
  Container, TextField, Button, Typography, Box, Alert, CircularProgress, Link,
  IconButton, InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { otpService, authService } from '../../../services/apiServices';
import { logout } from '../../../redux/slices/authSlice';
import OtpModal from '../otp_modal';
import { ShowToast } from '../../common/Toast';

function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Check if user is authenticated (for change password mode)
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Check if coming from login page with OTP already verified
  const emailFromLogin = location.state?.email;
  const otpVerifiedFromLogin = location.state?.otpVerified;

  // Determine mode: 'forgot' (before login) or 'change' (after login)
  const mode = location.pathname === '/change-password' && isAuthenticated ? 'change' : 'forgot';

  // States
  const [step, setStep] = useState(
    mode === 'change' ? 3 : otpVerifiedFromLogin ? 3 : 1
  );
  const [email, setEmail] = useState(emailFromLogin || user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // If OTP was verified from login, skip to password reset
    if (otpVerifiedFromLogin && emailFromLogin) {
      setStep(3);
      setEmail(emailFromLogin);
    }
  }, [otpVerifiedFromLogin, emailFromLogin]);

  const extractErrorMessage = (data) => {
    if (!data) return "Something went wrong";
    if (typeof data === "string") return data;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (typeof data === "object") {
      for (let key in data) {
        const val = data[key];
        if (Array.isArray(val) && val.length > 0) {
          const first = val[0];
          if (typeof first === "string") return first;
        }
      }
    }
    return "An unknown error occurred";
  };

  // Step 1: Send OTP to email (Forgot Password only)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await otpService.sendOtp({ email, purpose: 'forgot-password' });
      setShowOtpModal(true);
    } catch (err) {
      console.error("Send OTP error:", err);
      setError(extractErrorMessage(err.response?.data) || "Failed to send OTP");
    }
    setLoading(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResending(true);
    try {
      await otpService.sendOtp({ email, purpose: 'forgot-password' });
      ShowToast('OTP resent successfully', 'success');
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(extractErrorMessage(err.response?.data) || "Failed to resend OTP");
    }
    setResending(false);
  };

  // Step 2: Verify OTP (Forgot Password only)
  const handleOtpVerify = async (otp) => {
    setError('');
    try {
      await otpService.verifyOtp({ email, otp, purpose: 'forgot-password' });
      setShowOtpModal(false);
      setStep(3); // Move to password reset step
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(extractErrorMessage(error.response?.data) || 'Invalid OTP');
      setShowOtpModal(false);
    }
  };

  // Step 3: Reset/Change password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation for change password mode
    if (mode === 'change' && !currentPassword) {
      setError('Please enter your current password');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'change') {
        // Change password (user is logged in)
        await authService.changePassword({
          current_password: currentPassword,
          new_password: newPassword
        });

        // Logout user after password change
        dispatch(logout());

        ShowToast('Password changed successfully! Please login again.', 'success');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        // Reset password (forgot password flow)
        await authService.resetPassword({
          email,
          new_password: newPassword
        });
        ShowToast('Password reset successful! Please log in.', 'success');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      console.error('Password update error:', err);
      setError(extractErrorMessage(err.response?.data) || 'Failed to update password');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ bgcolor: mode === 'change' ? '#f5f5f5' : '#d9e021', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: 4,
            boxShadow: 4,
            px: 4,
            pt: 8,
            pb: 5,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {mode === 'change'
              ? 'Change Password'
              : step === 1
                ? 'Forgot Password'
                : 'Reset Password'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Step 1: Enter Email (Forgot Password only - if not coming from login) */}
          {mode === 'forgot' && step === 1 && !otpVerifiedFromLogin && (
            <form onSubmit={handleSendOtp}>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Enter your email address and we'll send you an OTP to reset your password.
              </Typography>

              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  bgcolor: '#e0dc25',
                  color: 'black',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#d4ce1f' },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
              </Button>
            </form>
          )}

          {/* Step 3: Enter New Password (Both modes) */}
          {step === 3 && (
            <form onSubmit={handlePasswordSubmit}>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                {mode === 'change'
                  ? 'Enter your current password and choose a new password.'
                  : 'Enter your new password below.'}
              </Typography>

              {/* Current Password (Change Password mode only) */}
              {mode === 'change' && (
                <TextField
                  label="Current Password"
                  type={showCurrentPass ? 'text' : 'password'}
                  fullWidth
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowCurrentPass(!showCurrentPass)} edge="end">
                          {showCurrentPass ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              {/* New Password */}
              <TextField
                label="New Password"
                type={showNewPass ? 'text' : 'password'}
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPass(!showNewPass)} edge="end">
                        {showNewPass ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Confirm Password */}
              <TextField
                label="Confirm Password"
                type={showConfirmPass ? 'text' : 'password'}
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPass(!showConfirmPass)} edge="end">
                        {showConfirmPass ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  bgcolor: '#e0dc25',
                  color: 'black',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#d4ce1f' },
                }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : mode === 'change' ? (
                  'Change Password'
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          {/* Footer Links */}
          {mode === 'forgot' && (
            <Typography variant="body2" sx={{ mt: 3 }}>
              Remember your password?{' '}
              <Link href="/login" underline="hover" sx={{ fontWeight: 'bold' }}>
                Login
              </Link>
            </Typography>
          )}

          {mode === 'change' && (
            <Typography variant="body2" sx={{ mt: 3 }}>
              <Link href="/profile" underline="hover" sx={{ fontWeight: 'bold' }}>
                Back to Profile
              </Link>
            </Typography>
          )}
        </Box>

        {/* OTP Modal (Forgot Password only - when not coming from login) */}
        {mode === 'forgot' && !otpVerifiedFromLogin && (
          <OtpModal
            open={showOtpModal}
            onClose={() => setShowOtpModal(false)}
            onVerify={handleOtpVerify}
            email={email}
            onResend={handleResendOtp}
            resending={resending}
            purpose="forgot-password"
          />
        )}
      </Container>
    </Box>
  );
}

export default ForgotPassword;