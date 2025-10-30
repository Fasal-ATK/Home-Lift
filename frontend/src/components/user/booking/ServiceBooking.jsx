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

const BookingPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const selectedService = location.state?.service || null;
  const { loading, error } = useSelector((state) => state.bookings);
  const { handleSubmit, control, reset, watch, setValue } = useForm();
  const userAddresses = useSelector(state => state.user.addresses);
  const addressesLoading = useSelector(state => state.user.addressesLoading);
  const navigate = useNavigate();

  useEffect(() => {
    if (userAddresses.length === 0) dispatch(fetchAddresses());
  }, [dispatch, userAddresses.length]);

  const timeSlots = ["08:00-10:00", "11:00-13:00", "14:00-16:00", "17:00-19:00"];
  const price = watch("price");
  const calcAdvance = (p) => (p ? Math.min(p * 0.02, 200).toFixed(2) : 0);

  useEffect(() => setValue("advance", calcAdvance(price)), [price, setValue]);
  useEffect(() => {
    if (selectedService) {
      setValue("service", selectedService.id);
      setValue("price", selectedService.price || "");
    }
  }, [selectedService, setValue]);

  const onSubmit = (data) =>
    dispatch(createBooking(data))
      .unwrap()
      .then(() => {
        reset();
        dispatch(fetchBookings());
        navigate("/bookings");
      });

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
    ...props
  }) => (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue=""
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
        <Grid item xs={12} md={6}>
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

              <input type="hidden" {...control.register("service")} defaultValue={selectedService?.id} />

              <Field name="full_name" label="Full Name" rules={{ required: "Full name is required" }} />
              <Field name="phone" label="Phone Number" rules={{ required: "Phone number is required" }} />
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
              />
              <Field
                name="booking_time"
                label="Time Slot"
                select
                options={timeSlots}
                rules={{ required: "Time slot is required" }}
              />

              {/* ✅ Read-only fields */}
              <Field
                name="price"
                label="Price"
                type="number"
                defaultValue={selectedService?.price || ""}
                readOnly
              />
              <Field
                name="advance"
                label="Advance (2% of price, max ₹200)"
                defaultValue={calcAdvance(selectedService?.price)}
                readOnly
              />

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
                {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Confirm Booking"}
              </Button>
            </form>

            {error && (
              <Typography color="error" mt={2}>
                {error.message || error}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BookingPage;