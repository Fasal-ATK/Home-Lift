import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import UserNavbar from '../components/user/UserNavbar';

const UserLayout = () => {
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
