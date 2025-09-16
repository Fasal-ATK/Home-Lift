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

import { ShowToast } from '../../components/common/Toast'; 

function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({}); // field-level validation
  const [serverError, setServerError] = useState(''); // backend/global errors
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setServerError('');

    // ✅ Client-side validation
    const validationError = validateLoginForm({ email, password: pass });
    if (validationError) {
      setFieldErrors(validationError); // expect { email: "msg", password: "msg" }
      return;
    }

    setLoading(true);

    try {
      const data = { email, password: pass };
      const response = await authService.adminLogin(data);

      const { user, access_token } = response;
      dispatch(loginSuccess({ user, access_token }));
      ShowToast(`Welcome back, ${user?.name || 'User'}!`, "success");
      navigate('/admin/dashboard');

    } catch (err) {
      console.error(err);

      if (err.response) {
        // Backend validation might return dict { email: [...], password: [...], detail: ... }
        const backendData = err.response.data;

        if (typeof backendData === 'object') {
          // Field-specific errors
          if (backendData.email || backendData.password) {
            setFieldErrors({
              email: backendData.email?.[0] || '',
              password: backendData.password?.[0] || ''
            });
          }

          // General errors (like "Invalid credentials")
          setServerError(
            backendData.detail || backendData.message || 'Login failed. Try again.'
          );
        } else {
          setServerError('Invalid response from server.');
        }
      } else if (err.request) {
        setServerError('Unable to connect to the server. Please try again later.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
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

          {/* 🔴 Global Server Error */}
          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {serverError}
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
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
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
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
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
              User Login
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Login;
