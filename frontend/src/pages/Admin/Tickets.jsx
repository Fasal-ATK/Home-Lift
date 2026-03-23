import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, Stack, Chip, Divider,
  TextField, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Avatar, Collapse, IconButton, Tabs, Tab,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import api from "../../API/apiConfig";
import apiEndpoints from "../../API/apiEndpoints";
import { ShowToast } from "../../components/common/Toast";

const STATUS_COLOR = { open: "warning", resolved: "success", closed: "default" };
const TYPES = [
  { value: "", label: "All Types" },
  { value: "feature",  label: "Feature Request" },
  { value: "service",  label: "Service Report" },
  { value: "provider", label: "Provider Issue" },
  { value: "general",  label: "General / Other" },
];

const typeLabel = (v) => TYPES.find(t => t.value === v)?.label || v;

export default function AdminTickets() {
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [expanded, setExpanded]   = useState({});
  const [replyText, setReplyText] = useState({});
  const [replyStatus, setReplyStatus] = useState({});
  const [saving, setSaving]       = useState({});

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter)   params.ticket_type = typeFilter;
      const { data } = await api.get(apiEndpoints.tickets.adminList, { params });
      setTickets(data);
    } catch {
      ShowToast("Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [statusFilter, typeFilter]);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const handleReply = async (id) => {
    setSaving(s => ({ ...s, [id]: true }));
    try {
      await api.patch(apiEndpoints.tickets.adminReply(id), {
        admin_reply: replyText[id] || "",
        status: replyStatus[id] || "resolved",
      });
      ShowToast("Reply sent!", "success");
      fetchTickets();
    } catch {
      ShowToast("Failed to send reply", "error");
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  };

  const openCount   = tickets.filter(t => t.status === "open").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={4}>
        <SupportAgentIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">Support Tickets</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and respond to user & provider reports
          </Typography>
        </Box>
        <Box sx={{ ml: "auto", display: "flex", gap: 2 }}>
          <Paper elevation={0} sx={{ px: 2.5, py: 1.2, border: "1px solid #ffcc02", borderRadius: 3, textAlign: "center" }}>
            <Typography variant="h6" fontWeight="bold" color="warning.dark">{openCount}</Typography>
            <Typography variant="caption" color="text.secondary">Open</Typography>
          </Paper>
          <Paper elevation={0} sx={{ px: 2.5, py: 1.2, border: "1px solid #4caf50", borderRadius: 3, textAlign: "center" }}>
            <Typography variant="h6" fontWeight="bold" color="success.dark">{resolvedCount}</Typography>
            <Typography variant="caption" color="text.secondary">Resolved</Typography>
          </Paper>
        </Box>
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            {TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {/* Ticket List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : tickets.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px dashed #ccc" }}>
          <Typography color="text.secondary">No tickets match the current filters.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {tickets.map((t) => (
            <Paper key={t.id} elevation={1} sx={{ borderRadius: 3, border: "1px solid #e0e0e0", overflow: "hidden" }}>
              {/* Card Header */}
              <Box
                sx={{ p: 2.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}
                onClick={() => toggle(t.id)}
              >
                <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark", width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
                  {(t.user_name || "?")[0].toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} mb={0.4} flexWrap="wrap" alignItems="center">
                    <Chip label={t.status} size="small" color={STATUS_COLOR[t.status] || "default"} />
                    <Chip label={typeLabel(t.ticket_type)} size="small" variant="outlined" />
                    <Typography variant="caption" color="text.disabled">#{t.id}</Typography>
                  </Stack>
                  <Typography fontWeight="bold" lineHeight={1.3}>{t.subject}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.user_name} ({t.user_email}) · {new Date(t.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </Typography>
                </Box>
                <IconButton size="small">{expanded[t.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
              </Box>

              <Collapse in={!!expanded[t.id]}>
                <Divider />
                <Box sx={{ p: 2.5 }}>
                  {/* User description */}
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.8}>
                    User's Report
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 2.5 }}>
                    {t.description}
                  </Typography>

                  {/* Previous admin reply */}
                  {t.admin_reply && (
                    <Box sx={{ bgcolor: "#f0f4ff", border: "1px solid #c5d5ff", borderRadius: 2, p: 2, mb: 2.5 }}>
                      <Typography variant="caption" fontWeight="bold" color="primary.main">Previous Reply</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>{t.admin_reply}</Typography>
                    </Box>
                  )}

                  {/* Reply form */}
                  <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1}>
                    {t.admin_reply ? "Update Reply" : "Write Reply"}
                  </Typography>
                  <TextField
                    fullWidth multiline rows={3} size="small"
                    placeholder="Write your reply to the user..."
                    defaultValue={t.admin_reply || ""}
                    onChange={(e) => setReplyText(r => ({ ...r, [t.id]: e.target.value }))}
                    sx={{ mb: 1.5 }}
                  />
                  <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Set Status</InputLabel>
                      <Select
                        label="Set Status"
                        defaultValue={t.status === "open" ? "resolved" : t.status}
                        onChange={(e) => setReplyStatus(r => ({ ...r, [t.id]: e.target.value }))}
                      >
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleReply(t.id)}
                      disabled={saving[t.id]}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                    >
                      {saving[t.id] ? <CircularProgress size={18} color="inherit" /> : "Send Reply"}
                    </Button>
                  </Stack>
                </Box>
              </Collapse>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
