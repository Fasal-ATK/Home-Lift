import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  selectTotalCategoriesCount,
} from "../../../redux/slices/categorySlice";

import {
  Typography,
  Box,
  IconButton,
  Tooltip,
  Button, Chip,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";

import DataTable from "../DataTable";
import SearchBarWithFilter from "../SearchBar";
import CreationForm from "../modal/CreationForm";
import EditForm from "../modal/EditForm";
import ConfirmModal from "../../common/Confirm";

function CategoryTable() {
  const dispatch = useDispatch();

  // ✅ Use Redux state
  const { list: rows, loading } = useSelector((state) => state.categories);
  const totalCount = useSelector(selectTotalCategoriesCount);

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // const [page, setPage] = useState(1); // REMOVED
  const rowsPerPage = 10;

  const [openModal, setOpenModal] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // ---------------- Redux Fetch ----------------
  useEffect(() => {
    const params = {
      search: searchQuery,
      status: statusFilter === 'all' ? undefined : statusFilter
    };
    dispatch(fetchCategories(params));
  }, [dispatch, searchQuery, statusFilter]);

  const handleCreateCategory = async (values) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description);
    if (values.icon) formData.append("icon", values.icon);

    await dispatch(createCategory(formData));
    setOpenModal(false);
    dispatch(fetchCategories()); // REMOVED page param
  };

  const handleUpdateCategory = async (values) => {
    if (!selectedRow) return;

    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description || "");
    if (values.icon instanceof File) {
      formData.append("icon", values.icon);
    }

    await dispatch(updateCategory({ id: selectedRow.id, data: formData }));
    setEditOpen(false);
    setSelectedRow(null);
  };

  const handleToggleActive = async () => {
    if (!selectedRow) return;

    await dispatch(
      updateCategory({
        id: selectedRow.id,
        data: { is_active: !selectedRow.is_active },
      })
    );
    setConfirmOpen(false);
    setSelectedRow(null);
  };

  const confirmDelete = async () => {
    if (!selectedRow) return;

    await dispatch(deleteCategory(selectedRow.id));
    setDeleteConfirmOpen(false);
    setSelectedRow(null);
    dispatch(fetchCategories());
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
    setSelectedRow(row);
    setEditOpen(true);
  };

  const handleDelete = (row) => {
    setSelectedRow(row);
    setDeleteConfirmOpen(true);
  };

  // ---------------- Table Fields ----------------
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
            style={{ width: 50, height: 50, borderRadius: "10%" }}
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

  // Client side sorting for current page
  const sortedRows = [...(rows || [])].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <Box>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
      >
        <Typography
          variant="h4"
          fontFamily="monospace"
          fontWeight="bold"
          color="black"
        >
          Category Management
        </Typography>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenModal(true)}
        >
          Add Category
        </Button>
      </Box>

      <SearchBarWithFilter
        placeholder="Search categories..."
        onSearch={(val) => { setSearchQuery(val); }} // REMOVED setPage
        onFilterChange={(val) => { setStatusFilter(val); }} // REMOVED setPage
      />

      <DataTable
        title="Service Categories"
        columns={columns}
        rows={sortedRows}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
      />

      {/* Create Category Modal */}
      <CreationForm
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

      {/* Edit Category Modal */}
      <EditForm
        open={isEditOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Category"
        fields={[
          { name: "name", label: "Category Name", type: "text", required: true },
          { name: "description", label: "Description", type: "text" },
          { name: "icon", label: "Category Icon", type: "file", accept: "image/*" },
        ]}
        initialData={selectedRow || {}}
        onSubmit={handleUpdateCategory}
        submitLabel="Update"
      />

      {/* Confirm Toggle Status Modal */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleActive}
        message={`Are you sure you want to ${selectedRow?.is_active ? "deactivate" : "activate"
          } "${selectedRow?.name}"?`}
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
    </Box >
  );
}

export default CategoryTable;
