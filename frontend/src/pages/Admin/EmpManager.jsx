import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import { Edit, Block, LockOpen } from '@mui/icons-material';
import DataTable from '../../components/admin/DataTable';
import SearchBarWithFilter from '../../components/admin/SearchBar';

const mockEmployees = [
  { id: 1, name: 'Fasla Rahman', email: 'fasla@example.com', phone: '+919876543210', is_active: true, services: ['AC Repair', 'Washing Machine Repair'] },
  { id: 2, name: 'John Doe', email: 'john@example.com', phone: '+919123456789', is_active: false, services: ['Electrician'] },
  { id: 3, name: 'Ayesha Malik', email: 'ayesha@example.com', phone: '+919000000000', is_active: true, services: ['Plumbing', 'Water Purifier Repair'] },
];

export default function EmpManager() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    setTimeout(() => {
      setEmployees(mockEmployees);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleToggleActive = (id) => {
    setEmployees((prev) =>
      prev.map((emp) => emp.id === id ? { ...emp, is_active: !emp.is_active } : emp)
    );
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = `${emp.name} ${emp.email} ${emp.phone} ${emp.services.join(' ')}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' ? true : filter === 'active' ? emp.is_active : !emp.is_active;
    return matchesSearch && matchesFilter;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (sortConfig.key === 'services') {
      valA = a.services.join(', ');
      valB = b.services.join(', ');
    }
    if (typeof valA === 'string') {
      return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
  });

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'services', label: 'Services', sortable: true, render: (row) => row.services.join(', ') },
    { key: 'is_active', label: 'Status', sortable: true, render: (row) => row.is_active ? 'Active' : 'Inactive' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <>
          <Tooltip title="Edit">
            <IconButton><Edit sx={{ color: 'orange' }} /></IconButton>
          </Tooltip>
          <Tooltip title={row.is_active ? 'Deactivate' : 'Activate'}>
            <IconButton onClick={() => handleToggleActive(row.id)}>
              {row.is_active ? <Block sx={{ color: 'red' }} /> : <LockOpen sx={{ color: 'green' }} />}
            </IconButton>
          </Tooltip>
        </>
      )
    },
  ];

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="orange">
        Employee Management
      </Typography>

      <Box display="flex" justifyContent="space-between" mb={2}>
        <Box />
        <Button variant="contained" sx={{ backgroundColor: 'orange', color: 'white' }}>
          Applications
        </Button>
      </Box>

      {/* Integrated Search + Filter */}
      <SearchBarWithFilter
        placeholder="Search employees..."
        onSearch={setSearchTerm}
        onFilterChange={setFilter}
      />

      <DataTable
        columns={columns}
        rows={sortedEmployees}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
      />
    </Box>
  );
}
