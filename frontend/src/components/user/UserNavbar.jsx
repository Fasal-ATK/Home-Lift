// components/user/UserNavbar.jsx
import React from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Button
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const UserNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);

  const handleLogout = () => {
    localStorage.clear();
    dispatch({ type: 'auth/logout' });
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: 'white', borderBottom: '3px solid #f2b705' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo */}
        <Typography
          variant="h6"
          sx={{ fontWeight: 'bold', color: 'black', cursor: 'pointer' }}
          onClick={() => navigate('/home')}
        >
          HOME LIFT
        </Typography>

        {/* Nav Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="body2"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/home')}
          >
            Home
          </Typography>
          <Typography
            variant="body2"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/about')}
          >
            About
          </Typography>

          {isAuthenticated ? (
            <>
              <IconButton onClick={() => navigate('/notifications')} color="default">
                <NotificationsNoneIcon />
              </IconButton>
              <IconButton onClick={() => navigate('/profile')} color="default">
                <AccountCircleIcon />
              </IconButton>
              <Button
                variant="contained"
                size="small"
                onClick={handleLogout}
                sx={{ backgroundColor: 'black', color: 'white', px: 2, borderRadius: '8px' }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/login')}
                sx={{ borderColor: 'black', color: 'black' }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/signup')}
                sx={{ backgroundColor: 'black', color: 'white', px: 2 }}
              >
                Signup
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default UserNavbar;
