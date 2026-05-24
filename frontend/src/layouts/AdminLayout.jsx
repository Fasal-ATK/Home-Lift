import { useState } from 'react';
import { Box } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false); // track sidebar state
  const location = useLocation();

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
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ width: "100%", height: "100%" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default AdminLayout;
