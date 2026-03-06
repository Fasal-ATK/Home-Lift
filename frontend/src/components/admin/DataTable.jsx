import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Box, Typography
} from '@mui/material';
import Pagination from '../common/Pagination';
import HLProgress from '../common/HLProgress';

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
    <Paper elevation={3} sx={{ position: 'relative', overflow: 'hidden', minHeight: '200px' }}>
      {/* Branded HL Animation Overlay - Professional & Contextual */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(1px)',
            transition: 'all 0.3s ease',
          }}
        >
          <HLProgress size={50} />
        </Box>
      )}

      <TableContainer sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease-in-out' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#ffe088' }}>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align || 'left'} sx={{ fontWeight: 'bold' }}>
                  {col.label} {col.sortable && renderSortLabel(col.key)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={row.id || idx} hover>
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
    </Paper>
  );
};

export default DataTable;
