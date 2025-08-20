// components/admin/ServiceTable.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Tooltip,
  Button,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import DataTable from "./DataTable";
import SearchBarWithFilter from "./SearchBar";
import FormModal from "../common/ModalForm";

function ServiceTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  // Mock categories for dropdown
  const categories = ["Home Repair", "Cleaning", "Electrical", "Plumbing"];

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
        <Avatar src={row.icon} alt={row.title} sx={{ width: 30, height: 30 }} />
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

  // mock fetch
  useEffect(() => {
    setTimeout(() => {
      setRows([
        {
          id: 1,
          title: "Plumbing",
          category: "Home Repair",
          description: "Fix water leakage and pipe issues",
          defaultPrice: "₹500",
          duration: "1 hr",
          icon: "https://cdn-icons-png.flaticon.com/512/2965/2965567.png",
          active: true,
        },
        {
          id: 2,
          title: "House Cleaning",
          category: "Cleaning",
          description: "Deep cleaning service",
          defaultPrice: "₹1500",
          duration: "3 hr",
          icon: "https://cdn-icons-png.flaticon.com/512/3076/3076575.png",
          active: false,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  // handlers
  const handleEdit = (row) => {
    console.log("Edit service:", row);
    // TODO: open modal pre-filled with row data
  };

  const handleDelete = (row) => {
    console.log("Delete service:", row);
    // TODO: confirm + API
  };

  const handleToggleActive = (row) => {
    setRows((prev) =>
      prev.map((s) => (s.id === row.id ? { ...s, active: !s.active } : s))
    );
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleCreateService = (formValues) => {
    const newService = {
      id: rows.length + 1,
      title: formValues.title,
      category: formValues.category,
      description: formValues.description,
      defaultPrice: formValues.defaultPrice,
      duration: formValues.duration,
      icon: formValues.icon ? URL.createObjectURL(formValues.icon) : "",
      active: true,
    };
    setRows((prev) => [...prev, newService]);
    setModalOpen(false);
  };

  // filter + sort
  const filteredRows = rows
    .filter((row) => {
      if (!searchQuery) return true;
      const haystack = `${row.title} ${row.category} ${row.description} ${row.defaultPrice} ${row.minDuration}`
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
          onClick={() => setModalOpen(true)}
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

      {/* Modal for service creation */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Service"
        submitLabel="Create"
        onSubmit={handleCreateService}
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
            required: true,
          },
        ]}
      />
    </Box>
  );
}

export default ServiceTable;
