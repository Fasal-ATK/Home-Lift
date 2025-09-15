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
import { Link } from 'react-router-dom'; // ✅ use react-router for navigation
import LogoutButton from '../common/Logout';

const UserNavbar = () => {
  return (
    <AppBar position="sticky" color="inherit" elevation={3} sx={{ borderRadius:'14px' }}  >
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
          {/* Text Links */}
          {["HOME", "SERVICES", "BOOKINGS"].map((item) => (
            <Typography
              key={item}
              component={Link}    // ✅ turn Typography into a link
              to="/#"
              variant="body1"
              fontWeight="bold"
              sx={{
                cursor: "pointer",   // ✅ pointer cursor
                textDecoration: "none",
                color: "inherit",
                "&:hover": { color: "#0066CC" }, // ✅ hover effect
              }}
            >
              {item}
            </Typography>
          ))}

          {/* Icons as Links */}
          <IconButton component={Link} to="/#" sx={{ cursor: "pointer" }}>
            <AccountCircle sx={{ color: '#0066CC' }} />
          </IconButton>

          <IconButton component={Link} to="/#" sx={{ cursor: "pointer" }}>
            <Notifications sx={{ color: '#0066CC' }} />
          </IconButton>

          <Box>
            <LogoutButton collapsed={false} color="blue" />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default UserNavbar;
