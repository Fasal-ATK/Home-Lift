// pages/user/Home.jsx
import React from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import LogoutButton from '../../components/common/Logout';

const serviceItems = [
  'AC SERVICE',
  'ELECTRICIAN',
  'PLUMBER',
  'DEEP CLEANING',
  'CARPENTER',
  'PAINTER',
  'WATER PURIFIER',
  'LAPTOP REPAIR',
  'MORE SERVICES',
];

const Home = () => {
  return (
    <Box sx={{ p: 4, backgroundColor: '#f9f9f9' }}>
      {/* Service Icons Section */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        Our Services
      </Typography>
      <Grid container spacing={2}>
        {serviceItems.map((item, index) => (
          <Grid item xs={4} sm={3} md={2} key={index}>
            <Paper
              elevation={3}
              sx={{
                textAlign: 'center',
                p: 2,
                backgroundColor: 'white',
                color: '#003A70',
                fontWeight: 'bold',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              {item}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Call to Action */}
      <Box
        sx={{
          mt: 5,
          p: 4,
          backgroundColor: 'white',
          border: '2px solid #f2b705',
          borderRadius: '10px',
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          ARE YOU A SERVICE EXPERT?
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Join world's largest service network
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#007bff',
            color: 'white',
            textTransform: 'none',
            px: 3,
          }}
        >
          Register as Partner
        </Button>
      </Box>

      {/* Logout Button (your component) */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <LogoutButton />
      </Box>
    </Box>
  );
};

export default Home;
