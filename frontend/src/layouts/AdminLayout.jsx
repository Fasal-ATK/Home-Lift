import { useState } from 'react';
import { Box } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false); // track sidebar state

  return (
    <Box sx={{ display: 'flex' }}>
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: '#f5f5f5',
          minHeight: '100vh',
          ml: collapsed ? '80px' : '240px', // dynamic margin
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
