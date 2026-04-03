import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Stack,
  FormControl,
  Select,
  MenuItem
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import api from "../../API/apiConfig";
import apiEndpoints from "../../API/apiEndpoints";
import { toast } from "react-toastify";

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const url = apiEndpoints.wallet.adminWithdrawals + (statusFilter !== "all" ? `?status=${statusFilter}` : "");
      const res = await api.get(url);
      setWithdrawals(res.data);
    } catch (err) {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const handleAction = async (id, action) => {
    // action is 'approve' or 'reject'
    if (!window.confirm(`Are you sure you want to ${action} this withdrawal?`)) return;

    try {
      const res = await api.patch(apiEndpoints.wallet.adminWithdrawalAction(id), { action });
      toast.success(`Withdrawal ${action}d successfully`);
      // Update local state
      setWithdrawals(prev => prev.map(w => w.id === id ? res.data : w));
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to ${action} withdrawal`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Withdrawal Requests
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ bgcolor: '#fff', borderRadius: 2 }}
          >
            <MenuItem value="all">All Withdrawals</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="failed">Failed / Rejected</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e0e0e0", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Provider</b></TableCell>
                <TableCell><b>Amount</b></TableCell>
                <TableCell><b>Date</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell align="center"><b>Action</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No withdrawal requests found.
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals.map((w) => (
                  <TableRow key={w.id} hover>
                    <TableCell>#{w.id}</TableCell>
                    <TableCell>{w.provider_email || `User ${w.provider}`}</TableCell>
                    <TableCell fontWeight="bold">₹{w.amount}</TableCell>
                    <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={w.status.toUpperCase()}
                        color={
                          w.status === "completed" ? "success" :
                          w.status === "failed" ? "error" : "warning"
                        }
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {w.status === 'pending' ? (
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => handleAction(w.id, 'approve')}
                            sx={{ boxShadow: 0, textTransform: 'none' }}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            startIcon={<Cancel />}
                            onClick={() => handleAction(w.id, 'reject')}
                            sx={{ textTransform: 'none' }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {w.status === 'completed' ? `Txn: ${w.stripe_transfer_id || 'N/A'}` : 'Refunded'}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
