import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const Loader = ({ message = 'Loading...', size = 50, color = '#f2b705', thickness = 4, sx = {} }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                py: 4,
                ...sx,
            }}
        >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                    size={size}
                    thickness={thickness}
                    sx={{
                        color: color,
                        '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round',
                        },
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
                    <Typography
                        variant="caption"
                        component="div"
                        sx={{
                            fontSize: size * 0.25,
                            fontWeight: 'bold',
                            color: 'text.secondary'
                        }}
                    >
                        HL
                    </Typography>
                </Box>
            </Box>
            {message && (
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 500,
                        color: 'text.secondary',
                        letterSpacing: '0.5px',
                        animation: 'pulse 1.5s infinite ease-in-out',
                        '@keyframes pulse': {
                            '0%, 100%': { opacity: 0.6 },
                            '50%': { opacity: 1 },
                        },
                    }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );
};

export default Loader;
