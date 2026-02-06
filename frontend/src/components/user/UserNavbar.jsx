import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
} from '@mui/material';
import { Notifications, LocationOn, AccountCircle } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import LogoutButton from '../common/Logout';
import { ShowToast } from '../common/Toast';
import { userService } from '../../services/apiServices';
import { setUser } from '../../redux/slices/authSlice';

const UserNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isProvider, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleProviderRedirect = async () => {
    try {
      const latestUser = await userService.fetchProfile();
      dispatch(setUser(latestUser));

      if (latestUser.is_provider_active === false) {
        ShowToast("Access Denied: Your provider account has been blocked.", "error");
      } else {
        navigate("/provider/dashboard");
      }
    } catch (error) {
      console.error("Failed to check provider status:", error);
      if (user?.is_provider_active === false) {
        ShowToast("Access Denied: Your provider account is currently blocked.", "error");
      } else {
        navigate("/provider/dashboard");
      }
    }
  };

  const navLinks = [
    { label: "HOME", path: "/home" },
    { label: "SERVICES", path: "/services" },
    { label: "BOOKINGS", path: "/bookings" },
    { label: "WALLET", path: "/wallet" },
  ];

  return (
    <AppBar position="sticky" color="inherit" elevation={3} sx={{ borderRadius: '14px' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: 4 }}>
        {/* Left: Logo and Title */}
        <Box display="flex" alignItems="center" gap={1}>
          <LocationOn sx={{ color: location.pathname === "/home" ? '#0066CC' : '#555' }} />
          <Typography
            variant="h6"
            fontWeight="bold"
            color={location.pathname === "/home" ? "primary" : "inherit"}
          >
            HOME LIFT
          </Typography>
        </Box>

        {/* Provider Page Button */}
        {isProvider && (
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#0066CC',
              textTransform: "none",
              borderRadius: "10px",
              "&:hover": { backgroundColor: "#0052a3" }
            }}
            onClick={handleProviderRedirect}
          >
            Provider Page
          </Button>
        )}

        {/* Right: Nav links, icons, logout */}
        <Box display="flex" alignItems="center" gap={2}>
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Typography
                key={item.label}
                component={Link}
                to={item.path}
                variant="body1"
                fontWeight="bold"
                sx={{
                  cursor: "pointer",
                  textDecoration: "none",
                  color: isActive ? "#0066CC" : "inherit",
                  "&:hover": { color: "#0066CC" },
                }}
              >
                {item.label}
              </Typography>
            );
          })}

          <IconButton
            component={Link}
            to="/notifications"
            sx={{
              color: location.pathname === "/notifications" ? '#0066CC' : '#555'
            }}
          >
            <Notifications />
          </IconButton>

          <IconButton
            component={Link}
            to="/profile"
            sx={{
              color: location.pathname === "/profile" ? '#0066CC' : '#555'
            }}
          >
            <AccountCircle />
          </IconButton>

          <LogoutButton
            collapsed={false}
            sx={{
              "&:hover": { backgroundColor: "red", color: "white" }
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default UserNavbar;
