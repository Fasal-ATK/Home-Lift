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
  Tooltip,
  Snackbar,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";
import { providerService, adminServiceManagementService } from "../../services/apiServices";
import ProviderRequestModal from "../../components/provider/ProviderRequestModal";

// ─── animations ──────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
  50%       { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
`;

// ─── styled ──────────────────────────────────────────────────────────────────
const HeroCard = styled(Box)(() => ({
  background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  borderRadius: 24,
  padding: "40px 36px",
  position: "relative",
  overflow: "hidden",
  animation: `${fadeUp} 0.5s ease both`,
  "&::before": {
    content: '""',
    position: "absolute",
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(99,102,241,0.12)",
    pointerEvents: "none",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: "50%",
    background: "rgba(167,139,250,0.08)",
    pointerEvents: "none",
  },
}));

const GlowAvatar = styled(Avatar)(() => ({
  width: 96,
  height: 96,
  fontSize: "2.2rem",
  fontWeight: 900,
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  boxShadow: "0 0 0 4px rgba(99,102,241,0.3), 0 8px 24px rgba(99,102,241,0.4)",
  animation: `${pulse} 3s ease-in-out infinite`,
  border: "3px solid rgba(255,255,255,0.15)",
}));

const StatBox = styled(Box)(({ color = "#6366f1" }) => ({
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: "16px 20px",
  textAlign: "center",
  transition: "transform 0.2s, background 0.2s",
  "&:hover": {
    transform: "translateY(-3px)",
    background: "rgba(255,255,255,0.1)",
  },
}));

const ServiceCard = styled(Card)(({ theme }) => ({
  border: "1px solid #e8ecf0",
  borderRadius: 20,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  background: "#fff",
  overflow: "visible",
  position: "relative",
  animation: `${fadeUp} 0.4s ease both`,
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: "0 20px 40px rgba(99,102,241,0.12)",
    borderColor: "#6366f1",
  },
}));

const PriceBadge = styled(Box)(() => ({
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "#fff",
  padding: "4px 14px",
  borderRadius: 40,
  fontWeight: 800,
  fontSize: "1rem",
  display: "inline-block",
}));

const RequestRow = styled(Paper)(({ status }) => ({
  padding: "18px 20px",
  borderRadius: 16,
  border: `1px solid ${
    status === "rejected" ? "#fecaca" : status === "approved" ? "#bbf7d0" : "#e8ecf0"
  }`,
  background:
    status === "rejected"
      ? "linear-gradient(135deg, #fff5f5, #fff)"
      : status === "approved"
      ? "linear-gradient(135deg, #f0fdf4, #fff)"
      : "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12,
  animation: `${fadeUp} 0.4s ease both`,
  transition: "box-shadow 0.2s",
  "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.06)" },
}));

// ─── status config ────────────────────────────────────────────────────────────
const statusConfig = {
  pending:  { color: "warning",  icon: <HourglassIcon sx={{ fontSize: 16 }} />,   label: "PENDING"  },
  approved: { color: "success",  icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, label: "APPROVED" },
  rejected: { color: "error",    icon: <CancelIcon sx={{ fontSize: 16 }} />,      label: "REJECTED" },
};

// ─── component ───────────────────────────────────────────────────────────────
function Bio() {
  const [details, setDetails] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editExperience, setEditExperience] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bioData, reqData] = await Promise.all([
        providerService.fetchDetails(),
        providerService.listMyServiceRequests(),
      ]);
      setDetails(bioData);
      setRequests(Array.isArray(reqData) ? reqData : reqData.results ?? []);
    } catch {
      setError("Unable to load profile details.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCatalogue = useCallback(async () => {
    try {
      const [svcData, catData] = await Promise.all([
        providerService.listAvailableServices(),
        adminServiceManagementService.getCategories(),
      ]);
      setCatalogue(Array.isArray(svcData) ? svcData : svcData.results ?? []);
      setCategories(Array.isArray(catData) ? catData : catData.results ?? []);
    } catch {}
  }, []);

  useEffect(() => { fetchData(); fetchCatalogue(); }, [fetchData, fetchCatalogue]);

  const openRequestDialog = () => { setFormError(""); setDialogOpen(true); };
  const closeDialog = () => { if (saving) return; setDialogOpen(false); };
  const handleSuccess = async (msg) => { showSnack(msg); await fetchData(); };

  const handleCancelRequest = async (reqId) => {
    if (!window.confirm("Cancel this pending request?")) return;
    try {
      await providerService.cancelServiceRequest(reqId);
      showSnack("Request cancelled.");
      await fetchData();
    } catch { showSnack("Failed to cancel request.", "error"); }
  };

  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const openEditDialog = (svc) => {
    setEditingService(svc);
    setEditPrice(svc.price);
    setEditExperience(svc.experience_years);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => { if (saving) return; setEditDialogOpen(false); setEditingService(null); };

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
    } catch { showSnack("Failed to update service.", "error"); }
    finally { setSaving(false); }
  };

  const handleDeleteService = async (svcId) => {
    if (!window.confirm("Remove this service from your profile?")) return;
    try {
      await providerService.deleteService(svcId);
      showSnack("Service removed.");
      await fetchData();
    } catch { showSnack("Failed to remove service.", "error"); }
  };

  const existingServiceIds = new Set([
    ...(details?.services ?? []).map((s) => s.service),
    ...requests.filter((r) => r.status === "pending").map((r) => r.service),
  ]);
  const availableToRequest = catalogue.filter((s) => !existingServiceIds.has(s.id));

  if (loading && !details) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: "#6366f1" }} />
          <Typography color="text.secondary" variant="body2">Loading your profile…</Typography>
        </Stack>
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

  const totalServices  = details?.services?.length ?? 0;
  const totalRequests  = requests.length;
  const totalExperience = details?.services?.reduce((s, v) => s + (v.experience_years || 0), 0) ?? 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fc", py: 4 }}>
      <Container maxWidth="lg">

        {/* ── Hero Header ─────────────────────────────────────────── */}
        <HeroCard sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <GlowAvatar>
                {details.user_name?.[0]?.toUpperCase() || "P"}
              </GlowAvatar>
            </Grid>

            <Grid item xs>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" mb={0.5}>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#fff", letterSpacing: "-0.5px" }}>
                  {details.user_name}
                </Typography>
                {details.is_active ? (
                  <Chip
                    icon={<VerifiedUserIcon sx={{ fontSize: 14, color: "#4ade80 !important" }} />}
                    label="Verified"
                    size="small"
                    sx={{ bgcolor: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", fontWeight: 700 }}
                  />
                ) : (
                  <Chip label="Pending" size="small" sx={{ bgcolor: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)", fontWeight: 700 }} />
                )}
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ color: "rgba(255,255,255,0.65)", mt: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{details.user_email}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{details.user_phone}</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openRequestDialog}
                disabled={availableToRequest.length === 0}
                sx={{
                  bgcolor: "#6366f1",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: 3,
                  textTransform: "none",
                  px: 3,
                  py: 1.2,
                  boxShadow: "0 4px 20px rgba(99,102,241,0.5)",
                  "&:hover": { bgcolor: "#4f46e5", transform: "translateY(-2px)" },
                  transition: "all 0.2s",
                }}
              >
                Request Service
              </Button>
            </Grid>
          </Grid>

          {/* Stats bar */}
          <Grid container spacing={2} sx={{ mt: 3 }}>
            {[
              { label: "Active Services", value: totalServices,    icon: <WorkIcon sx={{ color: "#a78bfa" }} /> },
              { label: "Service Requests", value: totalRequests,   icon: <ScheduleIcon sx={{ color: "#34d399" }} /> },
              { label: "Total Exp (yrs)", value: totalExperience,  icon: <TrendingUpIcon sx={{ color: "#f472b6" }} /> },
              { label: "Catalogue", value: catalogue.length,       icon: <CategoryIcon sx={{ color: "#fbbf24" }} /> },
            ].map(({ label, value, icon }) => (
              <Grid item xs={6} sm={3} key={label}>
                <StatBox>
                  <Box sx={{ mb: 0.5 }}>{icon}</Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color: "#fff" }}>{value}</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{label}</Typography>
                </StatBox>
              </Grid>
            ))}
          </Grid>
        </HeroCard>

        {/* ── Active Services ──────────────────────────────────────── */}
        <Box sx={{ mb: 5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", letterSpacing: "-0.3px" }}>
                My Active Services
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalServices} service{totalServices !== 1 ? "s" : ""} on your profile
              </Typography>
            </Box>
            <Chip
              icon={<StarIcon sx={{ fontSize: 14 }} />}
              label={`${totalServices} Active`}
              sx={{ bgcolor: "#ede9fe", color: "#6366f1", fontWeight: 700, px: 1 }}
            />
          </Stack>

          {details.services?.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                borderRadius: 4,
                border: "2px dashed #e2e8f0",
                bgcolor: "#f8f9fc",
              }}
            >
              <WorkIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>No services yet</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Request a service to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openRequestDialog}
                sx={{ mt: 3, bgcolor: "#6366f1", borderRadius: 3, textTransform: "none", fontWeight: 700 }}
              >
                Request First Service
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {details.services.map((svc, idx) => (
                <Grid item xs={12} sm={6} lg={4} key={svc.id}>
                  <ServiceCard elevation={0} sx={{ animationDelay: `${idx * 0.05}s` }}>
                    {/* Top accent bar */}
                    <Box sx={{ height: 4, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: "20px 20px 0 0" }} />

                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1, mr: 1 }}>
                          <Typography variant="h6" fontWeight={800} sx={{ color: "#0f172a", lineHeight: 1.3 }}>
                            {svc.service_name}
                          </Typography>
                          {svc.category_name && (
                            <Chip
                              label={svc.category_name}
                              size="small"
                              sx={{ mt: 0.5, bgcolor: "#ede9fe", color: "#6366f1", fontWeight: 600, fontSize: 11 }}
                            />
                          )}
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Edit Service">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(svc)}
                              sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#ede9fe", color: "#6366f1" } }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove Service">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteService(svc.id)}
                              sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#fee2e2", color: "#ef4444" } }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>

                      <Divider sx={{ my: 2 }} />

                      {/* Stats */}
                      <Stack spacing={1.5}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            <AttachMoneyIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>Price</Typography>
                          </Stack>
                          <PriceBadge>₹{svc.price}</PriceBadge>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            <AccessTimeIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>Experience</Typography>
                          </Stack>
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.4,
                              bgcolor: "#f0fdf4",
                              color: "#16a34a",
                              borderRadius: 10,
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {svc.experience_years} {svc.experience_years === 1 ? "yr" : "yrs"}
                          </Box>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </ServiceCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* ── Service Requests ─────────────────────────────────────── */}
        {requests.length > 0 && (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
              <ScheduleIcon sx={{ color: "#6366f1" }} />
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
                  My Service Requests
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track the status of your service applications
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2}>
              {requests.map((req) => {
                const cfg = statusConfig[req.status] || statusConfig.pending;
                return (
                  <RequestRow key={req.id} status={req.status} elevation={0}>
                    <Stack direction="row" spacing={2} alignItems="center" flex={1} flexWrap="wrap">
                      {/* Status dot */}
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor:
                            req.status === "approved" ? "#22c55e"
                            : req.status === "rejected" ? "#ef4444"
                            : "#f59e0b",
                          boxShadow:
                            req.status === "approved" ? "0 0 0 3px rgba(34,197,94,0.2)"
                            : req.status === "rejected" ? "0 0 0 3px rgba(239,68,68,0.2)"
                            : "0 0 0 3px rgba(245,158,11,0.2)",
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0f172a" }}>
                          {req.service_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Price: ₹{req.price ?? "Default"} &nbsp;•&nbsp; Experience: {req.experience_years} yrs
                        </Typography>
                        {req.status === "rejected" && req.rejection_reason && (
                          <Box
                            sx={{
                              mt: 1,
                              px: 1.5,
                              py: 0.8,
                              bgcolor: "#fee2e2",
                              borderRadius: 2,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Typography variant="caption" color="error" fontWeight={700}>
                              Reason: {req.rejection_reason}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Chip
                        icon={cfg.icon}
                        label={cfg.label}
                        color={cfg.color}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      {req.status === "pending" && (
                        <Tooltip title="Cancel Request">
                          <IconButton
                            size="small"
                            onClick={() => handleCancelRequest(req.id)}
                            sx={{ bgcolor: "#fee2e2", color: "#ef4444", "&:hover": { bgcolor: "#fecaca" } }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </RequestRow>
                );
              })}
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
        <Dialog
          open={editDialogOpen}
          onClose={closeEditDialog}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, pb: 0 }}>Update Service</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Modify details for <strong>{editingService?.service_name}</strong>
            </Typography>
            <Stack spacing={2.5}>
              <TextField
                label="Service Price (₹)"
                type="number"
                fullWidth
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                helperText="Leave empty for default price"
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
              <TextField
                label="Experience (Years)"
                type="number"
                fullWidth
                value={editExperience}
                onChange={(e) => setEditExperience(e.target.value)}
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
            <Button onClick={closeEditDialog} disabled={saving} sx={{ borderRadius: 3, textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateService}
              disabled={saving}
              sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700, bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
            >
              {saving ? <CircularProgress size={18} color="inherit" /> : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ─────────────────────────────────────────────── */}
        <Snackbar
          open={snack.open}
          autoHideDuration={3500}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.severity}
            variant="filled"
            sx={{ borderRadius: 3, fontWeight: 600 }}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default Bio;
