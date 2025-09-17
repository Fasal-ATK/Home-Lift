// src/pages/admin/ProviderManager.jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Block, LockOpen } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '../DataTable';
import SearchBarWithFilter from '../SearchBar';
import { fetchProviders, toggleProviderStatus } from '../../../redux/slices/admin/providerSlice';
import ConfirmModal from '../../common/Confirm';

export default function ProviderManager() {
  const dispatch = useDispatch();
  const { list: providers, loading } = useSelector((state) => state.providers);

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'user_name', direction: 'asc' });

  // confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    dispatch(fetchProviders());
  }, [dispatch]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleToggleActive = () => {
    if (selectedRow) {
      dispatch(
        toggleProviderStatus({
          id: selectedRow.id,
          is_active: !selectedRow.is_active,
        })
      );
      setConfirmOpen(false);
      setSelectedRow(null);
    }
  };

  // ✅ search now works with user_email and user_phone
  const filteredProviders = providers.filter((p) => {
    const matchesSearch = `${p.user_name} ${p.user_email || ''} ${p.user_phone || ''} ${p.services?.map(s => s.service_name).join(' ')}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'all' ? true : filter === 'active' ? p.is_active : !p.is_active;
    return matchesSearch && matchesFilter;
  });

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    if (sortConfig.key === 'services') {
      valA = a.services.map((s) => s.service_name).join(', ');
      valB = b.services.map((s) => s.service_name).join(', ');
    }
    if (typeof valA === 'string') {
      return sortConfig.direction === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
  });

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'user_name', label: 'Name', sortable: true },
    { key: 'user_email', label: 'Email', sortable: true },
    { key: 'user_phone', label: 'Phone', sortable: true },
    {
      key: 'services',
      label: 'Services',
      sortable: true,
      render: (row) => row.services?.map((s) => s.service_name).join(', ') || '-',
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (row) => (row.is_active ? 'Active' : 'Inactive'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Tooltip title={row.is_active ? 'Deactivate' : 'Activate'}>
          <IconButton
            onClick={() => {
              setSelectedRow(row);
              setConfirmOpen(true);
            }}
          >
            {row.is_active ? (
              <Block sx={{ color: 'red' }} />
            ) : (
              <LockOpen sx={{ color: 'green' }} />
            )}
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Typography
        variant="h4"
        fontFamily="monospace"
        fontWeight="bold"
        color="black"
      >
        Provider Management
      </Typography>

      <SearchBarWithFilter
        placeholder="Search providers..."
        onSearch={setSearchTerm}
        onFilterChange={setFilter}
      />

      <DataTable
        columns={columns}
        rows={sortedProviders}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
      />

      {/* Confirm Modal for activate/deactivate */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleActive}
        message={`Are you sure you want to ${
          selectedRow?.is_active ? 'deactivate' : 'activate'
        } "${selectedRow?.user_name}"?`}
        confirmLabel="Yes"
        cancelLabel="No"
      />
    </Box>
  );
}
