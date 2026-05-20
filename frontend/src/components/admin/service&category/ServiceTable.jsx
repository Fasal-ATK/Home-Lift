import React, { useEffect, useMemo, useState } from "react";
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
  Typography, Box, IconButton, Tooltip, Button, Chip,
  MenuItem, Select, FormControl, InputLabel, Stack, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from "@mui/material";
import {
  Edit, Delete, Add, Build as BuildIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";

import DataTable from "../DataTable";
import SearchBarWithFilter from "../SearchBar";
import CreationForm from "../modal/CreationForm";
import EditForm from "../modal/EditForm";
import ConfirmModal from "../../common/Confirm";

// ── Constants ──────────────────────────────────────────────────────────────
const SVC_FILTER_OPTIONS = [
  { value: "all",      label: "All Services" },
  { value: "active",   label: "Active"       },
  { value: "inactive", label: "Inactive"     },
];

const SAFE_COLORS = {
  success: { border: "#c8e6c9", bg: "#f1f8e9", text: "success.main" },
  warning: { border: "#ffe0b2", bg: "#fff8e1", text: "warning.main" },
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

// ── Service Detail Modal ────────────────────────────────────────────────
function ServiceDetailModal({ open, onClose, service, categories }) {
  if (!service) return null;
  const catName = categories?.find((c) => c.id === service.category)?.name || service.category_name || "—";
  const rows = [
    ["Service ID",  service.id],
    ["Name",        service.name],
    ["Category",    catName],
    ["Price",       service.price ? `₹${service.price}` : "—"],
    ["Duration",    service.duration ? `${service.duration} min` : "—"],
    ["Description", service.description || "—"],
    ["Status",      service.is_active ? "Active" : "Inactive"],
  ];
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {service.icon
            ? <Box component="img" src={service.icon} alt={service.name}
                sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: "cover",
                  border: "1px solid", borderColor: "divider" }} />
            : <BuildIcon color="warning" sx={{ fontSize: 36 }} />}
          <Box>
            <Typography fontWeight="bold">{service.name}</Typography>
            <Typography variant="caption" color="text.secondary">{catName}</Typography>
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

function ServiceTable() {
  const dispatch = useDispatch();

  const { list: rows, loading } = useSelector((s) => s.services);
  const totalCount = useSelector(selectTotalServicesCount);
  const { list: categories } = useSelector((s) => s.categories);

  const [sortConfig, setSortConfig]         = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery]       = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage]                     = useState(1);
  const rowsPerPage                         = 10;

  const [openModal, setOpenModal]                 = useState(false);
  const [isEditOpen, setEditOpen]                 = useState(false);
  const [confirmOpen, setConfirmOpen]             = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow]             = useState(null);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow]   = useState(null);

  useEffect(() => {
    dispatch(fetchServices({
      page,
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
    }));
    if (!categories.length) dispatch(fetchCategories());
  }, [dispatch, searchQuery, statusFilter, categoryFilter, page]);

  // ── Derived Stats
  const activeCount   = useMemo(() => (rows || []).filter((r) =>  r.is_active).length, [rows]);
  const inactiveCount = useMemo(() => (rows || []).filter((r) => !r.is_active).length, [rows]);

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
    dispatch(fetchServices({ page }));
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
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <BuildIcon color="warning" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" fontFamily="monospace" fontWeight="bold">
              Service Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage all services — toggle status, edit details, or remove
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenModal(true)}
          sx={{ textTransform: "none", fontWeight: "bold", borderRadius: 2 }}
        >
          Add Service
        </Button>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} mb={3}>
        <StatCard label="Total (page)" value={rows?.length} color="grey"    />
        <StatCard label="Active"       value={activeCount}  color="success" />
        <StatCard label="Inactive"     value={inactiveCount} color="warning" />
      </Stack>

      {/* Search + Filters */}
      <SearchBarWithFilter
        placeholder="Search services..."
        onSearch={(val) => { setSearchQuery(val); setPage(1); }}
        onFilterChange={(val) => { setStatusFilter(val); setPage(1); }}
        filterOptions={SVC_FILTER_OPTIONS}
      />

      {/* Category filter — sits outside SearchBar Paper */}
      <Box mb={2}>
        <FormControl size="small" sx={{
          minWidth: 200,
          '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' },
        }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <DataTable
        title="Services"
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

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleActive}
        title={selectedRow?.is_active ? "Deactivate Service" : "Activate Service"}
        message={`Are you sure you want to ${selectedRow?.is_active ? "deactivate" : "activate"} "${selectedRow?.name}"?`}
        confirmLabel={selectedRow?.is_active ? "Deactivate" : "Activate"}
        color={selectedRow?.is_active ? "warning" : "success"}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Service"
        message={`Are you sure you want to permanently delete "${selectedRow?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        color="error"
      />

      {/* Detail Modal */}
      <ServiceDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        service={detailRow}
        categories={categories}
      />
    </Box>
  );
}

export default ServiceTable;
