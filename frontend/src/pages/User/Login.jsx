// src/pages/user/Login.jsx
import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography, Box, Alert, CircularProgress,
  Link, IconButton, InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { authService, otpService } from '../../services/apiServices';
import { loginSuccess } from '../../redux/slices/authSlice';
import { startLoading, stopLoading } from '../../redux/slices/loadingSlice';
import validateLoginForm from '../../utils/loginVal';
import store from '../../redux/store/store';
import { ShowToast } from '../../components/common/Toast';
import GoogleLoginButton from '../../components/user/GoogleLoginButton';
import OtpModal from '../../components/user/otp_modal';
import { getErrorMessage } from '../../utils/errorHelper';

function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    const validationError = validateLoginForm({ email, password: pass });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const data = { email, password: pass };
      const response = await authService.login(data);
      const { user, access_token } = response;

      dispatch(loginSuccess({ user, access_token }));
      ShowToast(`Welcome back, ${user?.name || 'User'}!`, "success");
      navigate('/home');

    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
      // dispatch(stopLoading());
    }
  };

  // Handle Forgot Password Click
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Check if email is entered
    if (!email) {
      setError('Please enter your email address to reset password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setOtpLoading(true);
    try {
      await otpService.sendOtp({ email, purpose: 'forgot-password' });
      ShowToast('OTP sent to your email', 'success');
      setShowOtpModal(true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send OTP"));
    }
    setOtpLoading(false);
    // dispatch(stopLoading());
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResending(true);
    try {
      await otpService.sendOtp({ email, purpose: 'forgot-password' });
      ShowToast('OTP resent successfully', 'success');
    } catch (err) {
      setError(getErrorMessage(err, "Failed to resend OTP"));
    }
    setResending(false);
  };

  // Verify OTP and navigate to password reset page
  const handleOtpVerify = async (otp) => {
    setError('');
    try {
      await otpService.verifyOtp({
        email,
        otp,
        purpose: 'forgot-password',
      });

      setShowOtpModal(false);
      ShowToast('OTP verified! Please set your new password.', 'success');
      navigate('/forgot-password', { state: { email, otpVerified: true } });
    } catch (error) {
      setError(getErrorMessage(error, "Failed to verify OTP"));
      setShowOtpModal(false);
    } finally {
      // dispatch(stopLoading());
    }
  };


  const togglePasswordVisibility = () => setShowPass(prev => !prev);

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        minHeight: '100vh',
        py: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            px: { xs: 3, sm: 5 },
            pt: 6,
            pb: 5,
            textAlign: 'center',
            userSelect: 'text',
          }}
        >
          <Typography variant="h4" fontWeight="800" color="#0f172a" gutterBottom>
            User Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Welcome back! Please enter your details to sign in.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {/* Email/Password Login Form */}
          <form onSubmit={handleLogin}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              sx={{ mt: 1 }}
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />

            <TextField
              label="Password"
              type={showPass ? 'text' : 'password'}
              fullWidth
              sx={{ mt: 2.5 }}
              value={pass}
              onChange={(e) => setPass(e.target.value.replace(/\s/g, ''))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPass ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Forgot Password Link */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Link
                component="button"
                type="button"
                onClick={handleForgotPassword}
                underline="hover"
                sx={{
                  fontSize: '0.85rem',
                  color: '#4f46e5',
                  fontWeight: 600,
                  cursor: otpLoading ? 'not-allowed' : 'pointer',
                  opacity: otpLoading ? 0.6 : 1
                }}
                disabled={otpLoading}
              >
                {otpLoading ? 'Sending OTP...' : 'Forgot Password?'}
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                py: 1.4,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 4px 16px rgba(79, 70, 229, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)',
                  boxShadow: '0 6px 20px rgba(79, 70, 229, 0.45)',
                },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
          </form>

          {/* Google Login Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <GoogleLoginButton />
          </Box>

          <Typography variant="body2" sx={{ mt: 3, color: '#64748b' }}>
            Don't have an account?{' '}
            <Link href="/signup" underline="hover" sx={{ fontWeight: 700, color: '#4f46e5' }}>
              Sign Up
            </Link>
          </Typography>
        </Box>

        {/* OTP Modal for Forgot Password */}
        <OtpModal
          open={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          onVerify={handleOtpVerify}
          email={email}
          onResend={handleResendOtp}
          resending={resending}
          purpose="forgot-password"
        />
      </Container>
    </Box>
  );
}

export default Login;