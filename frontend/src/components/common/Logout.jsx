import React, { useState } from 'react';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { performLogout } from '../../utils/logoutHelper';
import { ShowToast } from '../common/Toast';
import ConfirmModal from './Confirm';

const colorPresets = {
  red: {
    backgroundColor: '#D32F2F',
    hoverColor: '#b71c1c',
  },
  blue: {
    backgroundColor: '#0066CC',
    hoverColor: '#004c99',
  },
  green: {
    backgroundColor: '#2e7d32',
    hoverColor: '#1b5e20',
  },
};

const LogoutButton = ({ collapsed, color = 'red' }) => {
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await performLogout(true);
      ShowToast('Logged out successfully', 'success');
    } catch (error) {
      console.error(error);
      ShowToast('Logout failed. Try again.', 'error');
    }
  };

  const { backgroundColor, hoverColor } = colorPresets[color] || colorPresets.red;

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        sx={{
          backgroundColor,
          '&:hover': { backgroundColor: hoverColor },
          textTransform: 'none',
          borderRadius: 3,
          px: 2,
          py: 1,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: collapsed ? 0 : 1,
          fontSize: '15px',
        }}
      >
        <LogoutIcon />
        {!collapsed && 'Logout'}
      </Button>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        color="danger"
      />
    </>
  );
};

export default LogoutButton;
