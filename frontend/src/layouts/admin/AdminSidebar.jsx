// src/layouts/AdminSidebar.jsx
import { Box, List, ListItem, ListItemIcon, ListItemText, Button } from '@mui/material';
import { Dashboard, Group, Category, Logout } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();

  const navItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dash' },
    { text: 'Users', icon: <Group />, path: '/admin/users' },
    { text: 'Employees', icon: <Group />, path: '/admin/employees' },
    { text: 'Service & Categories', icon: <Category />, path: '/admin/services' },
    { text: 'Reports', icon: <Report />, path: '/admin/reports' },
    { text: 'Coupons', icon: <Coupon />, path: '/admin/coupons' },
    { text: 'Bookings', icon: <Booking />, path: '/admin/bookings' },
  ];

  return (
    <Box
      sx={{
        width: '240px',
        height: '100vh',
        backgroundColor: '#fff',
        borderRight: '1px solid #ddd',
        p: 2,
      }}
    >
      <Box sx={{ mb: 4, fontSize: '24px', fontWeight: 'bold', color: 'orange' }}>
        Home<span style={{ color: 'black' }}>Lift</span>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            sx={{
              backgroundColor: location.pathname === item.path ? '#FFC107' : 'transparent',
              borderRadius: '8px',
              mb: 1,
              '&:hover': { backgroundColor: '#ffe082' }
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Button
        variant="contained"
        color="error"
        fullWidth
        sx={{ mt: 4 }}
        onClick={() => {
          // Clear tokens or do logout logic
        }}
      >
        Logout
      </Button>
    </Box>
  );
};

export default AdminSidebar;
