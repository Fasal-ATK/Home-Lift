// src/pages/admin/ProviderApplications.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Stack, Chip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../DataTable";
import {
  fetchApplications,
  approveApplication,
  rejectApplication,
  selectApplicationTotalCount,
} from "../../../redux/slices/admin/applicationsSlice";
import ViewApplicationModal from "../modal/ViewApplicationModal";
import { toast } from "react-toastify";

export default function ProviderApplications() {
  const dispatch = useDispatch();
  const { list: applications, loading, actionLoading } = useSelector(
    (state) => state.applications
  );
  const totalCount = useSelector(selectApplicationTotalCount);

  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc", // Default to newest
  });
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

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

  const handleView = (app) => {
    setSelectedApplication(app);
    setViewOpen(true);
  };

  const handleAction = async (id, type, reason = "") => {
    try {
      if (type === "approve") {
        await dispatch(approveApplication({ id, data: {} })).unwrap();
        toast.success("Application approved successfully!");
      } else {
        await dispatch(rejectApplication({ id, data: { rejection_reason: reason } })).unwrap();
        toast.success("Application rejected.");
      }
      setViewOpen(false);
      // Refresh list
      dispatch(fetchApplications({ page }));
    } catch (err) {
      toast.error(typeof err === 'string' ? err : "Action failed");
    }
  };

  const columns = [
    { key: "id", label: "ID", sortable: true },
    { key: "user_name", label: "Applicant Name", sortable: true },
    { key: "user_email", label: "Email", sortable: true },
    { key: "user_phone", label: "Phone", sortable: true },
    {
      key: "created_at",
      label: "Applied Date",
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color={row.status === "pending" ? "warning" : row.status === "approved" ? "success" : "error"}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Button size="small" variant="outlined" onClick={() => handleView(row)}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <Box p={3}>
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
