import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography,
  Box, Alert, CircularProgress, Grid, Checkbox,
  FormControlLabel, Link, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService, otpService } from '../../services/apiServices';

import OtpModal from '../../components/user/otp_modal';
import { validateSignupForm } from '../../utils/signupVal';
import { ShowToast } from '../../components/common/Toast';
import GoogleLoginButton from '../../components/user/GoogleLoginButton';

function Signup() {
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [uname, setUname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [error, setErrorState] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();

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
        if (first.message) return first.message;
        if (first.error) return first.error;
        // Recursively check nested object
        if (typeof first === "object") return extractErrorMessage(first);
      } else if (typeof val === "object") {
        return extractErrorMessage(val);
      }
    }
  }

  return "An unknown error occurred";
};


  // 🔹 Form submit: send OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorState('');
    setSuccess('');

    const validationError = validateSignupForm({
      fname, lname, uname, email, phone, pass1, pass2, agreed,
    });

    if (validationError) {
      setErrorState(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await otpService.sendOtp({ email });
      console.log('OTP response:', response.message);
      setShowOtpModal(true);
    } catch (err) {
      console.error("Send OTP error:", err.response?.data || err.message);
      setErrorState(extractErrorMessage(err.response?.data) || "Failed to send OTP");
    }
    setLoading(false);
  };

  // 🔹 Resend OTP
  const handleResendOtp = async () => {
    setResending(true);
    try {
      const response = await otpService.sendOtp({ email });
      console.log('Resent OTP:', response.message);
    } catch (err) {
      console.error("Resend OTP error:", err.response?.data || err.message);
      setErrorState(extractErrorMessage(err.response?.data) || "Failed to resend OTP");
    }
    setResending(false);
  };

  // 🔹 Verify OTP and register user
  const handleOtpVerify = async (otp) => {
    setErrorState('');
    try {
      console.log('Verifying OTP:', { email, otp });
      const otpResponse = await otpService.verifyOtp({ email, otp });
      console.log('OTP verified:', otpResponse.message);

      const userData = {
        first_name: fname,
        last_name: lname,
        username: uname,
        phone: `+91${phone}`,
        email,
        password: pass1,
      };

      const registerResponse = await authService.signup({ userData });
      console.log('Registration response:', registerResponse.message);

      setSuccess('Registration successful!');
      setShowOtpModal(false);
      ShowToast('Registration successful! Please log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      console.error('Error during OTP verification or registration:', error.response?.data || error.message);
      setErrorState(extractErrorMessage(error.response?.data) || 'Invalid OTP or Registration failed');
      setShowOtpModal(false);
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

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="First name"
                  fullWidth
                  onChange={e => setFname(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last name"
                  fullWidth
                  onChange={e => setLname(e.target.value)}
                />
              </Grid>
            </Grid>

            <TextField
              label="Username"
              fullWidth
              sx={{ mt: 2 }}
              onChange={e => setUname(e.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              sx={{ mt: 2 }}
              onChange={e => setEmail(e.target.value)}
            />
            <TextField
              label="Phone"
              type="tel"
              fullWidth
              sx={{ mt: 2 }}
              onChange={e => setPhone(e.target.value)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
            />

            <TextField
              label="Password"
              type={showPass1 ? 'text' : 'password'}
              fullWidth
              sx={{ mt: 2 }}
              onChange={e => setPass1(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass1(!showPass1)} edge="end">
                      {showPass1 ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label="Confirm Password"
              type={showPass2 ? 'text' : 'password'}
              fullWidth
              sx={{ mt: 2 }}
              onChange={e => setPass2(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass2(!showPass2)} edge="end">
                      {showPass2 ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <FormControlLabel
              control={<Checkbox checked={agreed} onChange={e => setAgreed(e.target.checked)} />}
              label={
                <Typography variant="body2">
                  By proceeding, you agree to the <Link href="#">Terms and Conditions</Link>
                </Typography>
              }
              sx={{ mt: 1, textAlign: 'left' }}
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
          email={email}
          onResend={handleResendOtp}
          resending={resending}
        />
      </Container>
    </Box>
  );
}

export default Signup;
