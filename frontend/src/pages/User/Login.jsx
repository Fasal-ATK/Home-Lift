import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography,Box, Alert, CircularProgress, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../API/api';

function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !pass) {
      setError('Email and password are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${api}/login/`, {
        email: email,
        password: pass
      },{TrustedOrigin: true});
      console.log(response.data);
      // store token logic here
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
      setLoading(false);
      console.error(err);
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
            User Login
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleLogin}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              sx={{ mt: 2 }}
              onChange={e => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              sx={{ mt: 2 }}
              onChange={e => setPass(e.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, bgcolor: '#e0dc25', color: 'black', fontWeight: 'bold', '&:hover': { bgcolor: '#d4ce1f' } }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 2 }}>
            Don’t have an account?{' '}
            <Link href="/signup" underline="hover" sx={{ fontWeight: 'bold' }}>
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Login;
