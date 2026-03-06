import React, { useEffect } from 'react';
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
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet } from '../../redux/slices/walletSlice';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const ProviderWallet = () => {
  const dispatch = useDispatch();
  const { balance, recentTransactions, loading, error } = useSelector((state) => state.wallet);

  useEffect(() => {
    dispatch(fetchWallet('provider'));
  }, [dispatch]);

  if (loading && !balance) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#F4E04D' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
          Earnings & Wallet
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your earnings from completed jobs and track your transaction history.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#000',
            color: 'white',
            borderRadius: 3,
            border: '1px solid #333'
          }}
        >
          <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: '#F4E04D', mr: 3 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#000' }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#aaa' }}>Current Balance</Typography>
            <Typography variant="h3" fontWeight="bold">
              ₹{parseFloat(balance || 0).toLocaleString()}
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F4E04D',
            color: 'black',
            borderRadius: 3,
          }}
        >
          <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.1)', mr: 3 }}>
            <TrendingUpIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">Wallet Status</Typography>
            <Typography variant="h4" fontWeight="bold">
              Active
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Your funds are protected and ready for withdrawal.
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Recent Transactions
      </Typography>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #eee' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#fafafa' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentTransactions && recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <TableRow key={tx.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {tx.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={tx.transaction_type}
                      size="small"
                      sx={{
                        textTransform: 'capitalize',
                        fontWeight: 'bold',
                        backgroundColor: tx.transaction_type === 'credit' ? '#e8f5e9' : '#ffebee',
                        color: tx.transaction_type === 'credit' ? '#2e7d32' : '#c62828',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body1"
                      sx={{
                        color: tx.transaction_type === 'credit' ? '#2e7d32' : '#c62828',
                        fontWeight: 'bold',
                      }}
                    >
                      {tx.transaction_type === 'credit' ? '+' : '-'} ₹{parseFloat(tx.amount).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>
                    {new Date(tx.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No transactions recorded yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {error && (
        <Typography color="error" align="center" sx={{ mt: 3, p: 2, bgcolor: '#fff5f5', borderRadius: 2 }}>
          {error}
        </Typography>
      )}
    </Container>
  );
};

export default ProviderWallet;
