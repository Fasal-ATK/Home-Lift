import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  selectTotalServicesCount,
} from "../../../redux/slices/serviceSlice";
import { fetchCategories } from "../../../redux/slices/categorySlice";

import {
  Typography,
  Box,
  IconButton,
  Tooltip,
  Button,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
  const totalCount = useSelector(selectTotalServicesCount);
  const { list: categories } = useSelector((state) => state.categories);

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // const [page, setPage] = useState(1); // REMOVED
  const rowsPerPage = 10;

  const [openModal, setOpenModal] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // ---------------- Fetch ----------------
  useEffect(() => {
    const params = {
      search: searchQuery,
      status: statusFilter === 'all' ? undefined : statusFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter
    };
    dispatch(fetchServices(params));

    // Dispatch categories for dropdown (if empty)
    if (!categories.length) {
      dispatch(fetchCategories());
    }
  }, [dispatch, searchQuery, statusFilter, categoryFilter, categories.length]);

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
    dispatch(fetchServices()); // REMOVED page param
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
        data: { is_active: !selectedRow.is_active },
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
    dispatch(fetchServices());
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
        row.icon ? (
          <img
            src={row.icon}
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
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEdit(row)}
            >
              <Edit fontSize="medium" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDelete(row)}
            >
              <Delete fontSize="medium" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Client side sorting for page
  const sortedRows = [...(rows || [])].sort((a, b) => {
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

      {/* 🔎 Search + Filters */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <SearchBarWithFilter
          placeholder="Search services..."
          onSearch={(val) => { setSearchQuery(val); }} // REMOVED setPage
          onFilterChange={(val) => { setStatusFilter(val); }} // REMOVED setPage
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); }} // REMOVED setPage
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box >

      <DataTable
        title="Services"
        columns={columns}
        rows={sortedRows}
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
          {
            name: "icon",
            label: "Icon",
            type: "file",
            accept: "image/*",
            required: true,
          },
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
          {
            name: "icon",
            label: "Replace Icon",
            type: "file",
            accept: "image/*",
          },
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
        message={`Are you sure you want to ${selectedRow?.is_active ? "deactivate" : "activate"
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
    </Box >
  );
}

export default ServiceTable;
