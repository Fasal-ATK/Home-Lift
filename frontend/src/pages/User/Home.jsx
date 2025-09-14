// src/pages/user/Home.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper
} from '@mui/material';
import ProviderApplicationModal from '../../components/provider/ApplicationForm';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCategories } from '../../redux/slices/categorySlice';
import { fetchServices } from '../../redux/slices/serviceSlice';

const Home = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { list: categories, loading: categoriesLoading, error: categoriesError } =
    useSelector((state) => state.categories);
  const { list: services, loading: servicesLoading, error: servicesError } =
    useSelector((state) => state.services);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchServices());
  }, [dispatch]);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleSubmitApplication = async (formData) => {
    try {
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Application failed:', error);
      alert('Something went wrong!');
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f9f9f9' }}>
      {/* Categories List */}
      {/* <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        Our Categories
      </Typography> */}
      {/* <Grid container spacing={2}>
        {categoriesLoading ? (
          <Typography>Loading categories...</Typography>
        ) : categoriesError ? (
          <Typography color="error">Failed to load categories</Typography>
        ) : (
          categories.map((cat) => (
            <Grid item xs={6} sm={4} md={2} key={cat.id}>
              <Paper
                elevation={3}
                sx={{
                  textAlign: 'center',
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  height: 150,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {cat.icon ? (
                  <img
                    src={cat.icon}
                    alt={cat.name}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: 'contain',
                      marginBottom: '8px'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: '#eee',
                      borderRadius: '8px',
                      mb: 1
                    }}
                  />
                )}
                <Typography variant="body2" fontWeight="bold" noWrap>
                  {cat.name}
                </Typography>
              </Paper>
            </Grid>
          ))
        )}
      </Grid> */}

      {/* Services List */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 2 }}>
        Our Services
      </Typography>
      <Grid container spacing={2}>
        {servicesLoading ? (
          <Typography>Loading services...</Typography>
        ) : servicesError ? (
          <Typography color="error">Failed to load services</Typography>
        ) : (
          services.map((srv) => (
            <Grid item xs={6} sm={4} md={2} key={srv.id}>
              <Paper
                elevation={3}
                sx={{
                  textAlign: 'center',
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  height: 150,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {srv.icon ? (
                  <img
                    src={srv.icon}
                    alt={srv.name}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: 'contain',
                      marginBottom: '8px'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: '#eee',
                      borderRadius: '8px',
                      mb: 1
                    }}
                  />
                )}
                <Typography variant="body2" fontWeight="bold" noWrap>
                  {srv.name}
                </Typography>
              </Paper>
            </Grid>
          ))
        )}
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
        categories={categories}
        services={services}
      />
    </Box>
  );
};

export default Home;
