import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Edit, Block, LockOpen } from '@mui/icons-material';
import DataTable from '../../components/admin/DataTable';
import SearchBarWithFilter from '../../components/admin/SearchBar';

const mockUsers = [
  { id: 1, username: 'fasla_rahman', email: 'fasla@example.com', phone: '+919876543210', is_blocked: false },
  { id: 2, username: 'provider_user', email: 'provider@example.com', phone: '+919123456789', is_blocked: false },
  { id: 3, username: 'john_doe', email: 'john@example.com', phone: '+919000000000', is_blocked: true },
];

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'username', direction: 'asc' });

  useEffect(() => {
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleToggleBlock = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_blocked: !u.is_blocked } : u))
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = `${u.username} ${u.email} ${u.phone}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'all' ? true : filter === 'active' ? !u.is_blocked : u.is_blocked;
    return matchesSearch && matchesFilter;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (typeof valA === 'string') {
      return sortConfig.direction === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
  });

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'username', label: 'Username', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    {
      key: 'is_blocked',
      label: 'Status',
      sortable: true,
      render: (row) =>
        row.is_blocked ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>Blocked</span>
        ) : (
          <span style={{ color: 'green', fontWeight: 'bold' }}>Active</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <>
          <Tooltip title="Edit">
            <IconButton>
              <Edit sx={{ color: 'orange' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.is_blocked ? 'Unblock' : 'Block'}>
            <IconButton onClick={() => handleToggleBlock(row.id)}>
              {row.is_blocked ? (
                <LockOpen sx={{ color: 'green' }} />
              ) : (
                <Block sx={{ color: 'red' }} />
              )}
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="orange">
        User Management
      </Typography>

      {/* Integrated Search + Filter */}
      <SearchBarWithFilter
        placeholder="Search users..."
        onSearch={setSearchTerm}
        onFilterChange={setFilter}
      />

      <DataTable
        columns={columns}
        rows={sortedUsers}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
      />
    </Box>
  );
}
