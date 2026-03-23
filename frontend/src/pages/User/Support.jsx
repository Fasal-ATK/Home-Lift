import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, Stack, Chip, Divider,
  TextField, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Collapse,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useLocation } from "react-router-dom";
import api from "../../API/apiConfig";
import apiEndpoints from "../../API/apiEndpoints";
import { ShowToast } from "../../components/common/Toast";

const STATUS_COLOR = { open: "warning", resolved: "success", closed: "default" };

const TYPES = [
  { value: "feature",  label: "Feature Request" },
  { value: "service",  label: "Service Report" },
  { value: "provider", label: "Provider Issue" },
  { value: "general",  label: "General / Other" },
];

export default function Support() {
  const routerLocation = useLocation();
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded]     = useState({});

  const [form, setForm] = useState({ subject: "", description: "", ticket_type: "general" });

  useEffect(() => {
    if (routerLocation.state?.prefill) {
      setForm(f => ({ 
        ...f, 
        subject: routerLocation.state.prefill, 
        ticket_type: routerLocation.state.type || "general" 
      }));
      setDialogOpen(true);
    }
  }, [routerLocation.state]);

  const fetchTickets = async () => {
    try {
      const { data } = await api.get(apiEndpoints.tickets.list);
      setTickets(data);
    } catch {
      ShowToast("Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      ShowToast("Subject and description are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(apiEndpoints.tickets.list, form);
      ShowToast("Ticket submitted successfully!", "success");
      setDialogOpen(false);
      setForm({ subject: "", description: "", ticket_type: "general" });
      fetchTickets();
    } catch {
      ShowToast("Failed to submit ticket", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 860, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <SupportAgentIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">Support & Feedback</Typography>
            <Typography variant="body2" color="text.secondary">
              Report issues, request features, or ask anything
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ borderRadius: 3, textTransform: "none", fontWeight: 600 }}
        >
          New Ticket
        </Button>
      </Stack>

      {/* Tickets */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : tickets.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px dashed #ccc" }}>
          <SupportAgentIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary">No tickets yet</Typography>
          <Typography variant="body2" color="text.disabled">Submit a ticket above to get help from our team.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {tickets.map((t) => (
            <Paper
              key={t.id}
              elevation={1}
              sx={{ borderRadius: 3, border: "1px solid #e0e0e0", overflow: "hidden" }}
            >
              <Box
                sx={{ p: 2.5, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => toggle(t.id)}
              >
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" mb={0.5}>
                    <Chip label={t.status} size="small" color={STATUS_COLOR[t.status] || "default"} />
                    <Chip label={TYPES.find(x => x.value === t.ticket_type)?.label || t.ticket_type} size="small" variant="outlined" />
                    <Typography variant="caption" color="text.disabled">#{t.id}</Typography>
                  </Stack>
                  <Typography fontWeight="bold">{t.subject}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(t.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </Typography>
                </Box>
                <IconButton size="small">
                  {expanded[t.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={!!expanded[t.id]}>
                <Divider />
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1.5 }}>
                    {t.description}
                  </Typography>
                  {t.admin_reply && (
                    <Box sx={{ bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200", borderRadius: 2, p: 2, mt: 1 }}>
                      <Typography variant="caption" fontWeight="bold" color="primary.main">Admin Reply</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>{t.admin_reply}</Typography>
                    </Box>
                  )}
                  {!t.admin_reply && (
                    <Typography variant="caption" color="text.disabled">No reply yet. Our team will respond soon.</Typography>
                  )}
                </Box>
              </Collapse>
            </Paper>
          ))}
        </Stack>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: "bold", pb: 1 }}>Submit a New Ticket</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={form.ticket_type}
                onChange={(e) => setForm(f => ({ ...f, ticket_type: e.target.value }))}
              >
                {TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Subject"
              size="small"
              fullWidth
              value={form.subject}
              onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
              inputProps={{ maxLength: 255 }}
            />

            <TextField
              label="Describe your issue"
              multiline
              rows={5}
              fullWidth
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600 }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Submit Ticket"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
