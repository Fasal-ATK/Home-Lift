import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Chip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, Stack, Snackbar,
  IconButton, Tooltip, CircularProgress, Container, Avatar, Divider,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { fetchWallet, withdrawWalletThunk } from "../../redux/slices/walletSlice";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import DownloadIcon from "@mui/icons-material/Download";
import PaymentIcon from "@mui/icons-material/Payment";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import NorthIcon from "@mui/icons-material/North";
import SouthIcon from "@mui/icons-material/South";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

// ─── animations ──────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 30px rgba(205,220,57,0.15); }
  50%       { box-shadow: 0 0 60px rgba(205,220,57,0.3); }
`;

// ─── styled ──────────────────────────────────────────────────────────────────
const BalanceCard = styled(Paper)(() => ({
  background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  borderRadius: 24,
  padding: "36px 32px",
  position: "relative",
  overflow: "hidden",
  animation: `${fadeUp} 0.5s ease both, ${glow} 4s ease-in-out infinite`,
  border: "1px solid rgba(205,220,57,0.2)",
  "&::before": {
    content: '""',
    position: "absolute",
    top: -60, right: -60,
    width: 220, height: 220,
    borderRadius: "50%",
    background: "rgba(205,220,57,0.07)",
    pointerEvents: "none",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: -40, left: -40,
    width: 160, height: 160,
    borderRadius: "50%",
    background: "rgba(99,102,241,0.08)",
    pointerEvents: "none",
  },
}));

const PayoutCard = styled(Paper)(() => ({
  borderRadius: 24,
  padding: "32px",
  border: "1px solid #e8ecf0",
  background: "#fff",
  animation: `${fadeUp} 0.5s ease 0.1s both`,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
}));

const TxRow = styled(Box)(({ txtype }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 20px",
  borderRadius: 16,
  transition: "background 0.2s",
  "&:hover": {
    background: txtype === "credit" ? "#f0fdf4" : "#fff5f5",
  },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const formatAmount = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── component ───────────────────────────────────────────────────────────────
const ProviderWallet = () => {
  const dispatch = useDispatch();
  const { balance, recentTransactions, loading, withdrawLoading, error: walletError } =
    useSelector((state) => state.wallet);

  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount]         = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => { dispatch(fetchWallet("provider")); }, [dispatch]);

  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      showSnack("Please enter a valid amount.", "error");
      return;
    }
    const result = await dispatch(withdrawWalletThunk(withdrawAmount));
    if (withdrawWalletThunk.fulfilled.match(result)) {
      showSnack("Withdrawal processed successfully.");
      setWithdrawDialogOpen(false);
      setWithdrawAmount("");
    } else {
      showSnack(result.payload || "Withdrawal failed.", "error");
    }
  };

  // Stats
  const credits = (recentTransactions || []).filter((t) => t.transaction_type === "credit");
  const debits  = (recentTransactions || []).filter((t) => t.transaction_type === "debit");
  const totalIn = credits.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalOut= debits.reduce((s,  t) => s + parseFloat(t.amount || 0), 0);

  if (loading && !balance) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
        <CircularProgress sx={{ color: "#6366f1" }} thickness={4} />
        <Typography variant="body2" color="text.secondary">Loading wallet…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fc", py: 4 }}>
      <Container maxWidth="lg">
        {/* ── Page header ─────────────────────────────────────────── */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a" letterSpacing="-0.5px">
              Earnings & Wallet
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Manage your finances and withdraw your hard-earned payouts
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => setWithdrawDialogOpen(true)}
            disabled={!balance || parseFloat(balance) <= 0}
            sx={{
              background: "linear-gradient(135deg, #cddc39, #d4e157)",
              color: "#1a2400",
              fontWeight: 800,
              borderRadius: 3,
              textTransform: "none",
              px: 3,
              py: 1.4,
              boxShadow: "0 6px 20px rgba(205,220,57,0.4)",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 10px 28px rgba(205,220,57,0.5)" },
              transition: "all 0.2s",
            }}
          >
            Withdraw Funds
          </Button>
        </Stack>

        {/* ── Balance + Payout cards ───────────────────────────────── */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 4 }}>
          {/* Balance Card */}
          <BalanceCard elevation={0}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#cddc39" }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 26, color: "#1a2400" }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: "rgba(255,255,255,0.6)" }}>
                Current Balance
              </Typography>
            </Stack>

            <Typography variant="h2" fontWeight={900} color="#fff" letterSpacing="-2px" mb={1}>
              ₹{formatAmount(balance)}
            </Typography>

            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ color: "rgba(255,255,255,0.45)", mt: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: "#4ade80" }} />
              <Typography variant="body2" sx={{ color: "#4ade80", fontWeight: 600 }}>
                Available for withdrawal
              </Typography>
            </Stack>

            {/* Mini stats */}
            <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(255,255,255,0.1)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Total In</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#4ade80">+₹{formatAmount(totalIn)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Total Out</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#f87171">−₹{formatAmount(totalOut)}</Typography>
              </Box>
            </Box>
          </BalanceCard>

          {/* Payout Card */}
          <PayoutCard elevation={0}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f1f5f9" }}>
                  <PaymentIcon sx={{ fontSize: 26, color: "#475569" }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>Payout Method</Typography>
              </Stack>

              <Box sx={{ p: 2.5, bgcolor: "#f8fafc", borderRadius: 3, mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>Automatic Payouts</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.3}>
                      Funds processed automatically to your bank.
                    </Typography>
                  </Box>
                  <Chip label="Active" size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700 }} />
                </Stack>
              </Box>

              <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                Withdrawals are processed within 3-5 business days. Platform retains a{" "}
                <Box component="span" fontWeight={700}>7% commission</Box>{" "}
                (max ₹500) per job.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              onClick={() => setWithdrawDialogOpen(true)}
              disabled={!balance || parseFloat(balance) <= 0}
              sx={{
                mt: 3,
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 700,
                borderColor: "#6366f1",
                color: "#6366f1",
                "&:hover": { bgcolor: "#ede9fe", borderColor: "#6366f1" },
              }}
            >
              Initiate Withdrawal
            </Button>
          </PayoutCard>
        </Box>

        {/* ── Transactions ─────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e8ecf0", overflow: "hidden" }}>
          {/* Header */}
          <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9" }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <ReceiptLongIcon sx={{ color: "#6366f1" }} />
              <Typography variant="h6" fontWeight={800} color="#0f172a">Transaction History</Typography>
              <Tooltip title="Credits = earnings from jobs. Debits = withdrawal requests.">
                <IconButton size="small"><InfoOutlinedIcon sx={{ fontSize: 16, color: "#94a3b8" }} /></IconButton>
              </Tooltip>
              {recentTransactions?.length > 0 && (
                <Chip
                  label={`${recentTransactions.length} transactions`}
                  size="small"
                  sx={{ bgcolor: "#ede9fe", color: "#6366f1", fontWeight: 700, ml: "auto !important" }}
                />
              )}
            </Stack>
          </Box>

          {/* Rows */}
          <Box sx={{ p: 2 }}>
            {!recentTransactions || recentTransactions.length === 0 ? (
              <Box sx={{ py: 8, textAlign: "center" }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 52, color: "#cbd5e1", mb: 1.5 }} />
                <Typography variant="h6" color="text.secondary" fontWeight={600}>No transactions yet</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Your earnings and withdrawals will appear here
                </Typography>
              </Box>
            ) : (
              <Stack spacing={0.5}>
                {recentTransactions.map((tx, idx) => {
                  const isCredit = tx.transaction_type === "credit";
                  return (
                    <TxRow key={tx.id} txtype={tx.transaction_type} sx={{ animationDelay: `${idx * 0.03}s` }}>
                      {/* Icon */}
                      <Stack direction="row" spacing={2} alignItems="center" flex={1} minWidth={0}>
                        <Avatar
                          sx={{
                            width: 40, height: 40,
                            bgcolor: isCredit ? "#dcfce7" : "#fee2e2",
                            flexShrink: 0,
                          }}
                        >
                          {isCredit
                            ? <NorthIcon sx={{ fontSize: 18, color: "#16a34a" }} />
                            : <SouthIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                          }
                        </Avatar>
                        <Box minWidth={0}>
                          <Typography variant="body2" fontWeight={700} noWrap color="#0f172a">
                            {tx.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(tx.created_at)}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Right side */}
                      <Stack alignItems="flex-end" spacing={0.5} flexShrink={0} ml={2}>
                        <Typography
                          variant="body1"
                          fontWeight={900}
                          color={isCredit ? "#16a34a" : "#ef4444"}
                        >
                          {isCredit ? "+" : "−"}₹{formatAmount(tx.amount)}
                        </Typography>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Chip
                            label={isCredit ? "Credit" : "Debit"}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 10,
                              fontWeight: 800,
                              bgcolor: isCredit ? "#dcfce7" : "#fee2e2",
                              color: isCredit ? "#16a34a" : "#ef4444",
                            }}
                          />
                          {tx.status && (
                            <Chip
                              label={tx.status}
                              size="small"
                              sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: "#f1f5f9", color: "#64748b" }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    </TxRow>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Paper>

        {/* ── Withdrawal Dialog ────────────────────────────────────── */}
        <Dialog
          open={withdrawDialogOpen}
          onClose={() => !withdrawLoading && setWithdrawDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
        >
          <Box sx={{ height: 4, background: "linear-gradient(90deg, #cddc39, #d4e157)" }} />

          <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 3, pb: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Withdraw Funds</Typography>
              <Typography variant="caption" color="text.secondary">Available: ₹{formatAmount(balance)}</Typography>
            </Box>
            <IconButton onClick={() => setWithdrawDialogOpen(false)} disabled={withdrawLoading} size="small">
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>
                  Amount to Withdraw (₹)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  placeholder="e.g. 500"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={withdrawLoading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      bgcolor: "#f8fafc",
                    },
                  }}
                />
              </Box>

              <Box sx={{ p: 2, bgcolor: "#fefce8", borderRadius: 3, border: "1px solid #fde68a" }}>
                <Typography variant="caption" color="#92400e" fontWeight={600}>
                  ℹ️ Funds will be processed within 3-5 business days to your registered bank account.
                </Typography>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1, gap: 1, flexDirection: "column" }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => setTimeout(handleWithdraw, 500)}
              disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
              sx={{
                bgcolor: "#0f172a",
                color: "#fff",
                borderRadius: 3,
                py: 1.8,
                fontWeight: 800,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": { bgcolor: "#1e293b" },
                "&:disabled": { bgcolor: "#f1f5f9", color: "#94a3b8" },
              }}
            >
              {withdrawLoading ? <CircularProgress size={24} color="inherit" /> : "Confirm Withdrawal"}
            </Button>
            <Button
              onClick={() => setWithdrawDialogOpen(false)}
              disabled={withdrawLoading}
              fullWidth
              sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700, color: "#64748b" }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ─────────────────────────────────────────────── */}
        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.severity}
            variant="filled"
            sx={{ borderRadius: 3, fontWeight: 700 }}
          >
            {snack.msg}
          </Alert>
        </Snackbar>

        {walletError && (
          <Snackbar open={!!walletError} autoHideDuration={6000}>
            <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>{walletError}</Alert>
          </Snackbar>
        )}
      </Container>
    </Box>
  );
};

export default ProviderWallet;
