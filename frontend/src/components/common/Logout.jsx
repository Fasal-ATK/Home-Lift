// src/components/common/LogoutButton.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { authService } from '../../services/apiServices';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const LogoutButton = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await authService.logout(); // Use modular API call

      // Clear Redux and LocalStorage
      dispatch(logout());

      // Redirect based on path
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
