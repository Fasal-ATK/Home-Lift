import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UserNavbar from '../components/user/UserNavbar';
import Footer from '../components/user/Footer';

const UserLayout = () => {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, bgcolor: 'white', minHeight: '100vh' }}
      >
        <UserNavbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ width: "100%" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
        <Footer />
      </Box>
    </Box>
  );
};

export default UserLayout;