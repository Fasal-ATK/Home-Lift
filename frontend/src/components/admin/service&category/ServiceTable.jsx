// components/admin/ServiceTable.jsx
import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Avatar, Chip, Tooltip, Button,} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import DataTable from "../DataTable";
import SearchBarWithFilter from "../SearchBar";
import FormModal from "../modal/CreationForm";

import { adminServiceManagementService } from "../../../services/apiServices";

function ServiceTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [categories, setCategories] = useState([]);

  const columns = [
    { key: "id", label: "ID", sortable: true },
    { key: "title", label: "Title", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "description", label: "Description", sortable: true },
    { key: "defaultPrice", label: "Default Price", sortable: true },
    { key: "duration", label: "Duration", sortable: true },
    {
      key: "icon",
      label: "Icon",
      render: (row) => (
        <Avatar src={row.icon_url} alt={row.title} sx={{ width: 30, height: 30 }} />
      ),
    },
    {
      key: "active",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Chip
          label={row.active ? "Active" : "Inactive"}
          onClick={() => handleToggleActive(row)}
          sx={{
            cursor: "pointer",
            backgroundColor: row.active ? "green" : "red",
            color: "white",
            fontWeight: "bold",
          }}
          size="small"
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton color="primary" size="small" onClick={() => handleEdit(row)}>
              <Edit fontSize="medium" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton color="error" size="small" onClick={() => handleDelete(row)}>
              <Delete fontSize="medium" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Fetch services + categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [services, cats] = await Promise.all([
          adminServiceManagementService.getServices(),
          adminServiceManagementService.getCategories(),
        ]);
        setRows(services);
        setCategories(cats.map((c) => ({ label: c.name, value: c.id })));
      } catch (err) {
        console.error("Failed to fetch data:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Create or Update service
  const handleSaveService = async (formValues) => {
    const formData = new FormData();
    Object.entries(formValues).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        formData.append(key, val);
      }
    });

    try {
      if (editingRow) {
        const updated = await adminServiceManagementService.updateService(
          editingRow.id,
          formData
        );
        setRows((prev) => prev.map((s) => (s.id === editingRow.id ? updated : s)));
      } else {
        const created = await adminServiceManagementService.createService(formData);
        setRows((prev) => [...prev, created]);
      }
      setModalOpen(false);
      setEditingRow(null);
    } catch (err) {
      console.error("Failed to save service:", err.response?.data || err);
    }
  };

  // Edit
  const handleEdit = (row) => {
    setEditingRow(row);
    setModalOpen(true);
  };

  // Delete
  const handleDelete = async (row) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await adminServiceManagementService.deleteService(row.id);
      setRows((prev) => prev.filter((s) => s.id !== row.id));
    } catch (err) {
      console.error("Failed to delete service:", err.response?.data || err);
    }
  };

  // Toggle active
  const handleToggleActive = async (row) => {
    try {
      const updated = await adminServiceManagementService.updateService(row.id, {
        ...row,
        active: !row.active,
      });
      setRows((prev) => prev.map((s) => (s.id === row.id ? updated : s)));
    } catch (err) {
      console.error("Failed to toggle status:", err.response?.data || err);
    }
  };

  // Sort
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // filter + sort
  const filteredRows = rows
    .filter((row) => {
      if (!searchQuery) return true;
      const haystack = `${row.title} ${row.category?.name} ${row.description} ${row.defaultPrice} ${row.duration}`
        .toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    })
    .filter((row) => {
      if (statusFilter === "all") return true;
      return statusFilter === "active" ? row.active : !row.active;
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key];
      let bVal = b[key];

      if (typeof aVal === "boolean") {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return direction === "asc" ? cmp : -cmp;
      }
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography
          variant="h4"
          fontFamily="monospace"
          fontWeight="bold"
          color="black"
        >
          Service Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingRow(null);
            setModalOpen(true);
          }}
        >
          Add Service
        </Button>
      </Box>

      {/* Search + Filter */}
      <SearchBarWithFilter
        placeholder="Search services..."
        onSearch={setSearchQuery}
        onFilterChange={setStatusFilter}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={filteredRows}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
      />

      {/* Modal for service creation/edit */}
      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRow(null);
        }}
        title={editingRow ? "Edit Service" : "Create Service"}
        submitLabel={editingRow ? "Update" : "Create"}
        onSubmit={handleSaveService}
        initialValues={
          editingRow
            ? {
                title: editingRow.title,
                category: editingRow.category?.id,
                description: editingRow.description,
                defaultPrice: editingRow.defaultPrice,
                duration: editingRow.duration,
              }
            : null
        }
        fields={[
          { name: "title", label: "Title", required: true },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: categories,
            required: true,
          },
          { name: "description", label: "Description", required: true },
          { name: "defaultPrice", label: "Default Price", required: true },
          { name: "duration", label: "Duration", required: true },
          {
            name: "icon",
            label: "Upload Icon",
            type: "file",
            accept: "image/*",
            required: !editingRow,
          },
        ]}
      />
    </Box>
  );
}

export default ServiceTable;
