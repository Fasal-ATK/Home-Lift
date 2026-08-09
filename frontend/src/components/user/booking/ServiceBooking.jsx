// src/components/user/booking/ServiceBookingPage.jsx

import React, { useEffect, useMemo, useState } from "react";
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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { LocationOn } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { createBooking } from "../../../redux/slices/bookingSlice";
import Autocomplete from "@mui/material/Autocomplete";
import { fetchAddresses, createAddress, updateAddress as updateAddressThunk } from "../../../redux/slices/user/userSlice";
import { fetchWallet, payWithWalletThunk } from "../../../redux/slices/walletSlice";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "../../../../stripe/stripe";
import CheckoutForm from "../../common/payment";
import { createPaymentIntent } from "../../../services/apiServices";
import { ShowToast } from "../../common/Toast";
import { getErrorMessage } from "../../../utils/errorHelper";
import { State, City } from "country-state-city";


const calcAdvance = (p) => {
  const price = Number(p) || 0;
  if (price <= 0) return "0.00";
  const calculated = price * 0.02;
  const capped = Math.min(calculated, 200);
  // Stripe minimum is ₹50 — but advance should never exceed total price
  const minAdv = Math.max(capped, 50);
  const advance = Math.min(minAdv, price);
  return advance.toFixed(2);
};

const getDiscountedPrice = (price, offer) => {
  const basePrice = Number(price);
  if (!offer || !basePrice) return basePrice;
  let discounted = basePrice;
  const discountVal = Number(offer.discount_value);

  if (offer.discount_type === 'percentage') {
    let discount = (basePrice * discountVal) / 100;
    if (offer.max_discount) {
      discount = Math.min(discount, Number(offer.max_discount));
    }
    discounted = basePrice - discount;
  } else {
    discounted = basePrice - discountVal;
  }
  return Math.max(discounted, 0);
};

// Stable constant outside the component — prevents stale closure / re-render issues
const EMPTY_ADDRESS_FORM = {
  title: "", address_line: "", city: "", state: "",
  postal_code: "", country: "India", latitude: "", longitude: "",
};


/* ─────────────────────────────────────────────────────────────────
   AddEditAddressDialog  –  handles both Add AND Edit in one dialog.
   Pass  initialData={address}  to edit an existing address.
   Leave initialData undefined/null to open in "Add" mode.
   ───────────────────────────────────────────────────────────────── */
