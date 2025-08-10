import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, CircularProgress, TextField,
  Button, MenuItem, Select, TableSortLabel
} from '@mui/material';
import { Edit, Block, LockOpen } from '@mui/icons-material';

const mockEmployees = [
  {
    id: 1,
    name: 'Fasla Rahman',
    email: 'fasla@example.com',
    phone: '+919876543210',
    is_active: true,
    services: ['AC Repair', 'Washing Machine Repair'],
  },
  {
    id: 2,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+919123456789',
    is_active: false,
    services: ['Electrician'],
  },
  {
    id: 3,
    name: 'Ayesha Malik',
    email: 'ayesha@example.com',
    phone: '+919000000000',
    is_active: true,
    services: ['Plumbing', 'Water Purifier Repair'],
  },
];

const EmpManager = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setEmployees(mockEmployees);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  const handleToggleActive = (id) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? { ...emp, is_active: !emp.is_active } : emp
      )
    );
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const isSameKey = prev.key === key;
      const direction = isSameKey && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    const { key, direction } = sortConfig;
    let valA = a[key];
    let valB = b[key];

    if (key === 'services') {
      valA = a.services.join(', ');
      valB = b.services.join(', ');
    }

    if (key === 'is_active') {
      valA = a.is_active ? 1 : 0;
      valB = b.is_active ? 1 : 0;
    }

    if (typeof valA === 'string') {
      return direction === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    } else {
      return direction === 'asc' ? valA - valB : valB - valA;
    }
  });

  const filteredEmployees = sortedEmployees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = `${emp.name} ${emp.email} ${emp.phone} ${emp.services.join(' ')}`.toLowerCase().includes(term);

    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'active'
        ? emp.is_active
        : !emp.is_active;

    return matchesSearch && matchesFilter;
  });

  const renderSortLabel = (columnKey) => (
    <TableSortLabel
      active={sortConfig.key === columnKey}
      direction={sortConfig.key === columnKey ? sortConfig.direction : 'asc'}
      onClick={() => handleSort(columnKey)}
    />
  );

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="orange">
        Employee Management
      </Typography>

      {/* Top control row */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Box />
        <Button variant="contained" sx={{ backgroundColor: 'orange', color: 'white' }}>
          Applications
        </Button>
      </Box>

      {/* Search and filter row */}
      <Box display="flex" justifyContent="space-between" mb={2} gap={2}>
        <TextField
          label="Search employees..."
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
      </Box>

      {/* Table Section */}
      <Paper elevation={3}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#ffe082' }}>
                  <TableCell>ID {renderSortLabel('id')}</TableCell>
                  <TableCell>Name {renderSortLabel('name')}</TableCell>
                  <TableCell>Email {renderSortLabel('email')}</TableCell>
                  <TableCell>Phone {renderSortLabel('phone')}</TableCell>
                  <TableCell>Services {renderSortLabel('services')}</TableCell>
                  <TableCell>Status {renderSortLabel('is_active')}</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.id}</TableCell>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.phone}</TableCell>
                    <TableCell>{emp.services.join(', ')}</TableCell>
                    <TableCell>{emp.is_active ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton>
                          <Edit sx={{ color: 'orange' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={emp.is_active ? 'Deactivate' : 'Activate'}>
                        <IconButton onClick={() => handleToggleActive(emp.id)}>
                          {emp.is_active ? (
                            <Block sx={{ color: 'red' }} />
                          ) : (
                            <LockOpen sx={{ color: 'green' }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default EmpManager;
