import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { Notifications, LocationOn, AccountCircle, Chat, Menu as MenuIcon } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import LogoutButton from '../common/Logout';
import { ShowToast } from '../common/Toast';
import { userService } from '../../services/apiServices';
import { setUser } from '../../redux/slices/authSlice';
import { fetchBookings } from '../../redux/slices/bookingSlice';
import { useEffect } from 'react';

const UserNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isProvider, user } = useSelector((state) => state.auth);
  const { bookings } = useSelector((state) => state.bookings);
  const dispatch = useDispatch();

  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = React.useState(null);
  const handleMobileMenuOpen = (event) => setMobileMenuAnchorEl(event.currentTarget);
  const handleMobileMenuClose = () => setMobileMenuAnchorEl(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchBookings());
    }
  }, [dispatch, user]);

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
    { label: "SUPPORT", path: "/support" },
  ];

  // Only show the CHAT option if there's at least one booking with an assigned provider
  const hasAssignedProvider = bookings.some(b => b.provider !== null);

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
            sx={{ display: { xs: 'flex', sm: 'block' } }}
          >
            HOME LIFT
          </Typography>
        </Box>

        {/* Right side container */}
        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
          {/* Desktop Nav links */}
          <Box display={{ xs: 'none', md: 'flex' }} gap={2} alignItems="center">
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
          </Box>

          {/* Icons (Always visible) */}
          <Box display="flex" gap={1} alignItems="center">
            <Tooltip title="Notifications">
              <IconButton
                component={Link}
                to="/notifications"
                sx={{ color: location.pathname === "/notifications" ? '#0066CC' : '#555' }}
              >
                <Notifications />
              </IconButton>
            </Tooltip>

            <Tooltip title="Chat">
              <IconButton
                component={Link}
                to="/chat"
                sx={{ color: location.pathname === "/chat" ? '#0066CC' : '#555' }}
              >
                <Chat />
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile">
              <IconButton
                component={Link}
                to="/profile"
                sx={{ color: location.pathname === "/profile" ? '#0066CC' : '#555' }}
              >
                <AccountCircle />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Provider Page Button (Desktop only) */}
          {isProvider && (
            <Tooltip title="Switch to Provider Dashboard">
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: '#0066CC',
                    textTransform: "none",
                    borderRadius: "10px",
                    "&:hover": { backgroundColor: "#0052a3" },
                    px: 2,
                    minWidth: '120px'
                  }}
                  onClick={handleProviderRedirect}
                >
                  Provider Page
                </Button>
              </Box>
            </Tooltip>
          )}

          {/* Mobile Menu Icon */}
          <Tooltip title="Navigation Menu">
            <IconButton 
              onClick={handleMobileMenuOpen} 
              color="inherit"
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>

          {/* Logout (Desktop only) */}
          <Tooltip title="Logout">
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <LogoutButton
                collapsed={false}
                sx={{
                  "&:hover": { backgroundColor: "red", color: "white" }
                }}
              />
            </Box>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchorEl}
        open={Boolean(mobileMenuAnchorEl)}
        onClose={handleMobileMenuClose}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {navLinks.map((item) => (
          <MenuItem 
            key={item.label} 
            component={Link} 
            to={item.path}
            onClick={handleMobileMenuClose}
            sx={{ 
              color: location.pathname === item.path ? '#0066CC' : 'inherit', 
              fontWeight: location.pathname === item.path ? 'bold' : 'normal' 
            }}
          >
            {item.label}
          </MenuItem>
        ))}
        {/* Add Provider Button to mobile menu */}
        {isProvider && (
          <MenuItem 
            onClick={() => {
              handleMobileMenuClose();
              handleProviderRedirect();
            }}
            sx={{ fontWeight: 'bold', color: '#0066CC' }}
          >
            Provider Page
          </MenuItem>
        )}
        
        {/* Add Logout Button to mobile menu */}
        <Box sx={{ px: 2, py: 1 }}>
          <LogoutButton
            collapsed={false}
            sx={{
              width: '100%',
              "&:hover": { backgroundColor: "red", color: "white" }
            }}
          />
        </Box>
      </Menu>
    </AppBar>
  );
};

export default UserNavbar;
