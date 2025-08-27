// src/pages/user/Home.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper
} from '@mui/material';
import ProviderApplicationModal from '../../components/provider/ApplicationForm';
import { useSelector } from 'react-redux'; // To get user ID
// import { useDispatch } from 'react-redux';
// import { submitProviderApplication } from '../../services/providerService'; // You need to create this

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
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleSubmitApplication = async (formData) => {
    try {
      await submitProviderApplication(formData);
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Application failed:', error);
      alert('Something went wrong!');
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f9f9f9' }}>
      {/* Services List */}
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
          onClick={handleOpenModal}
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


      {/* Modal Component */}
      <ProviderApplicationModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitApplication}
        userId={user?.id}
      />
    </Box>
  );
};

export default Home;
