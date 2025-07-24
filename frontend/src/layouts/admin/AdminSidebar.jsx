// src/layouts/AdminSidebar.jsx
import { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Button, IconButton, Typography, Divider, Tooltip, Paper,
}  from '@mui/material';
import { Dashboard, Group, Category, Report, LocalOffer, BookOnline, Logout as LogoutIcon, PeopleAltOutlined, ChevronLeft, ChevronRight,
} from '@mui/icons-material';
import { Link, useLocation,  } from 'react-router-dom';
// import axios from 'axios';
// import api from '../../API/api';

const AdminSidebar = () => {
  const location = useLocation();
  // const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dash' },
    { text: 'Service & Categories', icon: <Category />, path: '/admin/services' },
    { text: 'Employees', icon: <PeopleAltOutlined />, path: '/admin/employees' },
    { text: 'Users', icon: <Group />, path: '/admin/users' },
    { text: 'Report', icon: <Report />, path: '/admin/reports' },
    { text: 'Coupons', icon: <LocalOffer />, path: '/admin/coupons' },
    { text: 'Bookings', icon: <BookOnline />, path: '/admin/bookings' },
    { text: 'Logout', icon: <LogoutIcon />, path: '/admin/logout' },
  ];

  // const handleLogout = async () => {
  //   try {
  //     await axios.post(`${api}/admin/logout/`, {}, { withCredentials: true });
  //   } catch (err) {
  //     console.error('Logout failed:', err);
  //     console.log(err.response.data.message);
  //   }
  // };

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
        {/* Stylish Header */}
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

        {/* Nav Items */}
        <List>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip
                title={collapsed ? item.text : ''}
                placement="right"
                key={item.text}
              >
                <ListItem
                  button
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
                </ListItem>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* Logout Button */}
      {/* <Box sx={{ mb: 2 }}> 
        <Button
          variant="contained"
          color="error"
          fullWidth={!collapsed}
          sx={{
            mt: 3,
            borderRadius: '10px',
            py: 1.2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: collapsed ? 0 : 1,
            fontWeight: 'bold',
            fontSize: '15px',
          }}
          onClick={handleLogout}
        >
          <LogoutIcon />
          {!collapsed && 'Logout'}
        </Button>
      </Box> */}

      {/* Floating Collapse Button */}
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
