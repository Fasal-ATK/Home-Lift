import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  CircularProgress,
   MenuItem,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import { createBooking, fetchBookings } from "../../../redux/slices/bookingSlice";

const BookingPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const selectedService = location.state?.service || null; // ✅ Get service from navigation

  const { bookings, loading, error } = useSelector((state) => state.bookings);
  const { handleSubmit, control, reset, watch, setValue } = useForm();

  const timeSlots = ["08:00-10:00", "11:00-13:00", "14:00-16:00", "17:00-19:00"];
  const price = watch("price");

  // Auto-calculate advance
  const calculateAdvance = (price) => {
    const advance = price ? Math.min(price * 0.02, 200) : 0;
    return advance.toFixed(2);
  };

  useEffect(() => {
    setValue("advance", calculateAdvance(price));
  }, [price, setValue]);

  // Pre-fill service info if navigated from service details
  useEffect(() => {
    if (selectedService) {
      setValue("service", selectedService.id);
      setValue("price", selectedService.price || "");
    }
  }, [selectedService, setValue]);

  const onSubmit = async (data) => {
    dispatch(createBooking(data))
      .unwrap()
      .then(() => {
        reset();
        dispatch(fetchBookings());
      })
      .catch((err) => console.error(err));
  };

  return (
    <Grid container spacing={3} justifyContent="center" sx={{ mt: 4 }}>
      {/* Booking Form */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" mb={3}>
            Create Booking
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* ✅ Display selected service info instead of dropdown */}
            {selectedService ? (
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #ddd",
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  Service: {selectedService.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Description: {selectedService.description || "—"}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Price: ₹{selectedService.price}
                </Typography>
              </Paper>
            ) : (
              <Typography color="error" mb={2}>
                ⚠️ No service selected. Please go back and choose one.
              </Typography>
            )}

            {/* Hidden field to include service ID in the form data */}
            <Controller
              name="service"
              control={control}
              defaultValue={selectedService?.id || ""}
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {/* Full Name */}
            <Controller
              name="full_name"
              control={control}
              defaultValue=""
              rules={{ required: "Full name is required" }}
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
              rules={{ required: "Phone is required" }}
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
                <TextField
                  label="Address"
                  fullWidth
                  margin="normal"
                  {...field}
                  multiline
                  rows={2}
                />
              )}
            />

            {/* Notes */}
            <Controller
              name="notes"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  label="Notes"
                  fullWidth
                  margin="normal"
                  {...field}
                  multiline
                  rows={2}
                />
              )}
            />

            {/* Booking Date */}
            <Controller
              name="booking_date"
              control={control}
              defaultValue=""
              rules={{ required: "Booking date is required" }}
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

            {/* Booking Time */}
            <Controller
              name="booking_time"
              control={control}
              defaultValue=""
              rules={{ required: "Booking time is required" }}
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

            {/* Price (read-only) */}
            <Controller
              name="price"
              control={control}
              defaultValue={selectedService?.price || ""}
              render={({ field }) => (
                <TextField
                  label="Price"
                  type="number"
                  fullWidth
                  margin="normal"
                  {...field}
                  InputProps={{ readOnly: true }}
                />
              )}
            />

            {/* Advance (auto-calculated) */}
            <Controller
              name="advance"
              control={control}
              defaultValue={calculateAdvance(selectedService?.price)}
              render={({ field }) => (
                <TextField
                  label="Advance (2% of price, max ₹200)"
                  {...field}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={!selectedService}
            >
              {loading ? <CircularProgress size={24} /> : "Book Now"}
            </Button>
          </form>

          {error && (
            <Typography color="error" mt={2}>
              {error.message || error}
            </Typography>
          )}
        </Paper>
      </Grid>

      {/* Existing Bookings */}
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
