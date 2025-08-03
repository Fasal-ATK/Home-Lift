import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useEffect, useState } from 'react';

const mockUsers = [
  {
    id: 1,
    username: 'fasla_rahman',
    email: 'fasla@example.com',
    phone: '+919876543210',
    is_provider: false,
  },
  {
    id: 2,
    username: 'provider_user',
    email: 'provider@example.com',
    phone: '+919123456789',
    is_provider: true,
  },
  {
    id: 3,
    username: 'john_doe',
    email: 'john@example.com',
    phone: '+919000000000',
    is_provider: false,
  },
];

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulate loading with mock data
  useEffect(() => {
    const timeout = setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000); // simulate network delay
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="orange">
        User Management
      </Typography>

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
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.is_provider ? 'Provider' : 'User'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton>
                          <Edit sx={{ color: 'orange' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton>
                          <Delete sx={{ color: 'red' }} />
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

export default UserManager;
