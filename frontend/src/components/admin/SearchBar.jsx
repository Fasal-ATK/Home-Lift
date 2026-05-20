// components/admin/SearchBar.jsx
import {
  Box, TextField, InputAdornment, IconButton,
  MenuItem, FormControl, InputLabel, Select, Paper,
} from '@mui/material';
import { Search, FilterList, Clear } from '@mui/icons-material';
import { useState } from 'react';

const DEFAULT_OPTIONS = [
  { value: 'all',      label: 'All'      },
  { value: 'active',   label: 'Active'   },
  { value: 'inactive', label: 'Inactive' },
];

const SearchBarWithFilter = ({
  placeholder  = 'Search...',
  onSearch,
  onFilterChange,
  filterOptions,       // array of { value, label }
  showFilter = true,   // hide the filter dropdown entirely if false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter]         = useState('all');

  const options = filterOptions || DEFAULT_OPTIONS;

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch?.(val);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch?.('');
  };

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setFilter(val);
    onFilterChange?.(val);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mb: 2,
        p: 1.5,
        borderRadius: 3,
        border: '1.5px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
      }}
    >
      {/* ── Search ─────────────────────────────────────────────────────── */}
      <TextField
        size="small"
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{
          flex: 1,
          minWidth: 180,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'white',
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton onClick={handleClear} size="small" edge="end">
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      {/* ── Filter ─────────────────────────────────────────────────────── */}
      {showFilter && (
        <FormControl
          size="small"
          sx={{
            minWidth: 170,
            flexShrink: 0,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'white',
            },
          }}
        >
          <InputLabel
            shrink
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <FilterList sx={{ fontSize: 14, mr: 0.3 }} /> Filter
          </InputLabel>
          <Select
            label="Filter"
            value={filter}
            onChange={handleFilterChange}
            notched
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Paper>
  );
};

export default SearchBarWithFilter;
