import { Box } from '@mui/material';
import ProviderSidebar from '../components/provider/ProviderSidebar';
import { Outlet } from 'react-router-dom';

const ProviderLayout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <ProviderSidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default ProviderLayout;
