import React, { useState } from 'react';
import axios from 'axios';
import {
  Container, TextField, Button, Typography,
  Box, Alert, CircularProgress, Grid, Checkbox, FormControlLabel, Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../API/api';
import OtpModal from '../../components/otp_modal';

function Signup() {
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [uname, setUname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [error, setErrorState] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorState('');
    setSuccess('');

    if (!fname || !uname || !email || !pass1 || !pass2) {
      setErrorState('Enter the required fields');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(uname)) {
      setErrorState('Username can only contain letters, numbers, and underscores');
      return;
    }
    if (!/^[a-zA-Z]+$/.test(fname) || !/^[a-zA-Z]+$/.test(lname)) {
      setErrorState('First and Last names can only contain letters');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorState('Enter a valid email');
      return;
    }
    if (pass1 !== pass2) {
      setErrorState('Passwords do not match');
      return;
    }
    if (pass1.length < 6) {
      setErrorState('Password must be at least 6 characters');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setErrorState('Enter a valid 10-digit phone number');
      return;
    }
    if (!agreed) {
      setErrorState('You must agree to the Terms and Conditions');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${api}/send-otp/`, { email });
      setOtpSent(true);
      setShowOtpModal(true);
    } catch (err) {
      setErrorState('Failed to send OTP');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await axios.post(`${api}/send-otp/`, { email });
    } catch {
      setErrorState('Failed to resend OTP');
    }
    setResending(false);
  };

  const handleOtpVerify = async (otp) => {
    setErrorState('');
    try {
      await axios.post(`${api}/verify-otp/`, { email, otp });
      await axios.post(`${api}/register/`, {
        first_name: fname,
        last_name: lname,
        username: uname,
        phone: `+91${phone}`,
        email,
        password: pass1,
      });
      setSuccess('Registration successful!');
      setShowOtpModal(false);
      setTimeout(() => navigate('/login'), 1500);
    } catch {
      setErrorState('Invalid OTP or Registration failed');
      setShowOtpModal(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#d9e021', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="sm" sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: -4 }}>
          <img src="/logo.png" alt="logo" style={{ height: 80, backgroundColor: 'white', borderRadius: '50%', padding: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        </Box>

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
              <Grid item xs={12} sm={6}>
                <TextField label="First name" fullWidth onChange={e => setFname(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Last name" fullWidth onChange={e => setLname(e.target.value)} />
              </Grid>
            </Grid>

            <TextField label="Username" fullWidth sx={{ mt: 2 }} onChange={e => setUname(e.target.value)} />
            <TextField label="Email" type="email" fullWidth sx={{ mt: 2 }} onChange={e => setEmail(e.target.value)} />
            <TextField label="Phone" type="tel" fullWidth sx={{ mt: 2 }} onChange={e => setPhone(e.target.value)} />
            <TextField label="Password" type="password" fullWidth sx={{ mt: 2 }} onChange={e => setPass1(e.target.value)} />
            <TextField label="Confirm Password" type="password" fullWidth sx={{ mt: 2 }} onChange={e => setPass2(e.target.value)} />

            <FormControlLabel
              control={<Checkbox checked={agreed} onChange={e => setAgreed(e.target.checked)} />}
              label={<Typography variant="body2">By proceeding, you agree to the <Link href="#">Terms and Conditions</Link></Typography>}
              sx={{ mt: 1, textAlign: 'left' }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, bgcolor: '#e0dc25', color: 'black', fontWeight: 'bold', '&:hover': { bgcolor: '#d4ce1f' } }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign up with email'}
            </Button>
          </form>

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
