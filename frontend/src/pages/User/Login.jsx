import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography, Box, Alert, CircularProgress, Link, IconButton, InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../services/apiConfig';
import validateLoginForm from '../../utils/loginVal';

// import logo from '../../assets/user/app_logo.png';


function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const response = await axios.post(`${api}/user/login/`, {
        email: email,
        password: pass
      }, {
        withCredentials: true,
      });
  
      console.log(response.data);
      navigate('/home');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError('Invalid email or password');
      } else {
        setError('Login failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  

  const togglePasswordVisibility = () => {
    setShowPass(prev => !prev);
  };

  return (
    <Box sx={{ bgcolor: '#d9e021', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="sm" sx={{ position: 'relative' }}>
        {/* <Box sx={{ display: 'flex', justifyContent: 'center', mb: -4 }}>
        <img
          src={logo}
          alt="logo"
          style={{
            height: 64,
            objectFit: 'contain',
            backgroundColor: 'transparent',
            padding: 4
          }}
        />

        </Box> */}

        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: 4,
            boxShadow: 4,
            px: 4,
            pt: 8,
            pb: 5,
            textAlign: 'center'
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
              type={showPass ? 'text' : 'password'}
              fullWidth
              sx={{ mt: 2 }}
              onChange={e => setPass(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPass ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
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
