import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Button, IconButton, Stack, Tooltip, Chip, Switch,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  InfoOutlined as InfoIcon,
  LocalOffer as LocalOfferIcon
} from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable from "../../components/admin/DataTable";
import SearchBarWithFilter from "../../components/admin/SearchBar";
import ConfirmModal from "../../components/common/Confirm";
import { fetchOffers, updateOffer, deleteOffer } from "../../redux/slices/admin/offersSlice";
import OfferModal from "../../components/admin/modal/OfferModal";

// ── Constants ───────────────────────────────────────────────────────────────
const OFFER_FILTER_OPTIONS = [
  { value: "all",   label: "All Offers"   },
  { value: "true",  label: "Active Only"  },
  { value: "false", label: "Inactive Only" },
];

const EXPIRY_DAYS_WARNING = 7; // highlight offers expiring within this many days

function daysUntilExpiry(endDate) {
  if (!endDate) return null;
  const diff = (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}

// ── Stat Card ────────────────────────────────────────────────────────────────
const SAFE_COLORS = {
  success: { border: "#c8e6c9", bg: "#f1f8e9", text: "success.main" },
  warning: { border: "#ffe0b2", bg: "#fff8e1", text: "warning.main" },
  error:   { border: "#ffcdd2", bg: "#fff5f5", text: "error.main"   },
  info:    { border: "#b3e5fc", bg: "#e3f2fd", text: "info.main"    },
  default: { border: "#e0e0e0", bg: "#fafafa", text: "text.secondary" },
  grey:    { border: "#e0e0e0", bg: "#fafafa", text: "text.primary"  },
};

function StatCard({ label, value, color = "grey", sub }) {
  const c = SAFE_COLORS[color] || SAFE_COLORS.grey;
  return (
    <Paper elevation={0} sx={{
      p: 2, flex: 1, borderRadius: 3, textAlign: "center",
      border: `1.5px solid ${c.border}`,
      bgcolor: c.bg, minWidth: 110,
    }}>
      <Typography variant="h5" fontWeight="bold" color={c.text}>{value ?? "—"}</Typography>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      {sub && <Typography variant="caption" color={c.text} fontWeight="bold">{sub}</Typography>}
    </Paper>
  );
}

// ── Offer Detail Modal ───────────────────────────────────────────────────────
function OfferDetailModal({ open, onClose, offer }) {
  if (!offer) return null;
  const days = daysUntilExpiry(offer.end_date);
  const expired = days !== null && days < 0;
  const expiring = days !== null && days >= 0 && days <= EXPIRY_DAYS_WARNING;

  const rows = [
    ["ID",            `#${offer.id}`],
    ["Title",         offer.title],
    ["Description",   offer.description || "—"],
    ["Type",          offer.discount_type === "percentage" ? "Percentage (%)" : "Fixed Amount (₹)"],
    ["Discount",      offer.discount_type === "percentage" ? `${offer.discount_value}%` : `₹${offer.discount_value}`],
    ["Max Cap",       offer.max_discount ? `₹${offer.max_discount}` : "No cap"],
    ["Target",        offer.service_name ? `Service: ${offer.service_name}` : "Global (All Services)"],
    ["Valid From",    offer.start_date],
    ["Valid Until",   offer.end_date],
    ["Status",        offer.is_active ? "Active" : "Inactive"],
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: "bold", pb: 0 }}>
        Offer Details — {offer.title}
      </DialogTitle>
      <Divider sx={{ mt: 1 }} />
      <DialogContent>
        {(expired || expiring) && (
          <Chip
            size="small"
            label={expired ? "Expired" : `Expiring in ${days} day${days === 1 ? "" : "s"}`}
            color={expired ? "error" : "warning"}
            sx={{ mb: 2, fontWeight: "bold" }}
          />
        )}
        <Stack spacing={1} mt={1}>
          {rows.map(([label, val]) => (
            <Box key={label} display="flex" justifyContent="space-between" py={0.5}
              sx={{ borderBottom: "1px solid #f0f0f0" }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
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

// ── Main Component ───────────────────────────────────────────────────────────
export default function OffersManager() {
  const dispatch = useDispatch();
  const { list: offers, loading, totalCount, actionLoading } = useSelector((s) => s.offers);

  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");   // "all" | "true" | "false"
  const [page, setPage]                 = useState(1);
  const rowsPerPage                     = 10;

  // Modals
  const [modalOpen, setModalOpen]               = useState(false);
  const [selectedOffer, setSelectedOffer]       = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [offerToDelete, setOfferToDelete]       = useState(null);
  const [detailOpen, setDetailOpen]             = useState(false);
  const [detailOffer, setDetailOffer]           = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = {
      page,
      search:    searchTerm || undefined,
      is_active: statusFilter !== "all" ? statusFilter : undefined,
    };
    dispatch(fetchOffers(params));
  }, [dispatch, page, searchTerm, statusFilter]);

  const resetPage = () => setPage(1);
  // ── Derived Stats ──────────────────────────────────────────────────────────
  const activeCount   = useMemo(() => (offers || []).filter((o) => o.is_active).length, [offers]);
  const inactiveCount = useMemo(() => (offers || []).filter((o) => !o.is_active).length, [offers]);
  const expiringSoon  = useMemo(() => (offers || []).filter((o) => {
    const d = daysUntilExpiry(o.end_date);
    return d !== null && d >= 0 && d <= EXPIRY_DAYS_WARNING;
  }).length, [offers]);
  const expiredCount  = useMemo(() => (offers || []).filter((o) => {
    const d = daysUntilExpiry(o.end_date);
    return d !== null && d < 0;
  }).length, [offers]);
  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggleStatus = async (offer) => {
    try {
      await dispatch(updateOffer({ id: offer.id, data: { is_active: !offer.is_active } })).unwrap();
      toast.success(`Offer "${offer.title}" ${!offer.is_active ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleConfirmDelete = async () => {
    if (!offerToDelete) return;
    try {
      await dispatch(deleteOffer(offerToDelete.id)).unwrap();
      toast.success("Offer deleted successfully");
    } catch {
      toast.error("Failed to delete offer");
    } finally {
      setDeleteConfirmOpen(false);
      setOfferToDelete(null);
    }
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    { key: "id", label: "ID", sortable: true },
    {
      key: "title",
      label: "Offer Title",
      sortable: true,
      render: (row) => {
        const days = daysUntilExpiry(row.end_date);
        const expired  = days !== null && days < 0;
        const expiring = days !== null && days >= 0 && days <= EXPIRY_DAYS_WARNING;
        return (
          <Box>
            <Typography variant="body2" fontWeight="bold">{row.title}</Typography>
            {expired  && <Chip size="small" label="Expired"  color="error"   sx={{ fontSize: "0.65rem", height: 18, mt: 0.3 }} />}
            {expiring && <Chip size="small" label={`Expires in ${days}d`} color="warning" sx={{ fontSize: "0.65rem", height: 18, mt: 0.3 }} />}
          </Box>
        );
      },
    },
    {
      key: "discount",
      label: "Discount",
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {row.discount_type === "percentage" ? `${row.discount_value}%` : `₹${row.discount_value}`}
          </Typography>
          {row.max_discount && (
            <Typography variant="caption" color="text.secondary">
              Cap: ₹{row.max_discount}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: "target",
      label: "Target",
      render: (row) =>
        row.service_name
          ? <Chip size="small" label={row.service_name} color="primary" variant="outlined" />
          : <Chip size="small" label="Global" variant="outlined" />,
    },
    {
      key: "period",
      label: "Validity",
      render: (row) => (
        <Typography variant="caption" color="text.secondary">
          {row.start_date}<br />→ {row.end_date}
        </Typography>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Switch
            size="small"
            checked={row.is_active}
            onChange={() => handleToggleStatus(row)}
            disabled={actionLoading}
          />
          <Chip
            size="small"
            label={row.is_active ? "Active" : "Inactive"}
            color={row.is_active ? "success" : "default"}
            variant="outlined"
          />
        </Stack>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton size="small" color="info"
              onClick={() => { setDetailOffer(row); setDetailOpen(true); }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary"
              onClick={() => { setSelectedOffer(row); setModalOpen(true); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error"
              onClick={() => { setOfferToDelete(row); setDeleteConfirmOpen(true); }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box p={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <LocalOfferIcon color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h4" fontFamily="monospace" fontWeight="bold">
              Offers Manager
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage promotional offers and discount coupons
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setSelectedOffer(null); setModalOpen(true); }}
          sx={{ backgroundColor: "#ffcc00", color: "#000", "&:hover": { backgroundColor: "#e2b600" }, textTransform: "none", fontWeight: "bold", borderRadius: 2 }}
        >
          Create Offer
        </Button>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
        <StatCard label="Total (page)"  value={offers?.length}  color="grey"    />
        <StatCard label="Active"        value={activeCount}     color="success" />
        <StatCard label="Inactive"      value={inactiveCount}   color="default" />
        <StatCard label="Expiring Soon" value={expiringSoon}    color="warning" />
        <StatCard label="Expired"       value={expiredCount}    color="error"   />
      </Stack>

      {/* Search + Status Filter */}
      <SearchBarWithFilter
        placeholder="Search offers by title..."
        onSearch={(val) => { setSearchTerm(val); resetPage(); }}
        onFilterChange={(val) => { setStatusFilter(val); resetPage(); }}
        filterOptions={OFFER_FILTER_OPTIONS}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        rows={offers || []}
        loading={loading}
        count={Math.ceil(totalCount / rowsPerPage)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        rowsPerPage={rowsPerPage}
        emptyMessage="No offers found. Create one to get started!"
      />

      {/* Delete Confirm */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Offer"
        message={`Are you sure you want to delete "${offerToDelete?.title}"? This cannot be undone.`}
        color="error"
        confirmLabel="Delete"
      />

      {/* Create / Edit Modal */}
      <OfferModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        offer={selectedOffer}
      />

      {/* Detail Modal */}
      <OfferDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        offer={detailOffer}
      />
    </Box>
  );
}
