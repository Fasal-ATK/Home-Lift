import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography,
  Box, Alert, CircularProgress, Grid, Checkbox,
  FormControlLabel, Link, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService, otpService } from '../../services/apiServices';
import { useForm } from 'react-hook-form';

import OtpModal from '../../components/user/otp_modal';
import { ShowToast } from '../../components/common/Toast';
import { getErrorMessage } from '../../utils/errorHelper';
import { useDispatch } from 'react-redux';
import GoogleLoginButton from '../../components/user/GoogleLoginButton';

function Signup() {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors: formErrors },
    getValues
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      fname: '',
      lname: '',
      uname: '',
      phone: '',
      email: '',
      pass1: '',
      pass2: '',
    }
  });

  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [backendError, setBackendError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiryTimestamp, setExpiryTimestamp] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const watchedEmail = watch('email');

  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (/[a-z]/.test(pass)) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/\d/.test(pass)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(watch('pass1'));

  // Form submit: send OTP
  const onSignupSubmit = async (data) => {
    setBackendError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await otpService.sendOtp({ email: data.email });

      if (response.expiry_timestamp) {
        setExpiryTimestamp(response.expiry_timestamp);
      }
      setShowOtpModal(true);
    } catch (err) {
      setBackendError(getErrorMessage(err, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResending(true);
    const email = getValues('email');
    try {
      const response = await otpService.sendOtp({ email });

      if (response.expiry_timestamp) {
        setExpiryTimestamp(response.expiry_timestamp);
      }
    } catch (err) {
      setBackendError(getErrorMessage(err, "Failed to resend OTP"));
    } finally {
      setResending(false);
    }
  };

  // Verify OTP and register user
  const handleOtpVerify = async (otp) => {
    setBackendError('');
    try {
      const data = getValues();
      const otpResponse = await otpService.verifyOtp({ email: data.email, otp });

      const userData = {
        first_name: data.fname,
        last_name: data.lname,
        username: data.uname,
        phone: `+91${data.phone}`,
        email: data.email,
        password: data.pass1,
        otp: otp,
      };

      const registerResponse = await authService.signup({ userData });

      setSuccess('Registration successful!');
      setShowOtpModal(false);
      ShowToast('Registration successful! Please log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      const backendData = error.response?.data;
      if (backendData && typeof backendData === 'object') {
        // Map backend field errors to react-hook-form
        // Backend keys are username, first_name, last_name, email, phone, password
        // Frontend keys are uname, fname, lname, email, phone, pass1
        const fieldMapping = {
          username: 'uname',
          first_name: 'fname',
          last_name: 'lname',
          email: 'email',
          phone: 'phone',
          password: 'pass1'
        };

        let hasFieldErrors = false;
        Object.keys(backendData).forEach(key => {
          const formField = fieldMapping[key];
          if (formField) {
            hasFieldErrors = true;
            const errorObj = backendData[key];
            const message = typeof errorObj === 'string' ? errorObj : (errorObj.message || errorObj[0] || 'Invalid value');
            setError(formField, { type: 'manual', message });
          }
        });

        if (hasFieldErrors) {
          setShowOtpModal(false); // Close modal so user can fix fields
          setBackendError('Please correct the highlighted errors.');
          return;
        }
      }

      const msg = getErrorMessage(error, 'Invalid OTP or Registration failed');
      throw new Error(msg);
    }
  };

  return (
    <Box sx={{ bgcolor: '#d9e021', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="sm" sx={{ position: 'relative' }}>
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: 4,
            boxShadow: 4,
            px: 4,
            pt: 8,
            pb: 5,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            User Registration
          </Typography>

          {backendError && <Alert severity="error" sx={{ mb: 2 }}>{backendError}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit(onSignupSubmit)}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="First name"
                  fullWidth
                  {...register('fname', { 
                    required: 'First name is required',
                    pattern: {
                      value: /^[A-Za-z]+(?: [A-Za-z]+)?$/,
                      message: 'Only letters and at most one space allowed'
                    }
                  })}
                  error={!!formErrors.fname}
                  helperText={formErrors.fname?.message}
                  onInput={(e) => { e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, ''); }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last name"
                  fullWidth
                  {...register('lname', { 
                    required: 'Last name is required',
                    pattern: {
                      value: /^[A-Za-z]+(?: [A-Za-z]+)?$/,
                      message: 'Only letters and at most one space allowed'
                    }
                  })}
                  error={!!formErrors.lname}
                  helperText={formErrors.lname?.message}
                  onInput={(e) => { e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, ''); }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Username"
              fullWidth
              sx={{ mt: 2 }}
              {...register('uname', { 
                required: 'Username is required',
                pattern: {
                  value: /^[a-zA-Z0-9_]{3,20}$/,
                  message: '3–20 characters (letters, numbers, underscores only)'
                }
              })}
              error={!!formErrors.uname}
              helperText={formErrors.uname?.message}
              onInput={(e) => { e.target.value = e.target.value.replace(/[^A-Za-z0-9_]/g, ''); }}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              sx={{ mt: 2 }}
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email format'
                }
              })}
              error={!!formErrors.email}
              helperText={formErrors.email?.message}
              disabled={showOtpModal}
              onInput={(e) => { e.target.value = e.target.value.replace(/\s/g, ''); }}
            />
            <TextField
                label="Phone"
                type="tel"
                fullWidth
                sx={{ mt: 2 }}
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^\d{10}$/,
                    message: 'Enter exactly 10 digits'
                  },
                  onBlur: (e) => {
                    // Trim any extra digits on blur
                    const trimmed = e.target.value.replace(/\D/g, '').slice(0, 10);
                    e.target.value = trimmed;
                  }
                })}
                error={!!formErrors.phone}
                helperText={formErrors.phone?.message}
                inputProps={{ maxLength: 10 }}
                onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }}
                onPaste={(e) => {
                  // Allow pasting only numeric characters, truncate to 10 digits
                  const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
                  e.preventDefault();
                  e.target.value = paste;
                }}
              />

            <TextField
              label="Password"
              type={showPass1 ? 'text' : 'password'}
              fullWidth
              sx={{ mt: 2 }}
              {...register('pass1', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters long' },
                maxLength: { value: 128, message: 'Password cannot exceed 128 characters' },
                validate: {
                  hasLetter: v => /[a-zA-Z]/.test(v) || 'Password must include at least one letter',
                  hasNumber: v => /\d/.test(v) || 'Password must include at least one number',
                  noSpaces: v => !/\s/.test(v) || 'Password cannot contain spaces'
                }
              })}
              error={!!formErrors.pass1}
              helperText={formErrors.pass1?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass1(!showPass1)} edge="end">
                      {showPass1 ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              onInput={(e) => { e.target.value = e.target.value.replace(/\s/g, ''); }}
            />
            {watchedEmail && getValues('pass1') && (
              <Box sx={{ mt: 1, textAlign: 'left' }}>
                <Box sx={{ height: 4, width: '100%', bgcolor: '#eee', borderRadius: 1 }}>
                  <Box sx={{ 
                    height: '100%', 
                    width: `${passwordStrength}%`, 
                    bgcolor: passwordStrength <= 25 ? '#f44336' : passwordStrength <= 75 ? '#ff9800' : '#4caf50',
                    transition: 'width 0.3s ease',
                    borderRadius: 1
                  }} />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Password strength: {passwordStrength <= 25 ? 'Weak' : passwordStrength <= 75 ? 'Fair' : 'Strong'}
                </Typography>
              </Box>
            )}

            <TextField
              label="Confirm Password"
              type={showPass2 ? 'text' : 'password'}
              fullWidth
              sx={{ mt: 2 }}
              {...register('pass2', { 
                required: 'Confirm your password',
                validate: v => v === watch('pass1') || 'Passwords do not match'
              })}
              error={!!formErrors.pass2}
              helperText={formErrors.pass2?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass2(!showPass2)} edge="end">
                      {showPass2 ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              onInput={(e) => { e.target.value = e.target.value.replace(/\s/g, ''); }}
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
                '&:hover': { bgcolor: '#d4ce1f' }
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign up with email'}
            </Button>
          </form>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <GoogleLoginButton />
          </Box>

          <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account?{' '}
            <Link href="/login" underline="hover" sx={{ fontWeight: 'bold' }}>
              Login Now
            </Link>
          </Typography>
        </Box>

        <OtpModal
          open={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          onVerify={handleOtpVerify}
          email={watchedEmail}
          onResend={handleResendOtp}
          resending={resending}
          purpose="signup"
          expiryTimestamp={expiryTimestamp}
        />
      </Container>
    </Box>
  );
}

export default Signup;