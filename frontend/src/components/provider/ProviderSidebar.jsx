// src/layouts/UserSidebar.jsx
import { useLocation, Link } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Dashboard,
  Description,
  CalendarMonth,
  History,
  Person,
  AccountBalanceWallet,
  Logout,
} from '@mui/icons-material';

export default function UserSidebar() {
  const location = useLocation();

  const navItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/user/dashboard' },
    { text: 'Requests', icon: <Description />, path: '/user/requests' },
    { text: 'Bookings', icon: <CalendarMonth />, path: '/user/bookings' },
    { text: 'History', icon: <History />, path: '/user/history' },
    { text: 'Profile', icon: <Person />, path: '/user/profile' },
    { text: 'Wallet', icon: <AccountBalanceWallet />, path: '/user/wallet' },
  ];

  return (
    <Box
      sx={{
        width: '90px',
        height: '100vh',
        backgroundColor: '#fff',
        borderRight: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 3,
      }}
    >
      {/* Brand */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        {/* Logo placeholder */}
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: '#ffeb3b',
            borderRadius: '8px',
            mb: 1,
          }}
        />
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 'bold', fontSize: '14px' }}
        >
          <span style={{ color: '#cddc39' }}>Home</span>{' '}
          <span style={{ color: '#000' }}>Lift</span>
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, width: '100%' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              component={Link}
              to={item.path}
              key={item.text}
              sx={{
                backgroundColor: isActive ? '#f4e04d' : 'transparent',
                borderRadius: '12px',
                mb: 1,
                py: 1.5,
                flexDirection: 'column',
                '&:hover': { backgroundColor: '#fff9c4' },
              }}
            >
              <ListItemIcon
                sx={{
                  color: '#000',
                  minWidth: 'unset',
                  mb: 0.5,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '10px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  textAlign: 'center',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Logout */}
      <ListItemButton
        sx={{
          backgroundColor: 'red',
          color: '#fff',
          borderRadius: '12px',
          py: 1.5,
          flexDirection: 'column',
          '&:hover': { backgroundColor: '#e53935' },
        }}
        onClick={() => {
          // hook your logout logic here
          localStorage.clear();
          window.location.href = '/';
        }}
      >
        <ListItemIcon
          sx={{ color: '#fff', minWidth: 'unset', mb: 0.5, justifyContent: 'center' }}
        >
          <Logout />
        </ListItemIcon>
        <ListItemText
          primary="Logout"
          primaryTypographyProps={{
            fontSize: '10px',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        />
      </ListItemButton>
    </Box>
  );
}
