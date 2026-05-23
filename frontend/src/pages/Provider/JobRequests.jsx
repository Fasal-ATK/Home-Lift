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
import MapIcon from "@mui/icons-material/Map";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/common/Loader";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  fetchProviderJobs,

  fetchMyAppointments,
  acceptJob,
  jobsSelectors,
  selectProviderLoading,
  selectProviderTotalCount,
  selectAcceptingIds,
  selectMyAppointments,
} from '../../redux/slices/provider/providerJobSlice';
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function ProviderRequestsWithServices() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // selectors
  const jobs = useSelector((s) => jobsSelectors.selectAll(s)) || [];
  const loading = useSelector(selectProviderLoading);
  const acceptingIds = useSelector(selectAcceptingIds);
  const totalItems = useSelector(selectProviderTotalCount);

  // Local UI state
  const [search, setSearch] = useState("");
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 20; // Matches backend LargeResultsSetPagination default

  // Local selected service
  const [selectedService, setSelectedService] = useState("All Services");

  const myAppointments = useSelector(selectMyAppointments) || [];

  // Fetch jobs on mount/update
  useEffect(() => {
    // Pass page and filters to fetchProviderJobs action
    dispatch(fetchProviderJobs({
      page,
      search,
      service: selectedService
    }));
    dispatch(fetchMyAppointments());
  }, [dispatch, page, selectedService, search]);

  // Helper to check for overlaps
  const checkOverlap = (booking) => {
    if (!booking.booking_date || !booking.booking_time) return false;

    // Default duration to 60 minutes if backend doesn't provide it
    const durationMins = booking.service_duration || 60;

    // Create Date objects for the incoming booking
    const bStart = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const bEnd = new Date(bStart.getTime() + durationMins * 60000);

    return myAppointments.some(mine => {
      if (!mine.booking_date || !mine.booking_time || mine.id === booking.id) return false;
      if (!["confirmed", "in_progress"].includes(mine.status)) return false;

      // Only check the same day to save processing
      if (mine.booking_date !== booking.booking_date) return false;

      const mDuration = mine.service_duration || 60;
      const mStart = new Date(`${mine.booking_date}T${mine.booking_time}`);
      const mEnd = new Date(mStart.getTime() + mDuration * 60000);

      // Overlap condition: start of new is before end of old AND end of new is after start of old
      return bStart < mEnd && bEnd > mStart;
    });
  };

  // derive service list from jobs - NOTE: This only works for loaded jobs now. 
  // Ideally should fetch distinct services from backend. 
  // For now keeping client side derivation but it will only show services present in current page.
  const serviceList = useMemo(() => {
    // We can hardcode specific services if needed or accept this limitation for now
    // Or better, fetching services implies we should have a provider details call
    const arr = (jobs || []).map((d) => d.service_name || d.service?.name || "Service");
    const uniq = Array.from(new Set(arr));
    return ["All Services", ...uniq];
  }, [jobs]);

  // Server-side filtered data is in 'jobs'
  const paginated = jobs;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  // helpers
  const isAccepting = (id) => acceptingIds.map(String).includes(String(id));

  // handlers
  const handleAccept = async (id) => {
    try {
      const resultAction = await dispatch(acceptJob(Number(id)));
      if (acceptJob.fulfilled.match(resultAction)) {
        setSnack({ open: true, message: `Job #${id} accepted successfully!`, severity: "success" });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        const errorMsg = resultAction.payload?.error || resultAction.payload?.message || (typeof resultAction.payload === 'string' ? resultAction.payload : "Failed to accept job");
        setSnack({ open: true, message: errorMsg, severity: "error" });
      }
    } catch (err) {
      setSnack({ open: true, message: err?.message || "Failed to accept job", severity: "error" });
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
            width: { xs: "100%", md: 260 },
            bgcolor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid #eef2f6",
            p: 2,
            borderRadius: 4,
            minHeight: 420,
            boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
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
                    mb: 1.5,
                    borderRadius: 3,
                    bgcolor: active ? "#101828" : "transparent",
                    color: active ? "#cddc39" : "text.primary",
                    px: 2,
                    py: 1.5,
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: active ? "#101828" : "rgba(0,0,0,0.04)" },
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
            {/* <ListItemButton onClick={() => alert("Feature: show analytics")} sx={{ mt: 1, borderRadius: 1 }}>
              <ListItemText primary="Analytics" />
            </ListItemButton> */}
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
                    <SearchIcon fontSize="small" sx={{ color: '#101828' }}/>
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
              sx={{ 
                width: { xs: '100%', sm: 360 }, 
                bgcolor: '#fff', 
                borderRadius: 3,
                '& .MuiOutlinedInput-root': { borderRadius: 3 }
              }}
            />
          </Stack>

          <Paper elevation={0} sx={{ p: 3, minHeight: 420, bgcolor: "transparent" }}>
            {loading ? (
              <Loader message="Fetching available join requests..." sx={{ py: 6 }} />
            ) : paginated.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography>No job requests found.</Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {paginated.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <Paper
                      sx={{
                        p: 3,
                        bgcolor: "#ffffff",
                        borderRadius: 4,
                        display: "flex",
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'flex-start', md: "center" },
                        justifyContent: "space-between",
                        border: "1px solid #eef2f6",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        gap: 2,
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
                          borderColor: "primary.light"
                        }
                      }}
                      elevation={0}
                    >
                      <Stack direction="row" spacing={2.5} alignItems="flex-start" sx={{ flex: 1 }}>
                        <Avatar sx={{ bgcolor: "#101828", color: "#cddc39", width: 56, height: 56, fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                          {(r.customer_name || (r.user && r.user.username) || "U").charAt(0).toUpperCase()}
                        </Avatar>

                        <Box>
                          <Typography variant="h6" fontWeight={800} sx={{ color: '#101828' }}>
                            {r.customer_name || (r.user && r.user.username)}
                            <Typography component="span" variant="body2" sx={{ ml: 1, px: 1.5, py: 0.5, bgcolor: 'primary.50', color: 'primary.700', borderRadius: 4, fontWeight: 700 }}>
                              {r.service_name || r.service?.name}
                            </Typography>
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                               <MapIcon fontSize="small" sx={{ opacity: 0.7 }}/> {(r.city || r.address?.city) || "—"}
                            </Box>
                            • 
                            <Box component="span" sx={{ fontWeight: 600, color: '#101828' }}>
                               {r.booking_date} {r.booking_time && `at ${r.booking_time}`}
                            </Box>
                            • 
                            <Box component="span" sx={{ fontWeight: 800, color: '#2e7d32' }}>
                               ₹{r.price}
                            </Box>
                          </Typography>

                          {(r.address || r.city) && (
                            <Box sx={{ mt: 1.5 }}>
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<MapIcon fontSize="small" />}
                                sx={{ textTransform: "none", fontSize: "0.85rem", fontWeight: 700, p: 0, minWidth: 'auto', "&:hover": { bgcolor: 'transparent', textDecoration: 'underline' } }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const lat = r.address?.latitude;
                                  const lng = r.address?.longitude;
                                  const url =
                                    lat && lng
                                      ? `https://www.google.com/maps?q=${lat},${lng}`
                                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                          r.address?.address_line 
                                            ? `${r.address.address_line}, ${r.address.city}, ${r.address.state || ''} ${r.address.postal_code || ''}`
                                            : (typeof r.address === 'string' ? r.address : r.city)
                                        )}`;
                                  window.open(url, "_blank", "noopener,noreferrer");
                                }}
                              >
                                {r.address?.latitude && r.address?.longitude ? "Open in Maps" : "Search in Maps"}
                              </Button>
                            </Box>
                          )}

                          {r.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: "block", mt: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, fontStyle: 'italic' }}>
                              "{r.notes}"
                            </Typography>
                          )}

                          {checkOverlap(r) && (
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1.5, color: "error.main", bgcolor: 'error.50', px: 1, py: 0.5, borderRadius: 2, display: 'inline-flex' }}>
                              <WarningAmberIcon sx={{ fontSize: 18 }} />
                              <Typography variant="caption" fontWeight={700}>
                                Schedule Conflict Detected
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1.5} sx={{ mt: { xs: 2, md: 0 }, width: { xs: '100%', md: 'auto' } }}>
                        <Button
                          variant="outlined"
                          size="medium"
                          onClick={() => handleView(r)}
                          sx={{
                            flex: { xs: 1, md: 'none' },
                            borderColor: "#101828",
                            color: "#101828",
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 3,
                            "&:hover": { bgcolor: "#f8fafc", borderColor: "#101828" },
                          }}
                        >
                          Details
                        </Button>

                      <Button
                        variant="contained"
                        size="medium"
                        onClick={() => handleAccept(r.id)}
                        disabled={isAccepting(r.id)}
                        sx={{ 
                          flex: { xs: 1, md: 'none' },
                          bgcolor: "#cddc39", 
                          color: "#101828", 
                          fontWeight: 800,
                          borderRadius: 3,
                          textTransform: "none",
                          "&:hover": { bgcolor: "#d4e157", transform: 'scale(1.05)' },
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 14px rgba(205, 220, 57, 0.4)'
                        }}
                      >
                        {isAccepting(r.id) ? <CircularProgress size={20} color="inherit" /> : "Accept Request"}
                      </Button>
                    </Stack>
                  </Paper>
                </motion.div>
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

