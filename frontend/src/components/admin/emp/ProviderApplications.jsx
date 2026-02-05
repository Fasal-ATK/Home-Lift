// src/pages/admin/ProviderApplications.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Link } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../DataTable";
import {
  fetchApplications,
  approveApplication,
  rejectApplication,
  selectApplicationTotalCount,
} from "../../../redux/slices/admin/applicationsSlice";
import ViewApplicationModal from "../modal/ViewApplicationModal";

export default function ProviderApplications() {
  const dispatch = useDispatch();
  const { list: applications, loading, actionLoading } = useSelector(
    (state) => state.applications
  );
  const totalCount = useSelector(selectApplicationTotalCount);

  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "asc",
  });
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10; // Default StandardResultsSetPagination size

  useEffect(() => {
    dispatch(fetchApplications({ page }));
  }, [dispatch, page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedApplications = [...(applications || [])].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (typeof valA === "string")
      return sortConfig.direction === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    return sortConfig.direction === "asc" ? valA - valB : valB - valA;
  });

  // ... (handleView, handleAction, helpers unchanged) ...

  const columns = [
    // ... (unchanged) ...
  ];

  return (
    <Box p={3}>
      {/* ... (Typography unchanged) ... */}
      <Typography
        variant="h4"
        fontFamily="monospace"
        fontWeight="bold"
        color="black"
        mb={2}
      >
        Pending Provider Applications
      </Typography>

      <DataTable
        columns={columns}
        rows={sortedApplications}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        emptyMessage="No pending applications"
        // Pagination
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={handlePageChange}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />
      {/* ... (Modal unchanged) ... */}

      {selectedApplication && (
        <ViewApplicationModal
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          application={selectedApplication}
          onApprove={() => handleAction(selectedApplication.id, "approve")}
          onReject={(reason) => handleAction(selectedApplication.id, "reject", reason)}
          actionLoading={actionLoading}
        />
      )}
    </Box>
  );
}
