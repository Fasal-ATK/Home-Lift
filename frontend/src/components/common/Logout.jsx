import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Slide } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { performLogout } from '../../utils/logoutHelper';
import { ShowToast } from '../common/Toast'; // ✅ import toast

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

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const LogoutButton = ({ collapsed, color = 'red' }) => {
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await performLogout();
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

      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setOpen(false)}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        PaperProps={{
          sx: { borderRadius: 3, px: 2, py: 1, minWidth: 300 },
        }}
      >
        <DialogTitle id="logout-dialog-title" sx={{ fontWeight: 'bold', fontSize: 20 }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" id="logout-dialog-description" sx={{ mt: 1 }}>
            Are you sure you want to logout?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#1976D2', fontWeight: 'bold' }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            variant="contained"
            sx={{
              backgroundColor,
              '&:hover': { backgroundColor: hoverColor },
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LogoutButton;
