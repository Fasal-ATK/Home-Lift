import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, TableSortLabel, Box
} from '@mui/material';
import Pagination from '../common/Pagination';

const DataTable = ({
  columns,
  rows,
  sortConfig,
  onSort,
  loading = false,
  emptyMessage = 'No records found',
  // Pagination props
  count, // Total pages
  page,
  onPageChange,
  totalItems, // Total count for display
  rowsPerPage = 10,
}) => {
  const renderSortLabel = (columnKey) => (
    <TableSortLabel
      active={sortConfig?.key === columnKey}
      direction={sortConfig?.key === columnKey ? sortConfig.direction : 'asc'}
      onClick={() => onSort && onSort(columnKey)}
    />
  );

  return (
    <Paper elevation={3}>
      {loading ? (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#ffe088' }}>
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align || 'left'}>
                      {col.label} {col.sortable && renderSortLabel(col.key)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, idx) => (
                    <TableRow key={row.id || idx}>
                      {columns.map((col) => (
                        <TableCell key={col.key} align={col.align || 'left'}>
                          {col.render ? col.render(row) : row[col.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Render pagination if count or totalItems is provided */}
          {(count > 1 || (totalItems > rowsPerPage)) && (
            <Box p={2} display="flex" justifyContent="flex-end">
              <Pagination
                count={count}
                page={page}
                onChange={onPageChange}
                totalCount={totalItems}
                pageSize={rowsPerPage}
              />
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default DataTable;
