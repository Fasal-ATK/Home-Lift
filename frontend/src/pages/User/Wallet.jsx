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
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet } from '../../redux/slices/walletSlice';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const Wallet = () => {
    const dispatch = useDispatch();
    const { balance, recentTransactions, loading, error } = useSelector((state) => state.wallet);

    useEffect(() => {
        dispatch(fetchWallet());
    }, [dispatch]);

    if (loading && !balance) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
                My Wallet
            </Typography>

            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#0066CC',
                    color: 'white',
                    borderRadius: 2,
                }}
            >
                <AccountBalanceWalletIcon sx={{ fontSize: 60, mr: 3 }} />
                <Box>
                    <Typography variant="h6">Total Balance</Typography>
                    <Typography variant="h3" fontWeight="bold">
                        ₹{parseFloat(balance).toLocaleString()}
                    </Typography>
                </Box>
            </Paper>

            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Recent Transactions
            </Typography>

            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Type</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell align="right">
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: tx.transaction_type === 'credit' ? 'green' : 'red',
                                                fontWeight: 'bold',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {tx.transaction_type}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {tx.transaction_type === 'credit' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        {new Date(tx.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {error && (
                <Typography color="error" align="center" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            )}
        </Container>
    );
};

export default Wallet;
