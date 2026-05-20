// src/layouts/AdminSidebar.jsx
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Tooltip, Paper } from '@mui/material';
import { Dashboard, Group, Category, Report, LocalOffer, BookOnline, PeopleAltOutlined, ChevronLeft, ChevronRight, SupportAgent, AccountBalanceWallet } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import LogoutButton from '../common/Logout';

const AdminSidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();

  const navItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'Service & Categories', icon: <Category />, path: '/admin/services' },
    { text: 'Employees', icon: <PeopleAltOutlined />, path: '/admin/employees' },
    { text: 'Users', icon: <Group />, path: '/admin/users' },
    { text: 'Offers', icon: <LocalOffer />, path: '/admin/offers' },
    { text: 'Bookings', icon: <BookOnline />, path: '/admin/bookings' },
    { text: 'Withdrawals', icon: <AccountBalanceWallet />, path: '/admin/withdrawals' },
    { text: 'Reports', icon: <Report />, path: '/admin/reports' },
  ];

  return (
    <Box
      sx={{
        width: collapsed ? '85px' : '230px',
        position: "fixed",
        top: 0,
        left: 0,
        height: '100vh',
        backgroundColor: '#fff',
        borderRight: '1px solid #ddd',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        transition: 'width 0.3s ease-in-out',
        zIndex: 1200,
      }}
    >
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
              fontSize: collapsed ? '28px' : '24px',
              color: 'orange',
              transition: '0.3s',
              whiteSpace: 'nowrap',
            }}
          >
            {collapsed ? (
              <>H<span style={{ color: 'black' }}>L</span></>
            ) : (
              <>Home<span style={{ color: 'black' }}>Lift</span></>
            )}
          </Typography>
        </Box>

        <Divider />

        {/* Navigation Items */}
        <List sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#ccc", borderRadius: "4px" }
        }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip title={collapsed ? item.text : ''} placement="right" key={item.text}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    backgroundColor: isActive ? '#FFC107' : 'transparent',
                    borderRadius: '8px',
                    mb: 2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    '&:hover': { backgroundColor: '#ffe082' },
                    transition: 'all 0.3s',
                  }}
                >
                  <ListItemIcon
                    sx={{ 
                      color: isActive ? 'black' : '#333', 
                      minWidth: 'unset', 
                      mr: collapsed ? 0 : 2,
                      transform: collapsed ? 'scale(1.3)' : 'scale(1.1)',
                      transition: 'transform 0.3s ease-in-out'
                    }}
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

        {/* Logout Button */}
        <Box sx={{ mt: 2, mb: 1 }}>
          <LogoutButton collapsed={collapsed} />
        </Box>

      {/* Collapse Toggle Button */}
      <Tooltip title={collapsed ? "Expand" : "Collapse"} placement="right">
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
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
      </Tooltip>
    </Box>
  );
};

export default AdminSidebar;
