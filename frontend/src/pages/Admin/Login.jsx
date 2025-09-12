import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography, Box, Alert, CircularProgress,
  Link, IconButton, InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { authService } from '../../services/apiServices';
import { loginSuccess } from '../../redux/slices/authSlice';
import validateLoginForm from '../../utils/loginVal';

function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

const handleLogin = async (e) => {
  e.preventDefault();
  setError('');

  const validationError = validateLoginForm({ email, password: pass });
  if (validationError) {
    setError(validationError);
    return;
  }

  setLoading(true);

  try {
    const data = { email, password: pass };
    const response = await authService.adminLogin(data); // Admin login API
    const { user, access_token } = response;

    dispatch(loginSuccess({ user, access_token }));
    navigate('/admin/dashboard');

  } catch (err) {
    console.error(err);

    // Backend responded with an error
    if (err.response) {
      const backendMessage = err.response.data?.message || err.response.data?.detail;
      // Use backend message if available; fallback to default
      setError(backendMessage || 'Invalid email or password');
    } 
    // No response = network/server issue
    else if (err.request) {
      setError('Unable to connect to the server. Please try again later.');
    } 
    // Unknown error
    else {
      setError('An unexpected error occurred. Please try again.');
    }

  } finally {
    setLoading(false);
  }
};


  const togglePasswordVisibility = () => {
    setShowPass((prev) => !prev);
  };

  return (
    <Box sx={{ bgcolor: 'black', minHeight: '90vh', py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: '#121212',
            borderRadius: 4,
            boxShadow: 6,
            px: 4,
            pt: 8,
            pb: 5,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Admin Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              sx={{
                mt: 2,
                '& .MuiInputLabel-root': { color: '#ccc' },
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#ccc' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: 'white' },
                },
              }}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type={showPass ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              sx={{
                mt: 2,
                '& .MuiInputLabel-root': { color: '#ccc' },
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#ccc' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: 'white' },
                },
              }}
              onChange={(e) => setPass(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end" sx={{ color: '#aaa' }}>
                      {showPass ? <Visibility /> : <VisibilityOff />}
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
                bgcolor: 'white',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#e0e0e0' },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 2, color: '#ccc' }}>
            Back to the Previous page{' '}
            <Link href="/" underline="hover" sx={{ fontWeight: 'bold', color: '#fff' }}>
              Landing Page
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Login;
