import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Container,
    Stack,
    Avatar,
    Divider,
    Chip,
    Pagination,
    Skeleton
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet } from '../../redux/slices/walletSlice';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import CallMadeIcon from '@mui/icons-material/CallMade';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { getErrorMessage } from '../../utils/errorHelper';

const ITEMS_PER_PAGE = 8;

const StatCard = ({ icon, label, value, color, bgColor }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flex: 1,
            minWidth: 0,
        }}
    >
        <Box sx={{ bgcolor: bgColor, p: 1.2, borderRadius: 2, display: 'flex' }}>
            {React.cloneElement(icon, { sx: { fontSize: 20, color } })}
        </Box>
        <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
                {label}
            </Typography>
            <Typography variant="subtitle2" fontWeight={800} noWrap>
                {value}
            </Typography>
        </Box>
    </Paper>
);

const Wallet = () => {
    const dispatch = useDispatch();
    const { balance, recentTransactions, loading, error } = useSelector((state) => state.wallet);
    const [page, setPage] = useState(1);

    useEffect(() => {
        dispatch(fetchWallet('user'));
    }, [dispatch]);

    const txList = recentTransactions || [];
    const totalPages = Math.ceil(txList.length / ITEMS_PER_PAGE);
    const paginatedTx = txList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const totalCredits = txList
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const totalDebits = txList
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const formatCurrency = (val) =>
        parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return {
            date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };
    };

    if (loading && !balance) {
        return (
            <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
                <Skeleton variant="rounded" height={130} sx={{ mb: 3, borderRadius: 3 }} />
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Skeleton variant="rounded" height={68} sx={{ flex: 1, borderRadius: 2.5 }} />
                    <Skeleton variant="rounded" height={68} sx={{ flex: 1, borderRadius: 2.5 }} />
                    <Skeleton variant="rounded" height={68} sx={{ flex: 1, borderRadius: 2.5 }} />
                </Stack>
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1, borderRadius: 2 }} />
                ))}
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
            {/* Header */}
            <Typography variant="h5" fontWeight="800" sx={{ mb: 3 }}>
                My Wallet
            </Typography>

            {/* Balance Card */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, sm: 3.5 },
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.25)',
                }}
            >
                {/* Decorative circles */}
                <Box sx={{ position: 'absolute', right: -30, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <Box sx={{ position: 'absolute', right: 70, bottom: -70, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
                <Box sx={{ position: 'absolute', left: -20, top: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(99,102,241,0.08)' }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, zIndex: 1 }}>
                    <Box sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        p: 1.8,
                        borderRadius: 2.5,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <AccountBalanceWalletIcon sx={{ fontSize: 36, color: '#e2e8f0' }} />
                    </Box>
                    <Box>
                        <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1.5, fontSize: '0.65rem' }}>
                            AVAILABLE BALANCE
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                            <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 700 }}>₹</Typography>
                            <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: -1, lineHeight: 1 }}>
                                {formatCurrency(balance)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ zIndex: 1, textAlign: 'right' }}>
                    <Chip
                        label="Active"
                        size="small"
                        sx={{
                            bgcolor: 'rgba(34,197,94,0.15)',
                            color: '#4ade80',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            border: '1px solid rgba(74,222,128,0.3)',
                            letterSpacing: 0.5
                        }}
                    />
                </Box>
            </Paper>

            {/* Stats Row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
                <StatCard
                    icon={<ReceiptLongIcon />}
                    label="Total Transactions"
                    value={txList.length}
                    color="#6366f1"
                    bgColor="#eef2ff"
                />
                <StatCard
                    icon={<TrendingUpIcon />}
                    label="Total Credits"
                    value={`₹${formatCurrency(totalCredits)}`}
                    color="#16a34a"
                    bgColor="#f0fdf4"
                />
                <StatCard
                    icon={<TrendingDownIcon />}
                    label="Total Debits"
                    value={`₹${formatCurrency(totalDebits)}`}
                    color="#dc2626"
                    bgColor="#fff1f2"
                />
            </Stack>

            {/* Transactions */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                    Transaction History
                </Typography>
                {txList.length > 0 && (
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, txList.length)}–{Math.min(page * ITEMS_PER_PAGE, txList.length)} of {txList.length}
                    </Typography>
                )}
            </Box>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    overflow: 'hidden',
                    mb: totalPages > 1 ? 2 : 0
                }}
            >
                {paginatedTx.length > 0 ? (
                    paginatedTx.map((tx, index) => {
                        const isCredit = tx.transaction_type === 'credit';
                        const { date, time } = formatDate(tx.created_at);
                        return (
                            <Box key={tx.id}>
                                <Box sx={{
                                    px: 3,
                                    py: 1.8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    '&:hover': { bgcolor: 'grey.50' },
                                    transition: 'background-color 0.15s',
                                }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{
                                            bgcolor: isCredit ? '#f0fdf4' : '#fff1f2',
                                            color: isCredit ? '#16a34a' : '#dc2626',
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                        }}>
                                            {isCredit
                                                ? <CallReceivedIcon fontSize="small" />
                                                : <CallMadeIcon fontSize="small" />
                                            }
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mb: 0.2 }}>
                                                {tx.description || 'Wallet Transaction'}
                                            </Typography>
                                            <Stack direction="row" spacing={0.8} alignItems="center">
                                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                    {date}
                                                </Typography>
                                                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {time}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>

                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={800}
                                            sx={{ color: isCredit ? '#16a34a' : '#dc2626' }}
                                        >
                                            {isCredit ? '+' : '-'}₹{formatCurrency(tx.amount)}
                                        </Typography>
                                        <Chip
                                            label={isCredit ? 'Credit' : 'Debit'}
                                            size="small"
                                            sx={{
                                                height: 18,
                                                fontSize: '0.6rem',
                                                fontWeight: 700,
                                                bgcolor: isCredit ? '#f0fdf4' : '#fff1f2',
                                                color: isCredit ? '#16a34a' : '#dc2626',
                                                border: 'none',
                                                mt: 0.3
                                            }}
                                        />
                                    </Box>
                                </Box>
                                {index < paginatedTx.length - 1 && <Divider sx={{ mx: 3 }} />}
                            </Box>
                        );
                    })
                ) : (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <AccountBalanceWalletIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            No transactions yet
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            Your transaction history will appear here
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Pagination */}
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, val) => {
                            setPage(val);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        color="primary"
                        shape="rounded"
                        size="small"
                    />
                </Box>
            )}

            {error && (
                <Typography color="error" align="center" sx={{ mt: 3, fontWeight: 500 }}>
                    {getErrorMessage(error)}
                </Typography>
            )}
        </Container>
    );
};

export default Wallet;
