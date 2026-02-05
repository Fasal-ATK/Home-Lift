import React from 'react';
import { Box, Pagination as MuiPagination, Typography, Stack } from '@mui/material';

/**
 * Reusable Pagination Component
 * 
 * @param {number} count - Total number of pages
 * @param {number} page - Current page number (1-indexed)
 * @param {function} onChange - Callback when page changes (event, value)
 * @param {number} totalCount - Total number of items
 * @param {number} pageSize - Number of items per page
 * @param {string} color - Pagination color (default: 'primary')
 */
const Pagination = ({
    count,
    page,
    onChange,
    totalCount = 0,
    pageSize = 10,
    color = 'primary'
}) => {
    if (count <= 1) return null; // Don't show pagination if only one page

    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalCount);

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                mt: 3,
                mb: 2
            }}
        >
            <Typography variant="body2" color="text.secondary">
                Showing {startItem}-{endItem} of {totalCount} items
            </Typography>

            <MuiPagination
                count={count}
                page={page}
                onChange={onChange}
                color={color}
                shape="rounded"
                showFirstButton
                showLastButton
            />
        </Box>
    );
};

export default Pagination;
