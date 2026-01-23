// src/components/user/booking/ServiceBookingPage.jsx

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
  Box,
  Divider,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { createBooking, fetchBookings } from "../../../redux/slices/bookingSlice";
import Autocomplete from "@mui/material/Autocomplete";
import { fetchAddresses } from "../../../redux/slices/user/userSlice";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "../../../../stripe/stripe";
import CheckoutForm from "../../common/payment";
import { createPaymentIntent } from "../../../services/apiServices";

const calcAdvance = (p) => {
  if (!p) return 0;
  const calculated = p * 0.02;
  const capped = Math.min(calculated, 200);
  // Stripe minimum is ₹50
  return Math.max(capped, 50).toFixed(2);
};

const BookingPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const selectedService = location.state?.service || null;
  const { loading, error } = useSelector((state) => state.bookings);
  const { handleSubmit, control, reset, watch, setValue } = useForm({
    defaultValues: {
      service: selectedService?.id || "",
      full_name: "",
      phone: "",
      address: "",
      notes: "",
      booking_date: "",
      booking_time: "",
      price: selectedService?.price || 0,
      advance: calcAdvance(selectedService?.price) || 0,
    }
  });
  const userAddresses = useSelector(state => state.user.addresses);
  const addressesLoading = useSelector(state => state.user.addressesLoading);
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = React.useState("");

  useEffect(() => {
    if (userAddresses.length === 0) dispatch(fetchAddresses());
  }, [dispatch, userAddresses.length]);

  const timeSlots = ["08:00-10:00", "11:00-13:00", "14:00-16:00", "17:00-19:00"];
  const price = watch("price");
  const selectedDate = watch("booking_date");

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  // Filter time slots if today is selected
  const getAvailableTimeSlots = () => {
    if (!selectedDate || selectedDate !== today) {
      return timeSlots;
    }

    // If today is selected, filter out past time slots
    const now = new Date();
    const currentHour = now.getHours();

    return timeSlots.filter(slot => {
      const startHour = parseInt(slot.split(':')[0]);
      return startHour > currentHour;
    });
  };

  const availableTimeSlots = getAvailableTimeSlots();

  useEffect(() => setValue("advance", calcAdvance(price)), [price, setValue]);
  useEffect(() => {
    if (selectedService) {
      setValue("service", selectedService.id);
      setValue("price", selectedService.price || "");
    }
  }, [selectedService, setValue]);

  // Reset time slot if it becomes unavailable
  useEffect(() => {
    const currentTime = watch("booking_time");
    if (currentTime && !availableTimeSlots.includes(currentTime)) {
      setValue("booking_time", "");
    }
  }, [selectedDate, availableTimeSlots, setValue, watch]);

  const onSubmit = (data) => {
    // Ensure service is included
    if (!data.service && selectedService) {
      data.service = selectedService.id;
    }

    dispatch(createBooking(data))
      .unwrap()
      .then(async (res) => {
        // res should contain the created booking with its ID
        const bookingId = res.id || (res.data && res.data.id);
        if (bookingId) {
          try {
            const secret = await createPaymentIntent(bookingId);
            setClientSecret(secret);
          } catch (err) {
            console.error("Payment Intent Error:", err);
          }
        }
      })
      .catch((error) => {
        console.error("Booking error:", error);
      });
  };

  // Generic Field component
  const Field = ({
    name,
    label,
    type = "text",
    rules,
    multiline,
    rows,
    select,
    options,
    readOnly,
    defaultValue,
    ...props
  }) => (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue !== undefined ? defaultValue : ""}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          type={type}
          select={select}
          multiline={multiline}
          rows={rows}
          fullWidth
          margin="normal"
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          InputProps={{ readOnly }}
          InputLabelProps={type === "date" ? { shrink: true } : undefined}
          {...props}
        >
          {select &&
            options?.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
        </TextField>
      )}
    />
  );

  return (
    <Box sx={{ bgcolor: "#f4f6f8", minHeight: "100vh", py: 6, px: { xs: 2, sm: 6 } }}>
      <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
        🧾 Book Your Service
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {/* Booking Form */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" mb={2} fontWeight="bold">
              Booking Details
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit(onSubmit)}>
              {selectedService ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 3,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    bgcolor: "#f9f9f9",
                  }}
                >
                  <Typography fontWeight="bold">{selectedService.name}</Typography>
                  <Typography color="text.secondary">₹{selectedService.price}</Typography>
                </Paper>
              ) : (
                <Typography color="error" mb={2}>
                  ⚠️ No service selected.
                </Typography>
              )}

              {/* Service field - hidden but controlled */}
              <Controller
                name="service"
                control={control}
                rules={{ required: "Service is required" }}
                defaultValue={selectedService?.id || ""}
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />

              <Field name="full_name" label="Full Name" rules={{ required: "Full name is required" }} />

              {/* Phone Controller: numbers-only, maxLength 10, exact 10 digits validation */}
              <Controller
                name="phone"
                control={control}
                defaultValue=""
                rules={{
                  required: "Phone number is required",
                  pattern: { value: /^\d{10}$/, message: "Phone number must be exactly 10 digits" },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    margin="normal"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    inputProps={{
                      inputMode: "numeric",
                      maxLength: 10,
                      pattern: "[0-9]*",
                    }}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      field.onChange(digits);
                    }}
                  />
                )}
              />

              <Controller
                name="address"
                control={control}
                rules={{ required: "Pick a service address" }}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <Autocomplete
                    options={userAddresses}
                    getOptionLabel={opt =>
                      opt
                        ? `${opt.title}: ${opt.address_line}, ${opt.city}, ${opt.state} ${opt.postal_code}`
                        : ""
                    }
                    loading={addressesLoading}
                    value={userAddresses.find(a => a.id === field.value) || null}
                    onChange={(_e, val) => field.onChange(val ? val.id : "")}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Service Address"
                        margin="normal"
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                    disabled={addressesLoading}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  />
                )}
              />
              <Field name="notes" label="Notes (optional)" multiline rows={2} />

              <Field
                name="booking_date"
                label="Booking Date"
                type="date"
                rules={{ required: "Date is required" }}
                InputProps={{
                  inputProps: { min: today }
                }}
              />
              <Field
                name="booking_time"
                label="Time Slot"
                select
                options={availableTimeSlots}
                rules={{ required: "Time slot is required" }}
              />

              {/* ✅ Payment Summary Display */}
              <Box sx={{ mt: 3, p: 2.5, bgcolor: "#f8f9fa", borderRadius: 3, border: "1px solid #e0e0e0" }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                  PAYMENT SUMMARY
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography color="text.secondary">Service Price</Typography>
                  <Typography fontWeight="700">₹{price || 0}</Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography color="text.secondary">Advance Payment (Pay now)</Typography>
                  <Typography fontWeight="700" color="primary.main">
                    ₹{calcAdvance(price)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="subtitle1" fontWeight="bold">Remaining Balance</Typography>
                  <Typography variant="subtitle1" fontWeight="800" color="success.main">
                    ₹{(price - calcAdvance(price)).toFixed(2)}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5, fontStyle: "italic" }}>
                  * The remaining balance is payable directly to the provider after service completion.
                </Typography>
              </Box>

              {/* Keep fields in form state as hidden inputs */}
              <Controller
                name="price"
                control={control}
                defaultValue={selectedService?.price || ""}
                render={({ field }) => <input type="hidden" {...field} />}
              />
              <Controller
                name="advance"
                control={control}
                defaultValue={calcAdvance(selectedService?.price)}
                render={({ field }) => <input type="hidden" {...field} />}
              />

              {clientSecret ? (
                <Paper sx={{ p: 3, mt: 2, border: "1px solid #1976d2", borderRadius: 2 }}>
                  <Typography variant="h6" mb={2} color="primary" fontWeight="bold">
                    💳 Secure Advance Payment
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm />
                  </Elements>
                </Paper>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 3,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    background: "linear-gradient(135deg,#1976d2 30%,#42a5f5 90%)",
                    "&:hover": { background: "linear-gradient(135deg,#1565c0 30%,#1e88e5 90%)" },
                  }}
                  disabled={!selectedService || loading}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Confirm Booking & Pay Advance"}
                </Button>
              )}
            </form>

            {error && (
              <Typography color="error" mt={2}>
                {typeof error === 'string'
                  ? error
                  : error.message || error.error || JSON.stringify(error)}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BookingPage;
