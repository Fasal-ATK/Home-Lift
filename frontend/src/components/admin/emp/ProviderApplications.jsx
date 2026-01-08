// src/pages/admin/ProviderApplications.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Link } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../DataTable";
import {
  fetchApplications,
  approveApplication,
  rejectApplication,
} from "../../../redux/slices/admin/applicationsSlice";
import ViewApplicationModal from "../modal/ViewApplicationModal";

export default function ProviderApplications() {
  const dispatch = useDispatch();
  const { list: applications, loading, actionLoading } = useSelector(
    (state) => state.applications
  );

  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "asc",
  });
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    dispatch(fetchApplications());
  }, [dispatch]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedApplications = [...applications].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (typeof valA === "string")
      return sortConfig.direction === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    return sortConfig.direction === "asc" ? valA - valB : valB - valA;
  });

  const handleView = (application) => {
    setSelectedApplication(application);
    setViewOpen(true);
  };

  const handleAction = async (id, action, reason) => {
    try {
      if (action === "approve") {
        await dispatch(approveApplication({ id, data: {} })).unwrap();
      } else if (action === "reject") {
        await dispatch(
          rejectApplication({ id, data: { rejection_reason: reason } })
        ).unwrap();
      }
      dispatch(fetchApplications()); // refresh list
      setViewOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update application");
    }
  };

  // Helper: check if file is likely viewable directly (image or PDF)
  const isDirectView = (url) => {
    if (!url) return false;
    const cleanUrl = url.split("?")[0];
    const extension = cleanUrl.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "pdf"].includes(extension);
  };

  // Helper: get view URL (Google Docs Viewer for docs, direct for images/PDFs)
  const getViewUrl = (url) => {
    if (!url) return "";
    // Force HTTPS to avoid mixed content / 401 errors
    const secureUrl = url.replace(/^http:\/\//i, 'https://');
    return isDirectView(secureUrl)
      ? secureUrl
      : `https://docs.google.com/viewer?url=${encodeURIComponent(secureUrl)}&embedded=true`;
  };

  const columns = [
    {
      key: "created_at",
      label: "Applied Date",
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    { key: "user_name", label: "Name", sortable: true },
    { key: "user_email", label: "Email", sortable: true },
    { key: "user_phone", label: "Phone", sortable: true },
    {
      key: "id_doc",
      label: "ID Document",
      sortable: false,
      render: (row) =>
        row.id_doc_url ? (
          <Link href={getViewUrl(row.id_doc_url)} target="_blank" rel="noopener">
            View
          </Link>
        ) : (
          "Not Uploaded"
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Button
          variant="contained"
          size="small"
          sx={{ backgroundColor: "orange", color: "white" }}
          onClick={() => handleView(row)}
        >
          View
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
