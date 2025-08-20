import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  IconButton,
  Tooltip,
  Button,
  Chip,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import DataTable from "./DataTable";
import SearchBarWithFilter from "./SearchBar";
import ModalForm from "../common/ModalForm";
import ConfirmModal from "../common/Confirm";
import { adminServiceManagementService } from "../../services/apiServices";

function CategoryTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openModal, setOpenModal] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // ---------------- API Calls ----------------
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await adminServiceManagementService.getCategories();
      setRows(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (values) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description);
    if (values.icon) formData.append("icon", values.icon);
    

    try {
      const newCategory = await adminServiceManagementService.createCategory(formData);
      setRows((prev) => [...prev, newCategory]);
      setOpenModal(false);
    } catch (err) {
      console.error("Error creating category:", err);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedRow) return;
    try {
      const updated = await adminServiceManagementService.updateCategory(selectedRow.id, {
        is_active: !selectedRow.is_active,
      });
      setRows((prev) =>
        prev.map((item) =>
          item.id === selectedRow.id ? { ...item, is_active: updated.is_active } : item
        )
      );
      setConfirmOpen(false);
      setSelectedRow(null);
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const confirmDelete = async () => {
    if (!selectedRow) return;
    try {
      await adminServiceManagementService.deleteCategory(selectedRow.id);
      setRows((prev) => prev.filter((item) => item.id !== selectedRow.id));
      setDeleteConfirmOpen(false);
      setSelectedRow(null);
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  // ---------------- Table & Sorting ----------------
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (row) => {
    console.log("Edit clicked:", row);
    // optional: open edit modal here
  };

  const handleDelete = (row) => {
    setSelectedRow(row);
    setDeleteConfirmOpen(true);
  };

  const columns = [
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "description", label: "Description", sortable: true },
    {
      key: "icon",
      label: "Icon",
      render: (row) =>
        row.icon ? (
          <img
            src={row.icon}
            alt={row.name}
            style={{ width: 40, height: 40, borderRadius: "50%" }}
          />
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Chip
          label={row.is_active ? "Active" : "Inactive"}
          onClick={() => {
            setSelectedRow(row);
            setConfirmOpen(true);
          }}
          sx={{
            cursor: "pointer",
            backgroundColor: row.is_active ? "green" : "red",
            color: "white",
            fontWeight: "bold",
            "&:hover": { opacity: 0.8 },
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

  const filteredRows = rows
    .filter((row) => {
      if (!searchQuery) return true;
      return (
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .filter((row) => {
      if (statusFilter === "all") return true;
      return statusFilter === "active" ? row.is_active : !row.is_active;
    })
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" fontFamily="monospace" fontWeight="bold" color="black">
          Category Management
        </Typography>

        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenModal(true)}>
          Add Category
        </Button>
      </Box>

      <SearchBarWithFilter
        placeholder="Search categories..."
        onSearch={setSearchQuery}
        onFilterChange={setStatusFilter}
      />

      <DataTable
        title="Service Categories"
        columns={columns}
        rows={filteredRows}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
      />

      {/* Create Category Modal */}
      <ModalForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Add New Category"
        fields={[
          { name: "name", label: "Category Name", required: true },
          { name: "description", label: "Description" },
          { name: "icon", label: "Icon", type: "file", accept: "image/*" },
        ]}
        onSubmit={handleCreateCategory}
        submitLabel="Create"
      />

      {/* Confirm Toggle Modal */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleActive}
        message={`Are you sure you want to ${selectedRow?.is_active ? "deactivate" : "activate"} "${selectedRow?.name}"?`}
        confirmLabel="Yes"
        cancelLabel="No"
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message={`Are you sure you want to delete "${selectedRow?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        color="danger"
      />
    </Box>
  );
}

export default CategoryTable;
