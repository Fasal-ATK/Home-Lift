import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Stack,
  Alert,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
  Snackbar,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  VerifiedUser as VerifiedUserIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { providerService } from "../../services/apiServices";

// ─── helpers ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  service: "",
  price: "",
  experience_years: 0,
};

// ─── main component ─────────────────────────────────────────────────────────
function Bio() {
  const [details, setDetails] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // catalogue of all active services (for the "Request" dropdown)
  const [catalogue, setCatalogue] = useState([]);

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // snackbar
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // ── fetches ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bioData, reqData] = await Promise.all([
        providerService.fetchDetails(),
        providerService.listMyServiceRequests()
      ]);
      setDetails(bioData);
      setRequests(Array.isArray(reqData) ? reqData : reqData.results ?? []);
    } catch (err) {
      console.error("Failed to fetch provider data:", err);
      setError("Unable to load profile details.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCatalogue = useCallback(async () => {
    try {
      const data = await providerService.listAvailableServices();
      // data may be paginated or a plain array
      setCatalogue(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      console.error("Failed to fetch catalogue:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCatalogue();
  }, [fetchData, fetchCatalogue]);

  // ── dialog helpers ────────────────────────────────────────────────────────
  const openRequestDialog = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // ── submit request ────────────────────────────────────────────────────────
  const handleSubmitRequest = async () => {
    setFormError("");
    if (!form.service) {
      setFormError("Please select a service.");
      return;
    }

    const payload = {
      service: form.service,
      price: form.price === "" ? null : parseFloat(form.price),
      experience_years: parseInt(form.experience_years, 10) || 0,
    };

    setSaving(true);
    try {
      await providerService.submitServiceRequest(payload);
      showSnack("Service request submitted for admin approval.");
      setDialogOpen(false);
      await fetchData(); // Refresh bio & requests
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        Object.values(err?.response?.data || {}).flat().join(" ") ||
        "Something went wrong.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── cancel pending request ────────────────────────────────────────────────
  const handleCancelRequest = async (reqId) => {
    if (!window.confirm(`Are you sure you want to cancel this pending request?`)) return;
    try {
      await providerService.cancelServiceRequest(reqId);
      showSnack("Request cancelled.");
      await fetchData();
    } catch {
      showSnack("Failed to cancel request.", "error");
    }
  };

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  // ── filter catalogue dropdown ──────────────────────────────────────────────
  // Don't show services that are already approved OR currently pending
  const existingServiceIds = new Set([
    ...(details?.services ?? []).map((s) => s.service),
    ...requests.filter((r) => r.status === "pending").map((r) => r.service)
  ]);
  const availableToRequest = catalogue.filter((s) => !existingServiceIds.has(s.id));

  // ── render ────────────────────────────────────────────────────────────────
  if (loading && !details) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ── Profile header ─────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(to bottom, #ffffff, #fcfcfc)",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: "primary.main",
                fontSize: "2.5rem",
                fontWeight: "bold",
                boxShadow: 2,
              }}
            >
              {details.user_name?.[0]?.toUpperCase() || "P"}
            </Avatar>
          </Grid>
          <Grid item xs={12} sm>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1, flexWrap: "wrap" }}>
              <Typography variant="h4" fontWeight="bold">
                {details.user_name}
              </Typography>
              {details.is_active ? (
                <Chip
                  icon={<VerifiedUserIcon />}
                  label="Verified Provider"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: "bold" }}
                />
              ) : (
                <Chip label="Pending / Inactive" color="warning" size="small" />
              )}
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ color: "text.secondary" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon fontSize="small" />
                <Typography variant="body1">{details.user_email}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PhoneIcon fontSize="small" />
                <Typography variant="body1">{details.user_phone}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Active Services section ────────────────────────────────── */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <WorkIcon color="primary" /> My Active Services
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openRequestDialog}
            disabled={availableToRequest.length === 0}
            size="small"
          >
            Request New Service
          </Button>
        </Box>

        {details.services?.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", bgcolor: "grey.50" }}>
            <Typography color="text.secondary">
              You haven't been approved for any services yet.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {details.services.map((svc) => (
              <Grid item xs={12} md={6} lg={4} key={svc.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderRadius: 2,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                      borderColor: "primary.light",
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {svc.service_name}
                      </Typography>
                      {svc.category_name && (
                        <Chip label={svc.category_name} size="small" variant="outlined" />
                      )}
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack spacing={1.5}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                          <AttachMoneyIcon fontSize="small" />
                          <Typography variant="body2">Price</Typography>
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          ₹{svc.price}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                          <AccessTimeIcon fontSize="small" />
                          <Typography variant="body2">Experience</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                          {svc.experience_years} {svc.experience_years === 1 ? "year" : "years"}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* ── Pending/Rejected Requests section ──────────────────────── */}
      {requests.length > 0 && (
        <Box>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
          >
            <ScheduleIcon color="action" /> My Service Requests
          </Typography>

          <Stack spacing={2}>
            {requests.map((req) => (
              <Paper
                key={req.id}
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                  borderColor: req.status === "rejected" ? "error.light" : "divider",
                  bgcolor: req.status === "rejected" ? "error.50" : "transparent"
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {req.service_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Requested Price: ₹{req.price ?? "Default"} • Experience: {req.experience_years} yrs
                  </Typography>
                  {req.status === "rejected" && req.rejection_reason && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      <strong>Reason:</strong> {req.rejection_reason}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Chip
                    label={req.status.toUpperCase()}
                    color={
                      req.status === "pending"
                        ? "warning"
                        : req.status === "approved"
                        ? "success"
                        : "error"
                    }
                    size="small"
                  />
                  {req.status === "pending" && (
                    <Tooltip title="Cancel Request">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleCancelRequest(req.id)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {/* ── Request Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Request New Service</DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <Alert severity="info" sx={{ mb: 1 }}>
            Adding a new service requires administrator approval.
          </Alert>

          {/* Service picker */}
          <TextField
            select
            label="Service"
            value={form.service}
            onChange={handleFormChange("service")}
            fullWidth
            required
            size="small"
          >
            {availableToRequest.length === 0 ? (
              <MenuItem disabled value="">
                No new services available
              </MenuItem>
            ) : (
              availableToRequest.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                  {s.category ? ` — ${s.category_name ?? s.category}` : ""}
                </MenuItem>
              ))
            )}
          </TextField>

          {/* Price */}
          <TextField
            label="Your Requested Price (₹)"
            type="number"
            value={form.price}
            onChange={handleFormChange("price")}
            fullWidth
            size="small"
            helperText="Leave blank to use the default service price"
            inputProps={{ min: 0, step: 0.01 }}
          />

          {/* Experience */}
          <TextField
            label="Years of Experience"
            type="number"
            value={form.experience_years}
            onChange={handleFormChange("experience_years")}
            fullWidth
            size="small"
            inputProps={{ min: 0, step: 1 }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmitRequest} disabled={saving}>
            {saving ? "Submitting…" : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ─────────────────────────────────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Bio;
