// src/pages/user/Addresses.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Card, CardActions, CardContent, Chip, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, IconButton,
  Stack, TextField, Typography
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { Add, Delete, Edit, LocationOn } from "@mui/icons-material";
import ConfirmModal from "../../common/Confirm";
import { ShowToast } from "../../common/Toast";
import { useDispatch, useSelector } from "react-redux";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress as updateAddressThunk,
} from "../../../redux/slices/user/userSlice";

// country/state/city helper
import { State, City } from "country-state-city";

export default function Addresses() {
  const dispatch = useDispatch();
  const addresses = useSelector((s) => s.user.addresses) || [];
  const loading = useSelector((s) => s.user.addressesLoading);
  const error = useSelector((s) => s.user.addressesError);

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    title: "",
    address_line: "",
    district: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    latitude: "",
    longitude: "",
    is_default: false,
  });

  // Delete confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // states/cities
  const states = useMemo(() => State.getStatesOfCountry("IN"), []);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const openAddModal = () => {
    setEditing(null);
    setForm({
      title: "",
      address_line: "",
      district: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
      latitude: "",
      longitude: "",
      is_default: false,
    });
    setCities([]);
    setModalOpen(true);
  };

  const openEditModal = (address) => {
    setEditing(address);
    setForm({
      title: address.title || "",
      address_line: address.address_line || "",
      district: address.district || "",
      city: address.city || "",
      state: address.state || "",
      postal_code: address.postal_code || "",
      country: address.country || "India",
      latitude: address.latitude ?? "",
      longitude: address.longitude ?? "",
      is_default: !!address.is_default,
    });

    // populate city dropdown for selected state
    const selectedState = states.find((s) => s.name === address.state);
    if (selectedState) {
      const stateCities = City.getCitiesOfState("IN", selectedState.isoCode);
      setCities(stateCities);
    } else {
      setCities([]);
    }

    setModalOpen(true);
  };

  const handleSave = async () => {
    // simple validation
    if (
      !form.title ||
      !form.address_line ||
      !form.city ||
      !form.state ||
      !form.postal_code ||
      !form.country
    ) {
      // You can surface a better validation UI; keeping simple for now
      return;
    }

    const payload = {
      title: form.title,
      address_line: form.address_line,
      district: form.district || "",
      city: form.city,
      state: form.state,
      postal_code: form.postal_code,
      country: form.country,
      // send null if empty so serializer gets null not empty string
      latitude: form.latitude !== "" ? form.latitude : null,
      longitude: form.longitude !== "" ? form.longitude : null,
      is_default: !!form.is_default,
    };

    if (editing) {
      dispatch(updateAddressThunk({ id: editing.id, data: payload }))
        .unwrap()
        .then(() => {
          setModalOpen(false);
          setEditing(null);
        })
        .catch(() => {
          // optionally show error to user
        });
    } else {
      dispatch(createAddress(payload))
        .unwrap()
        .then(() => {
          setModalOpen(false);
          setEditing(null);
        })
        .catch(() => {
          // optionally show error to user
        });
    }
  };

  const requestDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    dispatch(deleteAddress(deleteId))
      .unwrap()
      .then(() => {
        setConfirmOpen(false);
        setDeleteId(null);
      })
      .catch(() => {
        // optionally show error
      });
  };

  // helper: use browser geolocation to populate lat/lon
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      ShowToast("Geolocation is not supported by your browser.", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lon) }));
      },
      (err) => {
        console.error("Geolocation error:", err);
        ShowToast("Unable to fetch location. Please allow location access or enter manually.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700}>My Addresses</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAddModal}>
          Add Address
        </Button>
      </Stack>

      {error && <Typography color="error" mb={2}>{error}</Typography>}

      <Grid container spacing={2}>
        {(loading && addresses.length === 0) && (
          <Grid size={{ xs: 12 }}><Typography>Loading...</Typography></Grid>
        )}
        {!loading && addresses.length === 0 && (
          <Grid size={{ xs: 12 }}><Typography color="text.secondary">No addresses found.</Typography></Grid>
        )}
        {addresses.map((addr) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={addr.id}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="subtitle1" fontWeight={700}>{addr.title}</Typography>
                  {addr.is_default && <Chip size="small" label="Default" color="primary" sx={{ ml: 1 }} />}
                </Stack>
                <Typography variant="body2">{addr.address_line}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {addr.city}, {addr.state} {addr.postal_code}
                </Typography>
                <Typography variant="body2" color="text.secondary">{addr.country}</Typography>

                {/* show coordinates when present */}
                {(addr.latitude !== null && addr.longitude !== null) && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Lat: {addr.latitude} • Lon: {addr.longitude}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end" }}>
                <IconButton color="primary" onClick={() => openEditModal(addr)} aria-label="edit">
                  <Edit />
                </IconButton>
                <IconButton color="error" onClick={() => requestDelete(addr.id)} aria-label="delete">
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Edit Address" : "Add Address"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {/* Static fields */}
            <TextField
              label="Title (e.g., Home, Office)"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Address Line"
              value={form.address_line}
              onChange={(e) => setForm((p) => ({ ...p, address_line: e.target.value }))}
              fullWidth
            />

            {/* State Autocomplete w/ search */}
            <Autocomplete
              options={states}
              getOptionLabel={(option) => option?.name || ""}
              value={states.find((s) => s.name === form.state) || null}
              onChange={(_e, value) => {
                setForm((f) => ({ ...f, state: value ? value.name : "", city: "", district: "" }));
                if (value) {
                  const stateCities = City.getCitiesOfState("IN", value.isoCode);
                  setCities(stateCities);
                } else {
                  setCities([]);
                }
              }}
              inputValue={form.state || ""}
              onInputChange={(_e, value) => setForm((f) => ({ ...f, state: value }))}
              renderInput={(params) => <TextField {...params} label="State" fullWidth />}
              fullWidth
              disableClearable={false}
            />

            {/* City/Nearest City as single Autocomplete */}
            <Autocomplete
              options={cities.map((c) => c.name)}
              getOptionLabel={(option) => option || ""}
              value={form.city || null}
              onChange={(_e, value) => {
                const selectedCity = cities.find((c) => c.name === value);
                setForm((f) => ({
                  ...f,
                  city: value || "",
                  district: selectedCity ? selectedCity.district : "",
                }));
              }}
              inputValue={form.city || ""}
              onInputChange={(_e, value) => setForm((f) => ({ ...f, city: value }))}
              renderInput={(params) => <TextField {...params} label="City/Nearest City" fullWidth />}
              disabled={!form.state}
              fullWidth
              disableClearable={false}
            />

            <TextField
              label="Postal Code"
              value={form.postal_code}
              inputProps={{ maxLength: 6, inputMode: "numeric", pattern: "[0-9]*" }}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setForm((p) => ({ ...p, postal_code: value }));
              }}
              fullWidth
            />

            <TextField
              label="Country"
              value={form.country}
              disabled
              fullWidth
            />

            {/* Location controls */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<LocationOn />}
                onClick={useCurrentLocation}
              >
                Use Current Location
              </Button>
              <Typography variant="caption" color="text.secondary">
                (optional) or enter coordinates manually
              </Typography>
            </Stack>

            <TextField
              label="Latitude"
              value={form.latitude}
              onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))}
              helperText="e.g. 12.971599"
              fullWidth
            />
            <TextField
              label="Longitude"
              value={form.longitude}
              onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))}
              helperText="e.g. 77.594566"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {editing ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Delete this address?"
        color="danger"
        confirmLabel="Delete"
      />
    </Box>
  );
}
