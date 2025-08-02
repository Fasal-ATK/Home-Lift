// layouts/UserLayout.jsx
import { Box } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import UserNavbar from '../components/user/UserNavbar';

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useSelector((state) => state.auth);

  useEffect(() => {
    // Block access if not logged in
    if (!isAuthenticated) {
      navigate('/login');
    }

    // Optionally block admin from accessing user routes
    if (isAdmin) {
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
