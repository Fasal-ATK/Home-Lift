import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, CircularProgress, TextField
} from '@mui/material';
import {
  Edit, Block, LockOpen, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { useEffect, useState } from 'react';

const mockUsers = [
  {
    id: 1,
    username: 'fasla_rahman',
    email: 'fasla@example.com',
    phone: '+919876543210',
    is_blocked: false,
  },
  {
    id: 2,
    username: 'provider_user',
    email: 'provider@example.com',
    phone: '+919123456789',
    is_blocked: false,
  },
  {
    id: 3,
    username: 'john_doe',
    email: 'john@example.com',
    phone: '+919000000000',
    is_blocked: true,
  },
];

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'active' | 'blocked'

  useEffect(() => {
    const timeout = setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  const handleToggleBlock = (id) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id ? { ...user, is_blocked: !user.is_blocked } : user
      )
    );
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterClick = (mode) => {
    setFilterMode((prev) => (prev === mode ? 'all' : mode));
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (typeof aVal === 'string') {
      return sortConfig.direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' || typeof aVal === 'boolean') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const filteredUsers = sortedUsers
    .filter((user) =>
      `${user.username} ${user.email} ${user.phone}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .filter((user) => {
      if (filterMode === 'active') return !user.is_blocked;
      if (filterMode === 'blocked') return user.is_blocked;
      return true;
    });

  const activeCount = users.filter((u) => !u.is_blocked).length;
  const blockedCount = users.filter((u) => u.is_blocked).length;

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc'
      ? <ArrowUpward fontSize="small" />
      : <ArrowDownward fontSize="small" />;
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="orange">
        User Management
      </Typography>

      <TextField
        label="Search users..."
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography
          color="green"
          sx={{
            cursor: 'pointer',
            fontWeight: filterMode === 'active' ? 'bold' : 'normal',
            textDecoration: filterMode === 'active' ? 'underline' : 'none',
          }}
          onClick={() => handleFilterClick('active')}
        >
          Active Users: {activeCount}
        </Typography>

        <Typography
          color="red"
          sx={{
            cursor: 'pointer',
            fontWeight: filterMode === 'blocked' ? 'bold' : 'normal',
            textDecoration: filterMode === 'blocked' ? 'underline' : 'none',
          }}
          onClick={() => handleFilterClick('blocked')}
        >
          Blocked Users: {blockedCount}
        </Typography>
      </Box>

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
                  <TableCell onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                    ID {renderSortIcon('id')}
                  </TableCell>
                  <TableCell onClick={() => handleSort('username')} style={{ cursor: 'pointer' }}>
                    Name {renderSortIcon('username')}
                  </TableCell>
                  <TableCell onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                    Email {renderSortIcon('email')}
                  </TableCell>
                  <TableCell onClick={() => handleSort('phone')} style={{ cursor: 'pointer' }}>
                    Phone {renderSortIcon('phone')}
                  </TableCell>
                  <TableCell onClick={() => handleSort('is_blocked')} style={{ cursor: 'pointer' }}>
                    Status {renderSortIcon('is_blocked')}
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.is_blocked ? 'Blocked' : 'Active'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton>
                          <Edit sx={{ color: 'orange' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.is_blocked ? 'Unblock' : 'Block'}>
                        <IconButton onClick={() => handleToggleBlock(user.id)}>
                          {user.is_blocked ? (
                            <LockOpen sx={{ color: 'green' }} />
                          ) : (
                            <Block sx={{ color: 'red' }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default UserManager;
