// src/pages/admin/ProviderManager.jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Block, LockOpen } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from '../DataTable';
import SearchBarWithFilter from '../SearchBar';
import { fetchProviders, toggleProviderStatus, selectTotalProvidersCount } from '../../../redux/slices/admin/providerMngSlice';
import ConfirmModal from '../../common/Confirm';

export default function ProviderManager() {
  const dispatch = useDispatch();
  const { list: providers, loading } = useSelector((state) => state.providers);
  const totalCount = useSelector(selectTotalProvidersCount);

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Fetch with server-side params
  useEffect(() => {
    // Only fetch when page, search, or filter changes
    // Debounce search could be useful, but for now direct dependency
    const params = {
      page,
      search: searchTerm,
      status: filter === 'all' ? undefined : filter
    };
    dispatch(fetchProviders(params));
  }, [dispatch, page, searchTerm, filter]);

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

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'user_name', label: 'Name', sortable: true },
    { key: 'user_email', label: 'Email', sortable: true },
    { key: 'user_phone', label: 'Phone', sortable: true },
    {
      key: 'services',
      label: 'Services',
      sortable: false, // Services array hard to sort server-side easily without more logic
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
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        onFilterChange={(val) => { setFilter(val); setPage(1); }}
      />

      <DataTable
        columns={columns}
        rows={providers || []}
        loading={loading}
        // Pagination
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />

      {/* Confirm Modal for activate/deactivate */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleActive}
        message={`Are you sure you want to ${selectedRow?.is_active ? 'deactivate' : 'activate'
          } "${selectedRow?.user_name}"?`}
        confirmLabel="Yes"
        cancelLabel="No"
      />
    </Box>
  );
}
