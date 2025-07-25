// src/pages/auth/Signup.jsx
import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography, Box, Alert, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService, otpService } from '../../services/apiServices';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOtp = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await otpService.sendOtp({ email: formData.email });
      setOtpSent(true);
      setSuccessMsg('OTP sent to your email.');
    } catch (error) {
      setErrorMsg(error.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setErrorMsg('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      await otpService.verifyOtp({ email: formData.email, otp });
      await authService.signup(formData);
      setSuccessMsg('Signup successful!');
      navigate('/login');
    } catch (error) {
      setErrorMsg(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={6} p={4} boxShadow={3} borderRadius={2}>
        <Typography variant="h5" gutterBottom>
          Signup
        </Typography>

        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        <TextField
          fullWidth label="Email" name="email" margin="normal"
          value={formData.email} onChange={handleChange}
        />
        <TextField
          fullWidth label="Password" type="password" name="password" margin="normal"
          value={formData.password} onChange={handleChange}
        />
        <TextField
          fullWidth label="Confirm Password" type="password" name="confirmPassword" margin="normal"
          value={formData.confirmPassword} onChange={handleChange}
        />

        {!otpSent ? (
          <Button
            variant="contained" color="primary" fullWidth
            onClick={handleSendOtp} disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Send OTP'}
          </Button>
        ) : (
          <>
            <TextField
              fullWidth label="Enter OTP" margin="normal"
              value={otp} onChange={(e) => setOtp(e.target.value)}
            />
            <Button
              variant="contained" color="success" fullWidth
              onClick={handleSignup} disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify & Signup'}
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
};

export default Signup;
