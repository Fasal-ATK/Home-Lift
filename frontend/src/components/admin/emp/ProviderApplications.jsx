// src/pages/admin/ProviderApplications.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Chip } from "@mui/material";
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

  // Pagination — backend handles filtering/ordering; page change triggers new fetch
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    dispatch(fetchApplications({ page }));
  }, [dispatch, page]);

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
      // Refresh current page
      dispatch(fetchApplications({ page }));
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Action failed");
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "user_name", label: "Applicant Name" },
    { key: "user_email", label: "Email" },
    { key: "user_phone", label: "Phone" },
    {
      key: "created_at",
      label: "Applied Date",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color={
            row.status === "pending"
              ? "warning"
              : row.status === "approved"
              ? "success"
              : "error"
          }
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
        rows={applications || []}
        loading={loading}
        emptyMessage="No pending applications"
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
      />

      {selectedApplication && (
        <ViewApplicationModal
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          application={selectedApplication}
          onApprove={() => handleAction(selectedApplication.id, "approve")}
          onReject={(reason) =>
            handleAction(selectedApplication.id, "reject", reason)
          }
          actionLoading={actionLoading}
        />
      )}
    </Box>
  );
}
