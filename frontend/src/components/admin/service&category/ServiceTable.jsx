import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
} from "../../../redux/slices/serviceSlice";
import { fetchCategories } from "../../../redux/slices/categorySlice";

import {
  Typography,
  Box,
  IconButton,
  Tooltip,
  Button,
  Chip,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";

import DataTable from "../DataTable";
import SearchBarWithFilter from "../SearchBar";
import CreationForm from "../modal/CreationForm";
import EditForm from "../modal/EditForm";
import ConfirmModal from "../../common/Confirm";

function ServiceTable() {
  const dispatch = useDispatch();

  // ✅ Redux state
  const { list: rows, loading } = useSelector((state) => state.services);
  const { list: categories } = useSelector((state) => state.categories);

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [openModal, setOpenModal] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // ---------------- Fetch ----------------
  useEffect(() => {
    dispatch(fetchServices());
    dispatch(fetchCategories()); // categories needed for dropdown
  }, [dispatch]);

  // ---------------- CRUD ----------------
  const handleCreateService = async (values) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description);
    formData.append("category", values.category);
    formData.append("price", values.price);
    formData.append("duration", values.duration);
    if (values.icon) formData.append("icon", values.icon);

    await dispatch(createService(formData));
    setOpenModal(false);
  };

  const handleUpdateService = async (values) => {
    if (!selectedRow) return;

    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description || "");
    formData.append("category", values.category);
    formData.append("price", values.price);
    formData.append("duration", values.duration);

    if (values.icon instanceof File) {
      formData.append("icon", values.icon);
    }

    await dispatch(updateService({ id: selectedRow.id, data: formData }));
    setEditOpen(false);
    setSelectedRow(null);
  };

  const handleToggleActive = async () => {
    if (!selectedRow) return;

    await dispatch(
      updateService({
        id: selectedRow.id,
        data: { is_active: !selectedRow.is_active }, // ✅ fixed key
      })
    );
    setConfirmOpen(false);
    setSelectedRow(null);
  };

  const confirmDelete = async () => {
    if (!selectedRow) return;

    await dispatch(deleteService(selectedRow.id));
    setDeleteConfirmOpen(false);
    setSelectedRow(null);
  };

  // ---------------- Table Config ----------------
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (row) => {
    setSelectedRow(row);
    setEditOpen(true);
  };

  const handleDelete = (row) => {
    setSelectedRow(row);
    setDeleteConfirmOpen(true);
  };

  // ---------------- Columns ----------------
  const columns = [
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Name", sortable: true },

    {
      key: "category",
      label: "Category",
      render: (row) => {
        // row.category is just an ID
        const category = categories.find((c) => c.id === row.category);
        return category ? category.name : "—";
      },
    },
    
    
    { key: "price", label: "Price", sortable: true },
    { key: "duration", label: "Duration", sortable: true },
    {
      key: "icon",
      label: "Icon",
      render: (row) =>
        row.icon_url ? ( // ✅ use icon_url from serializer
          <img
            src={row.icon_url}
            alt={row.name}
            style={{ width: 50, height: 50, borderRadius: "10%" }}
          />
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Chip
          label={row.is_active ? "Active" : "Inactive"} // ✅ fixed key
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

  // ---------------- Filters ----------------
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
      return statusFilter === "active" ? row.is_active : !row.is_active; // ✅ fixed key
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
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
          onClick={() => setOpenModal(true)}
        >
          Add Service
        </Button>
      </Box>

      <SearchBarWithFilter
        placeholder="Search services..."
        onSearch={setSearchQuery}
        onFilterChange={setStatusFilter}
      />

      <DataTable
        title="Services"
        columns={columns}
        rows={filteredRows}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
      />

      {/* Create Service Modal */}
      <CreationForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Add New Service"
        fields={[
          { name: "name", label: "Service Name", required: true },
          { name: "description", label: "Description" },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: categories.map((c) => ({ value: c.id, label: c.name })),
            required: true,
          },
          { name: "price", label: "Price", type: "number", required: true },
          { name: "duration", label: "Duration (minutes)", type: "number" },
          { name: "icon", label: "Icon", type: "file", accept: "image/*" },
        ]}
        onSubmit={handleCreateService}
        submitLabel="Create"
      />

      {/* Edit Service Modal */}
      <EditForm
        open={isEditOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Service"
        fields={[
          { name: "name", label: "Service Name", type: "text", required: true },
          { name: "description", label: "Description", type: "text" },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: categories.map((c) => ({ value: c.id, label: c.name })),
            required: true,
          },
          { name: "price", label: "Price", type: "number", required: true },
          { name: "duration", label: "Duration (minutes)", type: "number" },
          { name: "icon_url", label: "Icon", type: "file", accept: "image/*" },
        ]}
        initialData={selectedRow || {}}
        onSubmit={handleUpdateService}
        submitLabel="Update"
      />

      {/* Confirm Toggle Active */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleActive}
        message={`Are you sure you want to ${
          selectedRow?.is_active ? "deactivate" : "activate"
        } "${selectedRow?.name}"?`}
        confirmLabel="Yes"
        cancelLabel="No"
      />

      {/* Confirm Delete */}
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

export default ServiceTable;
