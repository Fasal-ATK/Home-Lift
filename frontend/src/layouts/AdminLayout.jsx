import { Box } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const AdminLayout = () => {
  const navigate = useNavigate();

  const { isAuthenticated, isAdmin } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login'); 
    } else if (!isAdmin) {
      navigate('/user/home'); 
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <Box sx={{ display: 'flex' }}>
      <AdminSidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
