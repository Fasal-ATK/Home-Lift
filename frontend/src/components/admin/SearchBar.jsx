// components/SearchBarWithFilter.jsx
import { Box, TextField, InputAdornment, IconButton, MenuItem } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useState } from 'react';

const SearchBarWithFilter = ({ placeholder = "Search...", onSearch, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilter(value);
    if (onFilterChange) onFilterChange(value);
  };

  return (
    <Box mb={2} display="flex" gap={2} alignItems="center">
      {/* Search Box */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton onClick={handleClear} size="small">
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Filter Dropdown */}
      <TextField
        select
        value={filter}
        onChange={handleFilterChange}
        variant="outlined"
        sx={{ width: 150 }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="inactive">Inactive</MenuItem>
      </TextField>
    </Box>
  );
};

export default SearchBarWithFilter;
