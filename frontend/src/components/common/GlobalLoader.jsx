import React from 'react';
import { Backdrop } from '@mui/material';
import { useSelector } from 'react-redux';
import Loader from './Loader';

const GlobalLoader = () => {
    const { isLoading } = useSelector((state) => state.loading);

    return (
        <Backdrop
            sx={{
                color: '#fff',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}
            open={isLoading}
        >
            <Loader message="Processing your request..." size={60} color="#f2b705" />
        </Backdrop>
    );
};

export default GlobalLoader;
