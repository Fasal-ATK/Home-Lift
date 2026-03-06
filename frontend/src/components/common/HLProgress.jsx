import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

/**
 * Reusable Home Lift branding loader for component-level loading.
 * Provides a professional, non-blocking alternative to the global backdrop.
 */
const HLProgress = ({
    message = null,
    size = 60,
    thickness = 4,
    sx = {}
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                py: 4,
                width: '100%',
                ...sx,
            }}
        >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                    size={size}
                    thickness={thickness}
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
                    <Typography
                        variant="caption"
                        component="div"
                        sx={{
                            fontWeight: 'bold',
                            color: 'text.secondary',
                            fontSize: size * 0.22
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
                        color: 'text.secondary',
                        fontWeight: 500,
                        letterSpacing: '0.5px',
                        animation: 'blink 1.5s infinite',
                        '@keyframes blink': {
                            '0%': { opacity: 0.4 },
                            '50%': { opacity: 1 },
                            '100%': { opacity: 0.4 },
                        },
                    }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );
};

export default HLProgress;
