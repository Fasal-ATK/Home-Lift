import { useState } from 'react';
import { Box } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false); // track sidebar state

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: collapsed ? '80px' : '230px' },
          width: {
            xs: '100%',
            md: collapsed ? 'calc(100% - 80px)' : 'calc(100% - 230px)',
          },
          p: { xs: 2, md: 3 },
          transition: 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out',
          boxSizing: 'border-box',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
