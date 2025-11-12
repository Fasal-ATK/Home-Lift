import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

const DEMO_DATA = [
  {
    id: 101,
    customer_name: "Devon Lane",
    service_name: "Vehicle Maintenance",
    city: "Bengaluru",
    date: "2025-11-12",
    time: "09:00 AM",
    price: 1200,
    notes: "Check AC and brakes",
  },
  {
    id: 102,
    customer_name: "Anna Roy",
    service_name: "AC Service",
    city: "Mumbai",
    date: "2025-11-13",
    time: "11:00 AM",
    price: 999,
    notes: "Gas refill and temperature check",
  },
  {
    id: 103,
    customer_name: "Ravi Kumar",
    service_name: "Home Cleaning",
    city: "Chennai",
    date: "2025-11-14",
    time: "02:30 PM",
    price: 2500,
    notes: "2BHK deep clean including windows",
  },
  {
    id: 104,
    customer_name: "Nisha Sharma",
    service_name: "Electrician Visit",
    city: "Delhi",
    date: "2025-11-15",
    time: "10:15 AM",
    price: 650,
    notes: "Check wiring in kitchen area",
  },
  {
    id: 105,
    customer_name: "Arjun Patel",
    service_name: "Plumbing Service",
    city: "Pune",
    date: "2025-11-15",
    time: "12:30 PM",
    price: 800,
    notes: "Fix bathroom leakage",
  },
  {
    id: 106,
    customer_name: "Kavita Menon",
    service_name: "Gardening",
    city: "Hyderabad",
    date: "2025-11-16",
    time: "09:45 AM",
    price: 1800,
    notes: "Trim hedges and lawn cleaning",
  },
];

export default function JobRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState(DEMO_DATA);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  const [page, setPage] = useState(1);
  const perPage = 5;

  const handleAccept = (id) => {
    setLoading(true);
    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setSnack({ open: true, message: `Job #${id} accepted successfully!`, severity: "success" });
      setLoading(false);
    }, 1000);
  };

  const handleView = (id) => {
    navigate(`/provider/job-requests/${id}`, { state: { id } });
  };

  const handleCloseSnack = () => setSnack({ ...snack, open: false });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.customer_name.toLowerCase().includes(q) ||
        r.service_name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }, [requests, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Job Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and accept available job requests.
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
          sx={{ width: 300 }}
        />
      </Stack>

      <Paper sx={{ p: 2 }}>
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
              <Paper key={r.id} sx={{ p: 2 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: "primary.light", width: 48, height: 48 }}>
                      {r.customer_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700}>
                        {r.customer_name} —{" "}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {r.service_name}
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {r.city} • {r.date} {r.time && `• ${r.time}`} • ₹{r.price}
                      </Typography>
                      {r.notes && (
                        <Typography variant="caption" color="text.secondary">
                          Notes: {r.notes}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleView(r.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="success"
                      onClick={() => handleAccept(r.id)}
                      disabled={loading}
                    >
                      Accept
                    </Button>
                  </Stack>
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
