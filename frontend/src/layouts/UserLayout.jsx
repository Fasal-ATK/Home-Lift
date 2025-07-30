// layouts/UserLayout.jsx
import { Box } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import UserNavbar from '../components/user/UserNavbar';

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useSelector(state => state.auth);

  // Define protected user routes
  const protectedPaths = ['/profile', '/bookings', '/notifications'];

  useEffect(() => {
    const isProtected = protectedPaths.includes(location.pathname);
    if (!isAuthenticated && isProtected) {
      navigate('/login');
    } else if (isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, isAdmin, location.pathname, navigate]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <UserNavbar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default UserLayout;
