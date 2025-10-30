import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookings } from '../../../redux/slices/bookingSlice';
import { Box, Typography, CircularProgress, Card, CardContent, Grid, Chip } from '@mui/material';

const statusColor = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'default',
};

export default function MyBookings() {
  const dispatch = useDispatch();
  const { bookings, loading, error } = useSelector(state => state.bookings);

  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '80vh', bgcolor: '#f9f9f9' }}>
      <Typography variant="h4" fontWeight={700} mb={4} textAlign="center">My Bookings</Typography>
      {loading && <Box textAlign="center"><CircularProgress /></Box>}
      {error && <Typography color="error" textAlign="center">{error.message || error}</Typography>}
      {!loading && bookings.length === 0 && <Typography textAlign="center">No bookings found.</Typography>}
      <Grid container spacing={3}>
        {bookings.map(b => (
          <Grid item xs={12} md={6} lg={4} key={b.id}>
            <Card>
              <CardContent>
                <Typography fontWeight={600} fontSize={16}>{b.service_name || b.service}</Typography>
                <Typography variant="body2">Date: <b>{b.booking_date}</b> | Time: <b>{b.booking_time}</b></Typography>
                <Typography variant="body2">Price: ₹{b.price}</Typography>
                <Typography variant="body2" gutterBottom>Address: {b.address_details ? `${b.address_details?.title}, ${b.address_details?.address_line}, ${b.address_details?.city}` : b.address}</Typography>
                <Chip label={b.status} color={statusColor[b.status] || 'default'} size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
