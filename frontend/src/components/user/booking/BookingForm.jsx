import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button, MenuItem, Grid, Typography, Paper, CircularProgress } from '@mui/material';
import { createBooking, fetchBookings } from '../../../redux/slices/bookingSlice'
import { bookingService } from '../../../services/apiServices';

const BookingPage = () => {
  const dispatch = useDispatch();
  const { bookings, loading, error } = useSelector(state => state.booking);
  const { handleSubmit, control, reset, watch, setValue } = useForm();

  const [services, setServices] = useState([]);

  // Fixed time slots
  const timeSlots = [
    "08:00-10:00",
    "11:00-13:00",
    "14:00-16:00",
    "17:00-19:00"
  ];

  // Watch price to calculate advance automatically
  const price = watch("price");

  // Calculate advance
  const calculateAdvance = (price) => {
    const advance = price ? Math.min(price * 0.02, 200) : 0;
    return advance.toFixed(2);
  };

  // Fetch services for dropdown
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await bookingService.getServices(); // Endpoint must exist
        setServices(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchServices();
  }, []);

  const onSubmit = async (data) => {
    // Include advance automatically
    data.advance = calculateAdvance(data.price);

    dispatch(createBooking(data))
      .unwrap()
      .then(() => {
        reset();
        dispatch(fetchBookings());
      })
      .catch(err => console.error(err));
  };

  return (
    <Grid container spacing={3} justifyContent="center" sx={{ mt: 4 }}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" mb={3}>
            Create Booking
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Service Dropdown */}
            <Controller
              name="service"
              control={control}
              defaultValue=""
              rules={{ required: 'Service is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  label="Select Service"
                  fullWidth
                  margin="normal"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Full Name */}
            <Controller
              name="full_name"
              control={control}
              defaultValue=""
              rules={{ required: 'Full name is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Full Name"
                  fullWidth
                  margin="normal"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            {/* Phone */}
            <Controller
              name="phone"
              control={control}
              defaultValue=""
              rules={{ required: 'Phone is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Phone"
                  fullWidth
                  margin="normal"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            {/* Address */}
            <Controller
              name="address"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField label="Address" fullWidth margin="normal" {...field} multiline rows={2} />
              )}
            />

            {/* Notes */}
            <Controller
              name="notes"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField label="Notes" fullWidth margin="normal" {...field} multiline rows={2} />
              )}
            />

            {/* Booking Date */}
            <Controller
              name="booking_date"
              control={control}
              defaultValue=""
              rules={{ required: 'Booking date is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Booking Date"
                  type="date"
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            {/* Booking Time Slot */}
            <Controller
              name="booking_time"
              control={control}
              defaultValue=""
              rules={{ required: 'Booking time is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  label="Booking Time Slot"
                  fullWidth
                  margin="normal"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {timeSlots.map((slot) => (
                    <MenuItem key={slot} value={slot}>
                      {slot}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Price */}
            <Controller
              name="price"
              control={control}
              defaultValue=""
              rules={{ required: 'Price is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Price"
                  type="number"
                  fullWidth
                  margin="normal"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            {/* Advance (calculated) */}
            <TextField
              label="Advance (2% of price, max ₹200)"
              value={calculateAdvance(price)}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />

            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
              {loading ? <CircularProgress size={24} /> : 'Book Now'}
            </Button>
          </form>

          {error && (
            <Typography color="error" mt={2}>
              {error.message || error}
            </Typography>
          )}
        </Paper>
      </Grid>

      {/* List of existing bookings */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" mb={3}>
            Your Bookings
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <ul>
              {bookings.map((b) => (
                <li key={b.id}>
                  {b.service_name} on {b.booking_date} at {b.booking_time} ({b.status})
                </li>
              ))}
            </ul>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default BookingPage;
