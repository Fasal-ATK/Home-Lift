import React from 'react';
import { useSelector } from 'react-redux';
import { Backdrop, Box, Typography, CircularProgress } from '@mui/material';

const LoadingOverlay = () => {
    const { isLoading } = useSelector((state) => state.loading);

    if (!isLoading) return null;

    return (
        <Backdrop
            open={true}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1000,
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 1)', // White background for premium look
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                }}
            >
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                        size={70}
                        thickness={4}
                        sx={{
                            color: '#f2b705', // Theme yellow
                            '& .MuiCircularProgress-circle': {
                                strokeLinecap: 'round',
                            }
                        }}
                    />
                    <Box
                        sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="caption" component="div" color="text.secondary" fontWeight="bold">
                            HL
                        </Typography>
                    </Box>
                </Box>

                <Typography
                    variant="h6"
                    sx={{
                        color: 'black',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontSize: '0.9rem'
                    }}
                >
                    Home Lift
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        animation: 'blink 1.5s infinite',
                        '@keyframes blink': {
                            '0%': { opacity: 0.2 },
                            '50%': { opacity: 1 },
                            '100%': { opacity: 0.2 },
                        },
                    }}
                >
                    Please wait while we process...
                </Typography>
            </Box>
        </Backdrop>
    );
};

export default LoadingOverlay;
