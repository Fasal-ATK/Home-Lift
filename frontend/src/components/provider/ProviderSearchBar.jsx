import React from 'react';
import { Box, InputBase, Paper, IconButton, Avatar, Typography } from '@mui/material';
import { Search } from '@mui/icons-material';

const ProviderSearchBar = ({ placeholder = "Search...", onSearch }) => {
  return (
    <Paper
      component="form"
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: '2px 8px',
        borderRadius: '12px',
        boxShadow: 'none',
        border: '1px solid #ddd',
        width: '100%',
        maxWidth: 500,
      }}
      onSubmit={(e) => {
        e.preventDefault();
        if (onSearch) onSearch(e.target.search.value);
      }}
    >
      <InputBase
        name="search"
        sx={{ ml: 1, flex: 1 }}
        placeholder={placeholder}
        inputProps={{ 'aria-label': 'search' }}
      />
      <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
        <Search />
      </IconButton>
    </Paper>
  );
};

export default ProviderSearchBar;
