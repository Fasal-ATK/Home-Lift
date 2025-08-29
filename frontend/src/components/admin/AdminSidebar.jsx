// src/layouts/AdminSidebar.jsx
import { useState, useEffect } from 'react';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Tooltip, Paper
} from '@mui/material';
import {
  Dashboard, Group, Category, Report, LocalOffer,
  BookOnline, PeopleAltOutlined, ChevronLeft, ChevronRight
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import LogoutButton from '../common/Logout';

const AdminSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'Service & Categories', icon: <Category />, path: '/admin/services' },
    { text: 'Employees', icon: <PeopleAltOutlined />, path: '/admin/employees' },
    { text: 'Users', icon: <Group />, path: '/admin/users' },
    { text: 'Report', icon: <Report />, path: '/admin/reports' },
    { text: 'Coupons', icon: <LocalOffer />, path: '/admin/coupons' },
    { text: 'Bookings', icon: <BookOnline />, path: '/admin/bookings' },
  ];

  return (
    <Box
      sx={{
        width: collapsed ? '80px' : '240px',
        height: '100vh',
        backgroundColor: '#fff',
        borderRight: '1px solid #ddd',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.3s ease-in-out',
        position: 'relative',
      }}
    >
      <Box>
        {/* Brand */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              fontSize: collapsed ? '0' : '24px',
              color: 'orange',
              transition: '0.3s',
              whiteSpace: 'nowrap',
            }}
          >
            Home<span style={{ color: 'black' }}>Lift</span>
          </Typography>
        </Box>

        <Divider />

        {/* Navigation Items */}
        <List>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip
                title={collapsed ? item.text : ''}
                placement="right"
                key={item.text}
              >
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    backgroundColor: isActive ? '#FFC107' : 'transparent',
                    borderRadius: '8px',
                    mb: 1,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    '&:hover': { backgroundColor: '#ffe082' },
                  }}
                >
                  <ListItemIcon
                    sx={{ color: isActive ? 'black' : '#333', minWidth: 'unset', mr: collapsed ? 0 : 2 }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontWeight: isActive ? 'bold' : 'normal' }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>

        {/* ✅ Logout Button */}
        <Box sx={{ mt: 2 }}>
          <LogoutButton collapsed={collapsed} />
        </Box>
      </Box>

      {/* Collapse Toggle Button */}
      <Paper
        elevation={4}
        sx={{
          position: 'absolute',
          top: windowHeight / 2 - 24,
          right: -16,
          zIndex: 10,
          width: '32px',
          height: '48px',
          borderRadius: '0 8px 8px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed((prev) => !prev)}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </Paper>
    </Box>
  );
};

export default AdminSidebar;
