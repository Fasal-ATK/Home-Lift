import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  InputBase,
  Paper,
  Button,
} from '@mui/material';
import { Search, Notifications, LocationOn, AccountCircle } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LogoutButton from '../common/Logout';

const UserNavbar = () => {
  const navigate = useNavigate();

  // ✅ Get provider info from authSlice
  const { isProvider } = useSelector((state) => state.auth);
  const navLinks = [
  { label: "HOME", path: "/home" },
  { label: "SERVICES", path: "/services" },
  { label: "BOOKINGS", path: "/bookings" },
];

  return (
    <AppBar position="sticky" color="inherit" elevation={3} sx={{ borderRadius: '14px' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: 4 }}>

        {/* Left: Logo and Title */}
        <Box display="flex" alignItems="center" gap={1}>
          <LocationOn sx={{ color: '#0066CC' }} />
          <Typography variant="h6" fontWeight="bold" color="primary">
            HOME LIFT
          </Typography>
        </Box>
                  {/* Provider Page Button */}
          {isProvider && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => navigate("/provider/dashboard")}
              sx={{ textTransform: "none", borderRadius: "10px" }}
            >
              Provider Page
            </Button>
          )}

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

        {/* Right: Nav links, notification, profile, logout, provider page */}
        <Box display="flex" alignItems="center" gap={2}>

          {/* Text Links */}
          {navLinks.map((item) => (
            <Typography
              key={item.label}
              component={Link}
              to={item.path}
              variant="body1"
              fontWeight="bold"
              sx={{
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
                "&:hover": { color: "#0066CC" },
              }}
            >
              {item.label}
            </Typography>
          ))}

          {/* Icons */}
          <IconButton component={Link} to="profile" sx={{ cursor: "pointer" }}>
            <AccountCircle sx={{ color: '#0066CC' }} />
          </IconButton>

          <IconButton component={Link} to="/#" sx={{ cursor: "pointer" }}>
            <Notifications sx={{ color: '#0066CC' }} />
          </IconButton>

          <LogoutButton collapsed={false} color="blue" />

        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default UserNavbar;