function AddEditAddressDialog({ open, onClose, onSaved, initialData }) {
  const dispatch = useDispatch();
  const isEditing = Boolean(initialData?.id);

  const states = useMemo(() => State.getStatesOfCountry("IN"), []);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(EMPTY_ADDRESS_FORM);
  const [saving, setSaving] = useState(false);

  // Populate/reset form when the dialog opens or the target address changes
  // NOTE: depend on initialData?.id (primitive), NOT the object itself — avoids
  //       infinite re-render loops caused by a new object reference each render.
  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        title:        initialData.title        || "",
        address_line: initialData.address_line || "",
        city:         initialData.city         || "",
        state:        initialData.state        || "",
        postal_code:  initialData.postal_code  || "",
        country:      initialData.country      || "India",
        latitude:     initialData.latitude  ?? "",
        longitude:    initialData.longitude ?? "",
      });
      const savedState = states.find((s) => s.name === initialData.state);
      setCities(savedState ? City.getCitiesOfState("IN", savedState.isoCode) : []);
    } else {
      setForm(EMPTY_ADDRESS_FORM);
      setCities([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id]);  // use the id primitive, not the full object

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleStateChange = (_e, value) => {
    setForm((f) => ({ ...f, state: value ? value.name : "", city: "" }));
    setCities(value ? City.getCitiesOfState("IN", value.isoCode) : []);
  };

  const handleCityChange = (_e, value) => setForm((f) => ({ ...f, city: value || "" }));

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return ShowToast("Geolocation not supported", "error");
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({
        ...f,
        latitude:  pos.coords.latitude.toFixed(6),
        longitude: pos.coords.longitude.toFixed(6),
      })),
      () => ShowToast("Could not get location. Please allow access or enter manually.", "error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!form.title || !form.address_line || !form.city || !form.state || !form.postal_code) {
      ShowToast("Please fill in all required fields.", "error");
      return;
    }
    const payload = {
      ...form,
      latitude:  form.latitude  || null,
      longitude: form.longitude || null,
    };
    setSaving(true);
    try {
      let result;
      if (isEditing) {
        result = await dispatch(updateAddressThunk({ id: initialData.id, data: payload })).unwrap();
        ShowToast("Address updated!", "success");
      } else {
        result = await dispatch(createAddress(payload)).unwrap();
        ShowToast("Address added!", "success");
      }
      onSaved(result);
      onClose();
    } catch (err) {
      ShowToast(getErrorMessage(err, "Failed to save address."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEditing ? "Edit Address" : "Add New Address"}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <TextField label="Title (e.g. Home, Office)" value={form.title}
            onChange={set("title")} fullWidth required />

          <TextField label="Address Line" value={form.address_line}
            onChange={set("address_line")} fullWidth required />

          {/* State autocomplete */}
          <Autocomplete
            options={states}
            getOptionLabel={(o) => o?.name || ""}
            value={states.find((s) => s.name === form.state) || null}
            onChange={handleStateChange}
            renderInput={(params) => <TextField {...params} label="State" required fullWidth />}
            disableClearable={false}
            fullWidth
          />

          {/* City autocomplete (depends on chosen state) */}
          <Autocomplete
            options={cities.map((c) => c.name)}
            getOptionLabel={(o) => o || ""}
            value={form.city || null}
            onChange={handleCityChange}
            renderInput={(params) => <TextField {...params} label="City" required fullWidth />}
            disabled={!form.state}
            disableClearable={false}
            fullWidth
          />

          <TextField
            label="Postal Code" value={form.postal_code} required fullWidth
            inputProps={{ maxLength: 6, inputMode: "numeric" }}
            onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value.replace(/\D/g, "") }))}
          />

          <TextField label="Country" value={form.country} disabled fullWidth />

          {/* Optional GPS */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" size="small" startIcon={<LocationOn />} onClick={useCurrentLocation}>
              Use My Location
            </Button>
            <Typography variant="caption" color="text.secondary">(optional)</Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField label="Latitude" value={form.latitude}
              onChange={set("latitude")} fullWidth helperText="e.g. 12.971599" />
            <TextField label="Longitude" value={form.longitude}
              onChange={set("longitude")} fullWidth helperText="e.g. 77.594566" />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving
            ? <CircularProgress size={20} color="inherit" />
            : isEditing ? "Save Changes" : "Save Address"
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const BookingPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const selectedService = location.state?.service || null;
  const offer = selectedService?.active_offer;
  const finalPrice = getDiscountedPrice(selectedService?.price, offer);
  const advanceAmount = Number(calcAdvance(finalPrice || 0));

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
      price: finalPrice || 0,
      advance: calcAdvance(finalPrice) || 0,
    }
  });
  const userAddresses = useSelector(state => state.user.addresses);
  const addressesLoading = useSelector(state => state.user.addressesLoading);
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card" or "wallet"
  const { balance: walletBalance } = useSelector((state) => state.wallet);

  // ── Add / Edit Address dialog state ──
  const [addAddrOpen, setAddAddrOpen]   = useState(false);
  const [editingAddr, setEditingAddr]   = useState(null); // address object being edited

  useEffect(() => {
    dispatch(fetchWallet());
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
      setValue("price", finalPrice || "");
    }
  }, [selectedService, setValue, finalPrice]);

  // Reset time slot if it becomes unavailable
  useEffect(() => {
    const currentTime = watch("booking_time");
    if (currentTime && !availableTimeSlots.includes(currentTime)) {
      setValue("booking_time", "");
    }
  }, [selectedDate, availableTimeSlots, setValue, watch]);

  const onSubmit = (data) => {
    // Frontend Date Validation
    const selectedDateObj = new Date(data.booking_date);
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    if (selectedDateObj < todayObj) {
      ShowToast("Booking date cannot be in the past.", "error");
      return;
    }

    if (data.booking_date === today && data.booking_time) {
      const now = new Date();
      const currentHour = now.getHours();
      const startHour = parseInt(data.booking_time.split(':')[0]);
      if (startHour <= currentHour) {
        ShowToast("Booking time cannot be in the past.", "error");
        return;
      }
    }

    // Ensure service is included
    if (!data.service && selectedService) {
      data.service = selectedService.id;
    }

    dispatch(createBooking(data))
      .unwrap()
      .then(async (res) => {
        const bookingId = res.id || (res.data && res.data.id);
        if (bookingId) {
          if (paymentMethod === "card") {
            try {
              const secret = await createPaymentIntent(bookingId);
              setClientSecret(secret);
            } catch {
              ShowToast("Could not initiate payment. Please try again.", "error");
            }
          } else {
            dispatch(payWithWalletThunk({ bookingId, paymentType: "advance" }))
              .unwrap()
              .then(() => {
                ShowToast("Booking confirmed! Advance paid via wallet.", "success");
                navigate("/bookings?payment=success");
              })
              .catch((err) => {
                ShowToast(getErrorMessage(err, "Wallet payment failed. Please try again."), "error");
              });
          }
        }
      })
      .catch(() => {
        ShowToast("Booking failed. Please try again.", "error");
      });
  };

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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {offer ? (
                      <>
                        <Typography color="text.secondary" sx={{ textDecoration: 'line-through', fontSize: '0.9rem' }}>
                          ₹{selectedService.price}
                        </Typography>
                        <Typography color="success.main" fontWeight="bold">
                          ₹{Number(finalPrice).toFixed(2)}
                        </Typography>
                        <Chip
                          label={offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                          size="small"
                          color="success"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </>
                    ) : (
                      <Typography color="text.secondary">₹{selectedService.price}</Typography>
                    )}
                  </Box>
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

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
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
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
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
              </Box>

              {/* ── Service Address + Add / Edit address buttons ── */}
              <Box sx={{ mb: 2 }}>
                <Controller
                  name="address"
                  control={control}
                  rules={{ required: "Pick a service address" }}
                  defaultValue=""
                  render={({ field, fieldState }) => {
                    // the currently selected address object (or null)
                    const selectedAddr = userAddresses.find(a => a.id === field.value) || null;

                    return (
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        {/* Address dropdown */}
                        <Box sx={{ flex: 1 }}>
                          <Autocomplete
                            options={userAddresses}
                            // plain string shown in the input box once selected
                            getOptionLabel={opt =>
                              opt ? `${opt.title}: ${opt.address_line}, ${opt.city}, ${opt.state} ${opt.postal_code}` : ""
                            }
                            // custom dropdown rows: bold title + secondary detail line
                            renderOption={(props, opt) => (
                              <Box component="li" {...props} key={opt.id}>
                                <Box>
                                  <Typography variant="body2" fontWeight={700} lineHeight={1.3}>
                                    {opt.title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {opt.address_line}, {opt.city}, {opt.state} {opt.postal_code}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            loading={addressesLoading}
                            value={selectedAddr}
                            onChange={(_e, val) => field.onChange(val ? val.id : "")}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label="Service Address"
                                fullWidth
                                error={!!fieldState.error}
                                helperText={
                                  fieldState.error?.message ||
                                  (userAddresses.length === 0 && !addressesLoading
                                    ? "No addresses yet — click + to add one"
                                    : undefined)
                                }
                              />
                            )}
                            disabled={addressesLoading}
                            isOptionEqualToValue={(opt, val) => opt.id === val.id}
                          />
                        </Box>

                        {/* ➕ Add button */}
                        <Tooltip title="Add new address" placement="top">
                          <IconButton
                            onClick={() => setAddAddrOpen(true)}
                            color="primary"
                            sx={{ mt: 0.5 }}
                            aria-label="add new address"
                          >
                            <AddCircleOutlineIcon />
                          </IconButton>
                        </Tooltip>

                        {/* ✏️ Edit button — only shown when an address is selected */}
                        {selectedAddr && (
                          <Tooltip title="Edit selected address" placement="top">
                            <IconButton
                              onClick={() => setEditingAddr(selectedAddr)}
                              color="secondary"
                              sx={{ mt: 0.5 }}
                              aria-label="edit selected address"
                            >
                              <EditOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    );
                  }}
                />

                {/* Shared Add / Edit dialog */}
                <AddEditAddressDialog
                  open={addAddrOpen || Boolean(editingAddr)}
                  onClose={() => { setAddAddrOpen(false); setEditingAddr(null); }}
                  initialData={editingAddr}
                  onSaved={(savedAddr) => {
                    dispatch(fetchAddresses());
                    // keep the same address selected (add → select new; edit → keep same id)
                    setValue("address", savedAddr.id);
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Field name="notes" label="Notes (optional)" multiline rows={2} />
              </Box>

              <Box sx={{ mt: 3, mb: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: "bold", mb: 1 }}>
                    Select Payment Method
                  </FormLabel>
                  <RadioGroup
                    row
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <FormControlLabel
                      value="card"
                      control={<Radio />}
                      label="Credit/Debit Card (Stripe)"
                    />
                    <FormControlLabel
                      value="wallet"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          Wallet
                          <Chip
                            label={`Balance: ₹${walletBalance}`}
                            size="small"
                            color={Number(walletBalance) >= Number(calcAdvance(price)) ? "success" : "error"}
                            variant="outlined"
                          />
                        </Box>
                      }
                      disabled={Number(walletBalance) < Number(calcAdvance(price))}
                    />
                  </RadioGroup>
                  {paymentMethod === 'wallet' && Number(walletBalance) < Number(calcAdvance(price)) && (
                    <Typography variant="caption" color="error">
                      Insufficient wallet balance to pay advance.
                    </Typography>
                  )}
                </FormControl>
              </Box>

              {/* ✅ Payment Summary Display */}
              <Box sx={{ mt: 3, p: 2.5, bgcolor: "#f8f9fa", borderRadius: 3, border: "1px solid #e0e0e0" }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
                  PAYMENT SUMMARY
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography color="text.secondary">Main Price</Typography>
                  <Typography fontWeight="700" sx={{ textDecoration: offer ? "line-through" : "none", color: offer ? "text.disabled" : "inherit" }}>
                    ₹{selectedService?.price || 0}
                  </Typography>
                </Box>

                {offer && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                    <Typography color="text.secondary">Offer Price</Typography>
                    <Typography fontWeight="700" color="success.main">
                      ₹{Number(finalPrice).toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography color="text.secondary">Advance Payment (Pay now)</Typography>
                  <Typography fontWeight="700" color="primary.main">
                    ₹{advanceAmount.toFixed(2)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", opacity: 0.6 }}>
                  <Typography variant="body2">Remaining Balance</Typography>
                  <Typography variant="body2" fontWeight="700">
                    ₹{Math.max(0, Number(finalPrice || 0) - advanceAmount).toFixed(2)}
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
                defaultValue={calcAdvance(finalPrice)}
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
                  disabled={!selectedService || loading || (paymentMethod === "wallet" && Number(walletBalance) < Number(calcAdvance(price)))}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: "#fff" }} />
                  ) : paymentMethod === "wallet" ? (
                    "Pay with Wallet"
                  ) : (
                    "Confirm Booking & Pay Advance"
                  )}
                </Button>
              )}
            </form>

            {error && (
              <Typography color="error" mt={2}>
                {getErrorMessage(error)}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BookingPage;