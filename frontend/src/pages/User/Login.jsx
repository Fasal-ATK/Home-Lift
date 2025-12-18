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
import validateLoginForm from '../../utils/loginVal';
import { ShowToast } from '../../components/common/Toast';
import GoogleLoginButton from '../../components/user/GoogleLoginButton';
import OtpModal from '../../components/user/otp_modal';

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
      console.error(err);

      if (err.response) {
        const backendError = err.response.data;
        const backendMessage =
          backendError?.message ||
          backendError?.detail ||
          backendError?.error ||
          'Login failed. Please check your credentials.';
        setError(backendMessage);
      } else if (err.request) {
        setError('Unable to connect to the server. Please try again later.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
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
      console.error("Send OTP error:", err);
      setError(extractErrorMessage(err.response?.data) || "Failed to send OTP");
    }
    setOtpLoading(false);
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

  // Verify OTP and navigate to password reset page
  const handleOtpVerify = async (otp) => {
    setError('');
    try {
      await otpService.verifyOtp({ email, otp });
      setShowOtpModal(false);
      ShowToast('OTP verified! Please set your new password.', 'success');
      // Navigate to forgot password page with email in state
      navigate('/forgot-password', { state: { email, otpVerified: true } });
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(extractErrorMessage(error.response?.data) || 'Invalid OTP');
      setShowOtpModal(false);
    }
  };

  const togglePasswordVisibility = () => setShowPass(prev => !prev);

  return (
    <Box sx={{ bgcolor: '#d9e021', minHeight: '100vh', py: 8 }}>
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
            User Login
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Email/Password Login Form */}
          <form onSubmit={handleLogin}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              sx={{ mt: 2 }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type={showPass ? 'text' : 'password'}
              fullWidth
              sx={{ mt: 2 }}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
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
                  fontSize: '0.875rem',
                  color: '#1976d2',
                  fontWeight: 500,
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
                mt: 2,
                bgcolor: '#e0dc25',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#d4ce1f' },
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

          <Typography variant="body2" sx={{ mt: 2 }}>
            Don't have an account?{' '}
            <Link href="/signup" underline="hover" sx={{ fontWeight: 'bold' }}>
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