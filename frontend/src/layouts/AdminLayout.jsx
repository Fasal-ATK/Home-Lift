import { Box } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
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
