import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import UserNavbar from '../components/user/UserNavbar';
import LoadingOverlay from '../components/common/LoadingOverlay';
import Footer from '../components/user/Footer';

const UserLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, bgcolor: 'white', minHeight: '100vh' }}
      >
        <UserNavbar />
        <LoadingOverlay />
        <Outlet />
        <Footer />
      </Box>
    </Box>
  );
};

export default UserLayout;