import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { authService } from '../../services/apiServices';

const LogoutButton = ({ collapsed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAdmin = useSelector((state) => state.auth.isAdmin);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
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
