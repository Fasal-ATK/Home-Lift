import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  selectTotalCategoriesCount,
} from "../../../redux/slices/categorySlice";

import {
  Typography, Box, IconButton, Tooltip, Button, Chip, Stack, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from "@mui/material";
import {
  Edit, Delete, Add, Category as CategoryIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";

import DataTable from "../DataTable";
import SearchBarWithFilter from "../SearchBar";
import CreationForm from "../modal/CreationForm";
import EditForm from "../modal/EditForm";
import ConfirmModal from "../../common/Confirm";

// ── Constants ──────────────────────────────────────────────────────────────
const CAT_FILTER_OPTIONS = [
  { value: "all",      label: "All Categories" },
  { value: "active",   label: "Active"         },
  { value: "inactive", label: "Inactive"        },
];

const SAFE_COLORS = {
  success: { border: "#c8e6c9", bg: "#f1f8e9", text: "success.main" },
  warning: { border: "#ffe0b2", bg: "#fff8e1", text: "warning.main" },
  error:   { border: "#ffcdd2", bg: "#fff5f5", text: "error.main"   },
  grey:    { border: "#e0e0e0", bg: "#fafafa", text: "text.primary"  },
};

function StatCard({ label, value, color = "grey" }) {
  const c = SAFE_COLORS[color] || SAFE_COLORS.grey;
  return (
    <Paper elevation={0} sx={{
      p: 2, flex: 1, borderRadius: 3, textAlign: "center",
      border: `1.5px solid ${c.border}`, bgcolor: c.bg, minWidth: 120,
    }}>
      <Typography variant="h5" fontWeight="bold" color={c.text}>{value ?? "—"}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

// ── Category Detail Modal ──────────────────────────────────────────────────
function CategoryDetailModal({ open, onClose, category }) {
  if (!category) return null;
  const rows = [
    ["Category ID",  category.id],
    ["Name",         category.name],
    ["Description",  category.description || "—"],
    ["Status",       category.is_active ? "Active" : "Inactive"],
  ];
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {category.icon
            ? <Box component="img" src={category.icon} alt={category.name}
                sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: "cover",
                  border: "1px solid", borderColor: "divider" }} />
            : <CategoryIcon color="primary" sx={{ fontSize: 36 }} />}
          <Box>
            <Typography fontWeight="bold">{category.name}</Typography>
            <Typography variant="caption" color="text.secondary">Category Details</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <Divider sx={{ mt: 1.5 }} />
      <DialogContent>
        <Stack spacing={1} mt={1}>
          {rows.map(([label, val]) => (
            <Box key={label} display="flex" justifyContent="space-between" py={0.5}
              sx={{ borderBottom: "1px solid #f0f0f0" }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                {label}
              </Typography>
              <Typography variant="body2" fontWeight="medium" textAlign="right">
                {label === "Status"
                  ? <Chip size="small" label={val} color={val === "Active" ? "success" : "default"} variant="outlined" />
                  : val}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CategoryTable() {
  const dispatch = useDispatch();

  const { list: rows, loading } = useSelector((s) => s.categories);
  const totalCount = useSelector(selectTotalCategoriesCount);

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [openModal, setOpenModal]                 = useState(false);
  const [isEditOpen, setEditOpen]                 = useState(false);
  const [confirmOpen, setConfirmOpen]             = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow]             = useState(null);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow]   = useState(null);

  useEffect(() => {
    dispatch(fetchCategories({
      page,
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }));
  }, [dispatch, searchQuery, statusFilter, page]);

  // ── Derived Stats ────────────────────────────────────────────────────────
  const activeCount   = useMemo(() => (rows || []).filter((r) =>  r.is_active).length, [rows]);
  const inactiveCount = useMemo(() => (rows || []).filter((r) => !r.is_active).length, [rows]);

  const handleCreateCategory = async (values) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description);
    if (values.icon) formData.append("icon", values.icon);

    await dispatch(createCategory(formData));
    setOpenModal(false);
    dispatch(fetchCategories({ page }));
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
          color={row.is_active ? "success" : "default"}
          variant="outlined"
          onClick={() => { setSelectedRow(row); setConfirmOpen(true); }}
          sx={{ cursor: "pointer", fontWeight: "bold" }}
          size="small"
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton size="small" color="info"
              onClick={() => { setDetailRow(row); setDetailOpen(true); }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => handleEdit(row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
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
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" fontFamily="monospace" fontWeight="bold">
              Category Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage service categories — activate, edit, or remove
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenModal(true)}
          sx={{ textTransform: "none", fontWeight: "bold", borderRadius: 2 }}
        >
          Add Category
        </Button>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} mb={3}>
        <StatCard label="Total (page)" value={rows?.length} color="grey"    />
        <StatCard label="Active"       value={activeCount}  color="success" />
        <StatCard label="Inactive"     value={inactiveCount} color="warning" />
      </Stack>

      <SearchBarWithFilter
        placeholder="Search categories..."
        onSearch={(val) => { setSearchQuery(val); setPage(1); }}
        onFilterChange={(val) => { setStatusFilter(val); setPage(1); }}
        filterOptions={CAT_FILTER_OPTIONS}
      />

      <DataTable
        title="Service Categories"
        columns={columns}
        rows={sortedRows}
        sortConfig={sortConfig}
        onSort={handleSort}
        loading={loading}
        // Pagination
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
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

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleActive}
        title={selectedRow?.is_active ? "Deactivate Category" : "Activate Category"}
        message={`Are you sure you want to ${selectedRow?.is_active ? "deactivate" : "activate"} "${selectedRow?.name}"?`}
        confirmLabel={selectedRow?.is_active ? "Deactivate" : "Activate"}
        color={selectedRow?.is_active ? "warning" : "success"}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to permanently delete "${selectedRow?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        color="error"
      />

      {/* Detail Modal */}
      <CategoryDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        category={detailRow}
      />
    </Box>
  );
}

export default CategoryTable;
