import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  Container,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  Snackbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet, withdrawWalletThunk } from '../../redux/slices/walletSlice';
import { providerService } from '../../services/apiServices';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DownloadIcon from '@mui/icons-material/Download';
import PaymentIcon from '@mui/icons-material/Payment';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const ProviderWallet = () => {
  const dispatch = useDispatch();
  const { balance, recentTransactions, loading, withdrawLoading, error: walletError } = useSelector((state) => state.wallet);
  
  const [providerDetails, setProviderDetails] = useState(null);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [stripeAccountId, setStripeAccountId] = useState("");
  const [linkingStripe, setLinkingStripe] = useState(false);
  
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    dispatch(fetchWallet('provider'));
    loadProviderDetails();
  }, [dispatch]);

  const loadProviderDetails = async () => {
    try {
      const details = await providerService.fetchDetails();
      setProviderDetails(details);
      setStripeAccountId(details.stripe_account_id || "");
    } catch (err) {
      console.error("Failed to load provider details:", err);
    }
  };

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  const handleLinkStripe = async () => {
    if (!stripeAccountId) {
      showSnack("Please enter a Stripe Account ID.", "error");
      return;
    }
    setLinkingStripe(true);
    try {
      await providerService.updateDetails({ stripe_account_id: stripeAccountId });
      showSnack("Stripe account linked successfully.");
      await loadProviderDetails();
    } catch (err) {
      showSnack("Failed to link Stripe account.", "error");
    } finally {
      setLinkingStripe(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      showSnack("Please enter a valid amount.", "error");
      return;
    }

    const resultAction = await dispatch(withdrawWalletThunk(withdrawAmount));
    if (withdrawWalletThunk.fulfilled.match(resultAction)) {
      showSnack("Withdrawal request processed successfully.");
      setWithdrawDialogOpen(false);
      setWithdrawAmount("");
    } else {
      showSnack(resultAction.payload || "Withdrawal failed.", "error");
    }
  };

  if (loading && !balance) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#F4E04D' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" gutterBottom color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
            Earnings & Wallet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your finances and withdraw your hard-earned payouts.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<DownloadIcon />}
          onClick={() => setWithdrawDialogOpen(true)}
          sx={{ 
            bgcolor: '#F4E04D', 
            color: 'black', 
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#e5d142' },
            px: 3,
            py: 1.2,
            borderRadius: 2,
            boxShadow: '0 4px 14px 0 rgba(244, 224, 77, 0.39)'
          }}
          disabled={!balance || parseFloat(balance) <= 0}
        >
          Withdraw Funds
        </Button>
      </Box>

      {/* Cards Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 6 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#000',
            color: 'white',
            borderRadius: 4,
            border: '1px solid #333',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
            {/* Background design elements */}
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, bgcolor: 'rgba(244, 224, 77, 0.1)', borderRadius: '50%' }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#F4E04D', mr: 2 }}>
                    <AccountBalanceWalletIcon sx={{ fontSize: 28, color: '#000' }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#aaa' }}>Current Balance</Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
                <Typography variant="h2" fontWeight="900" sx={{ letterSpacing: '-1px' }}>
                    ₹{parseFloat(balance || 0).toLocaleString()}
                </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 16 }} /> Available for immediate withdrawal
            </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
            color: 'black',
            borderRadius: 4,
            border: '1px solid #e0e0e0',
            justifyContent: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f5f5f5', mr: 2 }}>
                <PaymentIcon sx={{ fontSize: 28, color: '#666' }} />
            </Box>
            <Typography variant="h6" fontWeight="bold">Payout Method</Typography>
          </Box>
          
          {providerDetails?.stripe_account_id ? (
            <Box>
                <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                    Stripe Connected
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                   <Typography variant="body2">Account ID: {providerDetails.stripe_account_id}</Typography>
                   <Chip label="Verified" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} />
                </Box>
                <Button 
                    variant="text" 
                    size="small" 
                    sx={{ mt: 2, color: 'primary.main', fontWeight: 'bold', p: 0 }}
                    onClick={() => setWithdrawDialogOpen(true)}
                >
                    Change Account
                </Button>
            </Box>
          ) : (
            <Box>
                <Alert severity="info" sx={{ py: 0, '& .MuiAlert-message': { fontSize: '0.85rem' } }}>
                    Connect your Stripe account to start receiving payouts.
                </Alert>
                <Button 
                    variant="contained" 
                    size="small" 
                    sx={{ mt: 2, bgcolor: '#000', color: 'white', borderRadius: 2, textTransform: 'none' }}
                    onClick={() => setWithdrawDialogOpen(true)}
                >
                    Connect Stripe
                </Button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Transactions Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h5" fontWeight="900">
            Recent Activity
        </Typography>
        <Tooltip title="Your transaction history shows all credits from completed services and debits from withdrawals.">
            <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #eee', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#fafafa' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Transaction Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentTransactions && recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <TableRow key={tx.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {tx.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={tx.transaction_type}
                      size="small"
                      sx={{
                        textTransform: 'uppercase',
                        fontSize: '0.65rem',
                        letterSpacing: '0.5px',
                        fontWeight: '900',
                        backgroundColor: tx.transaction_type === 'credit' ? '#e8f5e9' : '#fff3f3',
                        color: tx.transaction_type === 'credit' ? '#2e7d32' : '#d32f2f',
                        border: '1px solid',
                        borderColor: tx.transaction_type === 'credit' ? '#a5d6a7' : '#ffcdd2',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body1"
                      sx={{
                        color: tx.transaction_type === 'credit' ? '#2e7d32' : '#d32f2f',
                        fontWeight: '900',
                      }}
                    >
                      {tx.transaction_type === 'credit' ? '+' : '-'} ₹{parseFloat(tx.amount).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {new Date(tx.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                        label={tx.status || "Completed"} 
                        size="small" 
                        variant="text"
                        sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Box sx={{ opacity: 0.5 }}>
                    <AccountBalanceWalletIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="body1">No transactions found</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Withdrawal Dialog */}
      <Dialog 
        open={withdrawDialogOpen} 
        onClose={() => !withdrawLoading && setWithdrawDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
            sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: '900', fontSize: '1.5rem', pb: 1 }}>Withdraw Funds</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Direct transfer your balance to your Stripe connected bank account.
          </Typography>

          {!providerDetails?.stripe_account_id ? (
            <Box sx={{ mt: 1 }}>
               <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                  Before you can withdraw, you must link your <strong>Stripe Connect</strong> account.
               </Alert>
               <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Linked Stripe Account ID</Typography>
               <TextField
                 placeholder="acct_xxxxxxxxxxxx"
                 fullWidth
                 variant="outlined"
                 value={stripeAccountId}
                 onChange={(e) => setStripeAccountId(e.target.value)}
                 disabled={linkingStripe}
                 sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
               />
               <Button 
                variant="contained" 
                fullWidth 
                onClick={handleLinkStripe} 
                disabled={linkingStripe || !stripeAccountId}
                sx={{ bgcolor: '#000', borderRadius: 2, py: 1.5, '&:hover': { bgcolor: '#333' } }}
               >
                 {linkingStripe ? <CircularProgress size={24} color="inherit" /> : "Link Stripe Account"}
               </Button>
            </Box>
          ) : (
            <Stack spacing={4} sx={{ mt: 1 }}>
               <Box 
                sx={{ 
                    p: 3, 
                    bgcolor: '#fafafa', 
                    borderRadius: 3, 
                    border: '1px solid #eee',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
               >
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', mb: 1 }}>
                    Available Payout
                  </Typography>
                  <Typography variant="h4" fontWeight="900" color="primary.main">₹{balance}</Typography>
               </Box>
               
               <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Amount to Withdraw</Typography>
                    <TextField
                        placeholder="0.00"
                        type="number"
                        fullWidth
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        InputProps={{ 
                            inputProps: { max: balance, min: 1 },
                            startAdornment: <Typography sx={{ mr: 1, fontWeight: 'bold' }}>₹</Typography>
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
               </Box>

               <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                   <InfoOutlinedIcon fontSize="small" color="disabled" />
                   <Typography variant="caption" color="text.secondary">
                        Funds will be sent to Stripe Account: <strong>{providerDetails.stripe_account_id}</strong>. 
                        Payouts typically arrive in your bank account in 1-2 business days.
                   </Typography>
               </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setWithdrawDialogOpen(false)} disabled={withdrawLoading} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            fullWidth={!providerDetails?.stripe_account_id}
            onClick={handleWithdraw} 
            disabled={withdrawLoading || !providerDetails?.stripe_account_id || !withdrawAmount || parseFloat(withdrawAmount) > parseFloat(balance)}
            sx={{ 
                bgcolor: '#F4E04D', 
                color: 'black', 
                borderRadius: 2, 
                px: 4,
                py: 1.2,
                fontWeight: '900',
                '&:hover': { bgcolor: '#e5d142' },
                '&.Mui-disabled': { bgcolor: '#f5f5f5' }
            }}
          >
            {withdrawLoading ? "Processing..." : "Confirm Withdrawal"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
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
          sx={{ width: "100%", borderRadius: 2, fontWeight: 'bold' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>

      {walletError && (
        <Snackbar open={!!walletError} autoHideDuration={6000}>
            <Alert severity="error" variant="filled" sx={{ width: '100%' }}>{walletError}</Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default ProviderWallet;
