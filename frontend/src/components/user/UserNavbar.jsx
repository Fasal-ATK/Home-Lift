import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  InputBase,
  Paper,
} from '@mui/material';
import { Search, Notifications, LocationOn, AccountCircle } from '@mui/icons-material';
import LogoutButton from '../common/Logout'; // Update this path based on your folder structure

const UserNavbar = () => {
  return (
    <AppBar position="static" color="inherit" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between', px: 4 }}>

        {/* Left: Logo and Title */}
        <Box display="flex" alignItems="center" gap={1}>
          <LocationOn sx={{ color: '#0066CC' }} />
          <Typography variant="h6" fontWeight="bold" color="primary">
            HOME LIFT
          </Typography>
        </Box>

        {/* Center: Search Bar */}
        <Paper
          component="form"
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: 220,
            px: 1.5,
            py: 0.5,
            borderRadius: 5,
            border: '1px solid #ccc',
          }}
        >
          <InputBase
            placeholder="Search"
            inputProps={{ 'aria-label': 'search' }}
            sx={{ ml: 1, flex: 1 }}
          />
          <IconButton type="submit" sx={{ p: 0.5 }} aria-label="search">
            <Search sx={{ color: '#0066CC' }} />
          </IconButton>
        </Paper>

        {/* Right: Nav links, notification, profile, and logout */}
        <Box display="flex" alignItems="center" gap={4}>
          <Typography variant="body1" fontWeight="bold">
            HOME
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            SERVICES
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            BOOKINGS
          </Typography>
          <IconButton>
            <AccountCircle sx={{ color: '#0066CC' }} />
          </IconButton>
          <IconButton>
            <Notifications sx={{ color: '#0066CC' }} />
          </IconButton>
          <Box>
            <LogoutButton
              collapsed={false}
              color="blue"  // ✅ Set color dynamically
            />
          </Box>
        </Box>


      </Toolbar>
    </AppBar>
  );
};

export default UserNavbar;
