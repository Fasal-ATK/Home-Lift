// src/components/admin/emp/ProviderManager.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, IconButton, Tooltip, Stack, Paper, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Divider, Avatar,
} from '@mui/material';
import { Block, LockOpen, InfoOutlined as InfoIcon, Engineering } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '../DataTable';
import SearchBarWithFilter from '../SearchBar';
import {
  fetchProviders,
  toggleProviderStatus,
  selectTotalProvidersCount,
} from '../../../redux/slices/admin/providerMngSlice';
import ConfirmModal from '../../common/Confirm';

// ── Constants ────────────────────────────────────────────────────────────────
const PROVIDER_FILTER_OPTIONS = [
  { value: 'all',      label: 'All Providers' },
  { value: 'active',   label: 'Active'        },
  { value: 'inactive', label: 'Inactive'      },
];

const SAFE_COLORS = {
  success: { border: '#c8e6c9', bg: '#f1f8e9', text: 'success.main' },
  warning: { border: '#ffe0b2', bg: '#fff8e1', text: 'warning.main' },
  error:   { border: '#ffcdd2', bg: '#fff5f5', text: 'error.main'   },
  grey:    { border: '#e0e0e0', bg: '#fafafa', text: 'text.primary'  },
};

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = 'grey' }) {
  const c = SAFE_COLORS[color] || SAFE_COLORS.grey;
  return (
    <Paper elevation={0} sx={{
      p: 2, flex: 1, borderRadius: 3, textAlign: 'center',
      border: `1.5px solid ${c.border}`, bgcolor: c.bg, minWidth: 120,
    }}>
      <Typography variant="h5" fontWeight="bold" color={c.text}>{value ?? '—'}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

// ── Provider Detail Modal ─────────────────────────────────────────────────────
function ProviderDetailModal({ open, onClose, provider }) {
  if (!provider) return null;
  const serviceList = provider.services?.map((s) => s.service_name).join(', ') || '—';
  const rows = [
    ['Provider ID',   provider.id],
    ['Name',          provider.user_name || '—'],
    ['Email',         provider.user_email || '—'],
    ['Phone',         provider.user_phone || '—'],
    ['Experience',    provider.years_experience ? `${provider.years_experience} yr(s)` : '—'],
    ['Services',      serviceList],
    ['Status',        provider.is_active ? 'Active' : 'Inactive'],
    ['Verified',      provider.is_verified ? 'Yes' : 'No'],
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 'bold', pb: 0 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: 'success.main', width: 36, height: 36, fontSize: 16 }}>
            {(provider.user_name || '?')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight="bold">{provider.user_name}</Typography>
            <Typography variant="caption" color="text.secondary">{provider.user_email}</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <Divider sx={{ mt: 1.5 }} />
      <DialogContent>
        <Stack spacing={1} mt={1}>
          {rows.map(([label, val]) => (
            <Box key={label} display="flex" justifyContent="space-between" py={0.5}
              sx={{ borderBottom: '1px solid #f0f0f0' }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>{label}</Typography>
              <Typography variant="body2" fontWeight="medium" textAlign="right">
                {label === 'Status'
                  ? <Chip size="small" label={val} color={val === 'Active' ? 'success' : 'default'} />
                  : label === 'Verified'
                  ? <Chip size="small" label={val} color={val === 'Yes' ? 'info' : 'default'} variant="outlined" />
                  : val}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ProviderManager() {
  const dispatch = useDispatch();
  const { list: providers, loading } = useSelector((s) => s.providers);
  const totalCount = useSelector(selectTotalProvidersCount);

  const [page, setPage]             = useState(1);
  const rowsPerPage                 = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter]         = useState('all');

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // Detail modal
  const [detailOpen, setDetailOpen]     = useState(false);
  const [detailProvider, setDetailProvider] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchProviders({
      page,
      search: searchTerm || undefined,
      status: filter !== 'all' ? filter : undefined,
    }));
  }, [dispatch, page, searchTerm, filter]);

  // ── Derived Stats ──────────────────────────────────────────────────────────
  const activeCount   = useMemo(() => (providers || []).filter((p) =>  p.is_active).length, [providers]);
  const inactiveCount = useMemo(() => (providers || []).filter((p) => !p.is_active).length, [providers]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggleActive = () => {
    if (selectedRow) {
      dispatch(toggleProviderStatus({ id: selectedRow.id, is_active: !selectedRow.is_active }));
    }
    setConfirmOpen(false);
    setSelectedRow(null);
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    {
      key: 'user_name',
      label: 'Provider',
      sortable: true,
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark', width: 32, height: 32, fontSize: 13, fontWeight: 'bold' }}>
            {(row.user_name || '?')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{row.user_name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.user_email}</Typography>
          </Box>
        </Stack>
      ),
    },
    { key: 'user_phone', label: 'Phone', render: (row) => row.user_phone || '—' },
    {
      key: 'services',
      label: 'Services',
      render: (row) => {
        const names = row.services?.map((s) => s.service_name) || [];
        if (!names.length) return <Typography variant="caption" color="text.disabled">None</Typography>;
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {names.slice(0, 2).map((n) => (
              <Chip key={n} label={n} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
            ))}
            {names.length > 2 && (
              <Chip label={`+${names.length - 2}`} size="small" sx={{ fontSize: '0.65rem' }} />
            )}
          </Stack>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <Chip
          size="small"
          label={row.is_active ? 'Active' : 'Inactive'}
          color={row.is_active ? 'success' : 'default'}
          variant="outlined"
          sx={{ fontWeight: 'bold' }}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton size="small" color="info" onClick={() => { setDetailProvider(row); setDetailOpen(true); }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.is_active ? 'Deactivate' : 'Activate'}>
            <IconButton
              size="small"
              sx={{ color: row.is_active ? 'error.main' : 'success.main' }}
              onClick={() => { setSelectedRow(row); setConfirmOpen(true); }}
            >
              {row.is_active ? <Block fontSize="small" /> : <LockOpen fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box p={3}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Engineering color="success" sx={{ fontSize: 34 }} />
        <Box>
          <Typography variant="h4" fontFamily="monospace" fontWeight="bold">
            Provider Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all service providers — activate or deactivate accounts
          </Typography>
        </Box>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
        <StatCard label="Total (page)" value={providers?.length} color="grey"    />
        <StatCard label="Active"       value={activeCount}        color="success" />
        <StatCard label="Inactive"     value={inactiveCount}      color="warning" />
      </Stack>

      {/* Search + Filter */}
      <SearchBarWithFilter
        placeholder="Search providers by name or email..."
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        onFilterChange={(val) => { setFilter(val); setPage(1); }}
        filterOptions={PROVIDER_FILTER_OPTIONS}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        rows={providers || []}
        loading={loading}
        emptyMessage="No providers found."
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />

      {/* Activate / Deactivate Confirm */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleActive}
        title={selectedRow?.is_active ? 'Deactivate Provider' : 'Activate Provider'}
        message={`Are you sure you want to ${selectedRow?.is_active ? 'deactivate' : 'activate'} "${selectedRow?.user_name}"?`}
        confirmLabel={selectedRow?.is_active ? 'Deactivate' : 'Activate'}
        color={selectedRow?.is_active ? 'error' : 'success'}
      />

      {/* Detail Modal */}
      <ProviderDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        provider={detailProvider}
      />
    </Box>
  );
}
