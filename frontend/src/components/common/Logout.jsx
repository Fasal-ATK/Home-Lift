// components/common/LogoutButton.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../../services/apiConfig';

const LogoutButton = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const access = localStorage.getItem('access'); 
      console.log(access);
      console.log('HELO')
      await axios.post(`${api}/admin/logout/`, null, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });
  
      // Clear local storage or any tokens
      localStorage.removeItem('access');
      localStorage.removeItem('refresh'); // if you stored it
  
      const isAdmin = location.pathname.startsWith('/admin');
      navigate(isAdmin ? '/admin/login' : '/login');
    } catch (err) {
      console.error('Logout failed:', err);
      console.log(err?.response?.data?.message || 'Unknown logout error');
    }
  };
  

  return (
    <Button
      variant="contained"
      color="error"
      fullWidth={!collapsed}
      sx={{
        borderRadius: '10px',
        py: 1.2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: collapsed ? 0 : 1,
        fontWeight: 'bold',
        fontSize: '15px',
      }}
      onClick={handleLogout}
    >
      <LogoutIcon />
      {!collapsed && 'Logout'}
    </Button>
  );
};

export default LogoutButton;
