import React, { useEffect } from 'react';
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
  useTheme,
  Avatar,
  Badge,
} from '@mui/material';
import { Notifications, LocationOn, Chat, Menu as MenuIcon } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import LogoutButton from '../common/Logout';
import { ShowToast } from '../common/Toast';
import { userService } from '../../services/apiServices';
import { setUser } from '../../redux/slices/authSlice';
import { fetchBookings } from '../../redux/slices/bookingSlice';

const UserNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const { isProvider, user } = useSelector((state) => state.auth);
  const { bookings } = useSelector((state) => state.bookings);
  const { unreadCount: notificationsUnreadCount } = useSelector((state) => state.notifications);
  const { rooms } = useSelector((state) => state.chat);
  const dispatch = useDispatch();

  const chatUnreadCount = rooms?.reduce((acc, room) => acc + (room.unread_count || 0), 0) || 0;

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

  const hasAssignedProvider = bookings.some(b => b.provider !== null);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderRadius: { xs: 0, sm: '16px' },
        mt: { xs: 0, sm: 2 },
        mx: { xs: 0, sm: 2 },
        width: { xs: '100%', sm: 'calc(100% - 32px)' },
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 }, minHeight: '70px !important' }}>
        {/* Left: Logo and Title */}
        <Box display="flex" alignItems="center" gap={1.5} sx={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              background: "linear-gradient(135deg, #4f46e5, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(79,70,229,0.3)"
            }}
          >
            <LocationOn sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Typography
            variant="h6"
            fontWeight="900"
            color="#1e1b4b"
            sx={{ display: { xs: 'none', sm: 'block' }, letterSpacing: -0.5 }}
          >
            HOME<Box component="span" sx={{ color: '#4f46e5' }}>LIFT</Box>
          </Typography>
        </Box>

        {/* Right side container */}
        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
          {/* Desktop Nav links */}
          <Box display={{ xs: 'none', md: 'flex' }} gap={2} alignItems="center">
            {navLinks.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
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
                    color: isActive ? "#4f46e5" : "inherit",
                    "&:hover": { color: "#4f46e5" },
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
                sx={{
                  color: location.pathname === "/notifications" ? '#4f46e5' : '#64748b',
                  bgcolor: location.pathname === "/notifications" ? 'rgba(79,70,229,0.08)' : 'transparent',
                  "&:hover": { bgcolor: "rgba(79,70,229,0.04)" }
                }}
              >
                <Badge badgeContent={notificationsUnreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Chat">
              <IconButton
                component={Link}
                to="/chat"
                sx={{
                  color: location.pathname === "/chat" ? '#4f46e5' : '#64748b',
                  bgcolor: location.pathname === "/chat" ? 'rgba(79,70,229,0.08)' : 'transparent',
                  "&:hover": { bgcolor: "rgba(79,70,229,0.04)" }
                }}
              >
                <Badge badgeContent={chatUnreadCount} color="error">
                  <Chat />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile">
              <IconButton
                component={Link}
                to="/profile"
                sx={{
                  color: location.pathname === "/profile" ? '#4f46e5' : '#64748b',
                  bgcolor: location.pathname === "/profile" ? 'rgba(79,70,229,0.08)' : 'transparent',
                  "&:hover": { bgcolor: "rgba(79,70,229,0.04)" }
                }}
              >
                <Avatar
                  src={user?.profile_picture || undefined}
                  alt={user?.first_name || user?.username || 'Profile'}
                  sx={{ width: 32, height: 32, bgcolor: user?.profile_picture ? 'transparent' : '#4f46e5', fontSize: 14 }}
                >
                  {!user?.profile_picture && (user?.first_name ? user.first_name[0] : user?.username?.[0] || 'U')}
                </Avatar>
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
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    textTransform: "none",
                    borderRadius: 2.5,
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                    "&:hover": { background: "linear-gradient(135deg, #059669, #047857)" },
                    px: 3,
                  }}
                  onClick={handleProviderRedirect}
                >
                  Provider View
                </Button>
              </Box>
            </Tooltip>
          )}

          {/* Mobile Menu Icon */}
          <Tooltip title="Navigation Menu">
            <IconButton 
              onClick={handleMobileMenuOpen} 
              sx={{ display: { xs: 'flex', md: 'none' }, color: "#1e293b" }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>

          {/* Logout (Desktop only) */}
          <Tooltip title="Logout">
            <Box sx={{ display: { xs: 'none', md: 'block' }, ml: 1 }}>
              <LogoutButton
                collapsed={true} // Use collapsed version for icon only
                sx={{
                  color: "#ef4444",
                  bgcolor: "rgba(239,68,68,0.08)",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#ef4444", color: "white" }
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
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 200,
            borderRadius: 3,
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          }
        }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {navLinks.map((item) => (
          <MenuItem 
            key={item.label} 
            component={Link} 
            to={item.path}
            onClick={handleMobileMenuClose}
            sx={{ 
              color: location.pathname.startsWith(item.path) ? '#4f46e5' : '#475569', 
              fontWeight: location.pathname.startsWith(item.path) ? 800 : 600,
              py: 1.5,
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
            sx={{ fontWeight: 800, color: '#10b981', py: 1.5 }}
          >
            Provider View
          </MenuItem>
        )}
        
        {/* Add Logout Button to mobile menu */}
        <Box sx={{ px: 2, py: 1.5, mt: 1, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <LogoutButton
            collapsed={false}
            sx={{
              width: '100%',
              bgcolor: "rgba(239,68,68,0.08)",
              color: "#ef4444",
              fontWeight: 700,
              borderRadius: 2,
              "&:hover": { bgcolor: "#ef4444", color: "white" }
            }}
          />
        </Box>
      </Menu>
    </AppBar>
  );
};

export default UserNavbar;
