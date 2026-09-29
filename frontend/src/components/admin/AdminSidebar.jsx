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
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.03)',
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
          mb: 2.5,
          mt: 0.5,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            fontSize: collapsed ? '24px' : '22px',
            color: '#1e1b4b',
            letterSpacing: -0.5,
            transition: '0.3s',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? (
            <>H<span style={{ color: '#4f46e5' }}>L</span></>
          ) : (
            <>HOME<span style={{ color: '#4f46e5' }}>LIFT</span></>
          )}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2, borderColor: 'rgba(226, 232, 240, 0.8)' }} />

      {/* Navigation Items */}
      <List sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        px: 0.5,
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#cbd5e1", borderRadius: "4px" }
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip title={collapsed ? item.text : ''} placement="right" key={item.text}>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  backgroundColor: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                  color: isActive ? '#4f46e5' : '#475569',
                  borderRadius: '12px',
                  mb: 1,
                  py: 1.2,
                  px: collapsed ? 1.5 : 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(79, 70, 229, 0.14)' : 'rgba(79, 70, 229, 0.05)',
                    color: '#4f46e5',
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ListItemIcon
                  sx={{ 
                    color: isActive ? '#4f46e5' : '#64748b', 
                    minWidth: 'unset', 
                    mr: collapsed ? 0 : 1.75,
                    transform: collapsed ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s ease-in-out, color 0.2s ease-in-out'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '0.9rem',
                      letterSpacing: '0.01em',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* Logout Button */}
      <Box sx={{ mt: 1, mb: 1, px: 0.5 }}>
        <LogoutButton collapsed={collapsed} />
      </Box>

      {/* Collapse Toggle Button */}
      <Tooltip title={collapsed ? "Expand" : "Collapse"} placement="right">
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: -14,
            zIndex: 10,
            width: '28px',
            height: '42px',
            borderRadius: '0 8px 8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderLeft: 'none',
            cursor: 'pointer',
            color: '#4f46e5',
            '&:hover': {
              backgroundColor: '#f8fafc',
            },
          }}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
        </Paper>
      </Tooltip>
    </Box>
  );
};

export default AdminSidebar;
