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
  Modal,
  FormControl,
  Select,
} from "@mui/material";
import { styled } from "@mui/material/styles";
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
  Remove as RemoveIcon,
  UploadFile as UploadFileIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { providerService, adminServiceManagementService } from "../../services/apiServices";
import ProviderRequestModal from "../../components/provider/ProviderRequestModal";

const StyledBox = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  width: 700,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 12,
  boxShadow: theme.shadows[10],
  padding: theme.spacing(4),
  maxHeight: '90vh',
  overflowY: 'auto',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

const FileButton = styled(Button)(({ theme }) => ({
  borderColor: theme.palette.primary.main,
  textTransform: 'none',
  minWidth: 180,
}));

// ─── main component ─────────────────────────────────────────────────────────
function Bio() {
  const [details, setDetails] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // catalogue of all active services and categories
  const [catalogue, setCatalogue] = useState([]);
  const [categories, setCategories] = useState([]);

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // snackbar
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // Edit Service State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editExperience, setEditExperience] = useState("");

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
      const [svcData, catData] = await Promise.all([
        providerService.listAvailableServices(),
        adminServiceManagementService.getCategories()
      ]);
      setCatalogue(Array.isArray(svcData) ? svcData : svcData.results ?? []);
      setCategories(Array.isArray(catData) ? catData : catData.results ?? []);
    } catch (err) {
      console.error("Failed to fetch catalogue/categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCatalogue();
  }, [fetchData, fetchCatalogue]);

  // ── dialog helpers ────────────────────────────────────────────────────────
  const openRequestDialog = () => {
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleSuccess = async (msg) => {
    showSnack(msg);
    await fetchData();
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

  // ── edit/delete service ──────────────────────────────────────────────────
  const openEditDialog = (svc) => {
    setEditingService(svc);
    setEditPrice(svc.price);
    setEditExperience(svc.experience_years);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    if (saving) return;
    setEditDialogOpen(false);
    setEditingService(null);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    setSaving(true);
    try {
      await providerService.updateService(editingService.id, {
        price: editPrice === "" ? null : editPrice,
        experience_years: editExperience || 0,
      });
      showSnack("Service updated successfully.");
      setEditDialogOpen(false);
      await fetchData();
    } catch (err) {
      showSnack("Failed to update service.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (svcId) => {
    if (!window.confirm("Remove this service from your profile? This cannot be undone easily.")) return;
    try {
      await providerService.deleteService(svcId);
      showSnack("Service removed.");
      await fetchData();
    } catch (err) {
      showSnack("Failed to remove service.", "error");
    }
  };

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
                    minHeight: 220,
                    height: "auto",
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "visible",
                    "&:hover": {
                      transform: "translateY(-8px) scale(1.05)",
                      boxShadow: 12,
                      borderColor: "primary.main",
                      zIndex: 10,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {svc.service_name}
                        </Typography>
                        {svc.category_name && (
                          <Chip label={svc.category_name} size="small" variant="outlined" />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit Service">
                           <IconButton size="small" onClick={() => openEditDialog(svc)}>
                              <EditIcon fontSize="small" />
                           </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Service">
                           <IconButton size="small" color="error" onClick={() => handleDeleteService(svc.id)}>
                              <DeleteIcon fontSize="small" />
                           </IconButton>
                        </Tooltip>
                      </Box>
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

      {/* ── Request Modal ─────────────────────────────────────────── */}
      <ProviderRequestModal 
        open={dialogOpen} 
        onClose={closeDialog} 
        categories={categories} 
        catalogue={availableToRequest} 
        onSuccess={handleSuccess} 
        onError={setFormError} 
      />

      {/* ── Edit Dialog ────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Update Service Details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Modify your service price and experience for <strong>{editingService?.service_name}</strong>.
          </Typography>
          
          <Stack spacing={3}>
            <TextField
              label="Service Price (₹)"
              type="number"
              fullWidth
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              helperText="Set custom price or leave empty for default"
              size="small"
            />
            <TextField
              label="Experience (Years)"
              type="number"
              fullWidth
              value={editExperience}
              onChange={(e) => setEditExperience(e.target.value)}
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={closeEditDialog} disabled={saving}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateService} 
            disabled={saving}
          >
            {saving ? "Updating..." : "Save Changes"}
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
