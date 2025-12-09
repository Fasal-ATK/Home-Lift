// src/pages/provider/JobRequests.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  Pagination,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProviderJobs,
  fetchPendingJobs,
  acceptJob,
  jobsSelectors,
  selectProviderLoading,
  selectAcceptingIds,
} from '../../redux/slices/provider/providerJobSlice';

export default function ProviderRequestsWithServices() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // selectors
  const jobs = useSelector((s) => jobsSelectors.selectAll(s)) || [];
  const loading = useSelector(selectProviderLoading);
  const acceptingIds = useSelector(selectAcceptingIds);

  // Local UI state
  const [search, setSearch] = useState("");
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 5;

  // Local selected service
  const [selectedService, setSelectedService] = useState("All Services");

  // Fetch jobs on mount
  useEffect(() => {
    dispatch(fetchProviderJobs());
    dispatch(fetchPendingJobs());
  }, [dispatch]);

  // derive service list from jobs
  const serviceList = useMemo(() => {
    const arr = (jobs || []).map((d) => d.service_name || d.service?.name || "Service");
    const uniq = Array.from(new Set(arr));
    return ["All Services", ...uniq];
  }, [jobs]);

  // Filter by search + selected service
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    const list = jobs || [];
    return list.filter((r) => {
      const customerName = (r.customer_name || r.user_name || r.user?.name || "").toString().toLowerCase();
      const serviceName = (r.service_name || r.service?.name || "").toString().toLowerCase();
      const city = (r.city || r.address?.city || "").toString().toLowerCase();
      const matchesSearch =
        !q ||
        customerName.includes(q) ||
        serviceName.includes(q) ||
        city.includes(q) ||
        String(r.id).includes(q);

      const matchesService = selectedService === "All Services" || (r.service_name || r.service?.name) === selectedService;
      return matchesSearch && matchesService;
    });
  }, [jobs, search, selectedService]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // helpers
  const isAccepting = (id) => acceptingIds.map(String).includes(String(id));

  // handlers
  const handleAccept = async (id) => {
    try {
      const resultAction = await dispatch(acceptJob(Number(id)));
      if (acceptJob.fulfilled.match(resultAction)) {
        setSnack({ open: true, message: `Job #${id} accepted successfully!`, severity: "success" });
      } else {
        setSnack({ open: true, message: resultAction.payload || "Failed to accept job", severity: "error" });
      }
    } catch (err) {
      setSnack({ open: true, message: err.message || "Failed to accept job", severity: "error" });
    }
  };

  // navigate and pass booking to avoid refetch
  const handleView = (booking) => {
    navigate(`details/${booking.id}`, { state: { booking } });
  };

  const handleCloseSnack = () => setSnack((s) => ({ ...s, open: false }));

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* Sidebar */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: "100%", md: 240 },
            bgcolor: "#f5f5f5",
            p: 1,
            borderRadius: 2,
            minHeight: 420,
          }}
        >
          <List disablePadding>
            <Typography sx={{ fontWeight: 700, mb: 1, px: 1 }}>Services</Typography>

            {serviceList.map((svc) => {
              const active = svc === selectedService;
              return (
                <ListItemButton
                  key={svc}
                  onClick={() => {
                    setSelectedService(svc);
                    setPage(1);
                  }}
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: active ? "#e9f500" : "#fff",
                    px: 2,
                    py: 1,
                    boxShadow: active ? "0 0 0 2px rgba(230,245,0,0.12)" : "none",
                    "&:hover": { bgcolor: active ? "#e9f500" : "#fafafa" },
                  }}
                >
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 700, fontSize: 14 }}>{svc}</Typography>}
                    secondary={
                      svc !== "All Services" ? (
                        <Typography variant="caption" color="text.secondary">
                          {(jobs || []).filter((r) => (r.service_name || r.service?.name) === svc).length} requests
                        </Typography>
                      ) : null
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ fontWeight: 600, px: 1, color: "text.secondary" }}>
            Quick Filters
          </Typography>
          <List disablePadding>
            <ListItemButton
              onClick={() => {
                setSelectedService("All Services");
                setPage(1);
              }}
              sx={{ mt: 1, borderRadius: 1 }}
            >
              <ListItemText primary="All Requests" />
            </ListItemButton>
            <ListItemButton onClick={() => alert("Feature: show analytics")} sx={{ mt: 1, borderRadius: 1 }}>
              <ListItemText primary="Analytics" />
            </ListItemButton>
          </List>
        </Paper>

        {/* Right: list */}
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {selectedService === "All Services" ? "Job Requests" : selectedService}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedService === "All Services"
                  ? "Review and accept available job requests."
                  : `Requests for ${selectedService}`}
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search by name, service or city"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch("")}>
                      ×
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ width: 360 }}
            />
          </Stack>

          <Paper sx={{ p: 2, minHeight: 420 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : paginated.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography>No job requests found.</Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {paginated.map((r) => (
                  <Paper
                    key={r.id}
                    sx={{
                      p: 2,
                      bgcolor: "#fafafa",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    elevation={0}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                      <Avatar sx={{ bgcolor: "primary.light", width: 48, height: 48 }}>
                        {(r.customer_name || (r.user && r.user.username) || "U").charAt(0)}
                      </Avatar>

                      <Box>
                        <Typography fontWeight={700}>
                          {r.customer_name || (r.user && r.user.username)} —{" "}
                          <Typography component="span" variant="body2" color="text.secondary">
                            {r.service_name || r.service?.name}
                          </Typography>
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {(r.city || r.address?.city) || "—"} • {r.booking_date} {r.booking_time && `• ${r.booking_time}`} • ₹{r.price}
                        </Typography>

                        {r.notes && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                            Summary: {r.notes}
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleView(r)}
                        sx={{
                          bgcolor: "#eede2b",
                          color: "#000",
                          textTransform: "none",
                          fontWeight: 700,
                          "&:hover": { bgcolor: "#e6d31a" },
                        }}
                      >
                        View Details
                      </Button>

                      <Button
                        variant="outlined"
                        size="small"
                        color="success"
                        onClick={() => handleAccept(r.id)}
                        disabled={isAccepting(r.id)}
                        sx={{ textTransform: "none" }}
                      >
                        {isAccepting(r.id) ? <CircularProgress size={18} /> : "Accept"}
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}

            {/* Pagination */}
            {paginated.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, val) => setPage(val)}
                  color="primary"
                />
              </Box>
            )}
          </Paper>
        </Box>
      </Stack>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={handleCloseSnack}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
