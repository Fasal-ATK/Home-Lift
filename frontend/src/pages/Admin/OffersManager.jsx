import React, { useEffect, useState } from "react";
import { Box, Typography, Button, IconButton, Stack, Tooltip, Chip, Switch } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable from "../../components/admin/DataTable";
import SearchBarWithFilter from "../../components/admin/SearchBar";
import ConfirmModal from "../../components/common/Confirm";
import { fetchOffers, updateOffer, deleteOffer } from "../../redux/slices/admin/offersSlice";
import OfferModal from "../../components/admin/modal/OfferModal";

export default function OffersManager() {
  const dispatch = useDispatch();
  const { list: offers, loading, totalCount, actionLoading } = useSelector((state) => state.offers);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchOffers({ page, search: searchTerm }));
  }, [dispatch, page, searchTerm]);

  const handleToggleStatus = async (offer) => {
    try {
      await dispatch(updateOffer({ id: offer.id, data: { is_active: !offer.is_active } })).unwrap();
      toast.success(`Offer "${offer.title}" ${!offer.is_active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteClick = (offer) => {
    setOfferToDelete(offer);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (offerToDelete) {
      try {
        await dispatch(deleteOffer(offerToDelete.id)).unwrap();
        toast.success("Offer deleted successfully");
      } catch (err) {
        toast.error("Failed to delete offer");
      } finally {
        setDeleteConfirmOpen(false);
        setOfferToDelete(null);
      }
    }
  };

  const handleEditClick = (offer) => {
    setSelectedOffer(offer);
    setModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedOffer(null);
    setModalOpen(true);
  };

  const columns = [
    { key: "id", label: "ID", sortable: true },
    { key: "title", label: "Offer Title", sortable: true },
    {
      key: "discount",
      label: "Discount",
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {row.discount_type === "percentage" ? `${row.discount_value}%` : `₹${row.discount_value}`}
          </Typography>
          {row.max_discount && (
            <Typography variant="caption" color="textSecondary">
              Cap: ₹{row.max_discount}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: "target",
      label: "Targeting",
      render: (row) => {
        if (row.service_name) return <Chip size="small" label={`Service: ${row.service_name}`} color="primary" variant="outlined" />;
        if (row.category_name) return <Chip size="small" label={`Category: ${row.category_name}`} color="secondary" variant="outlined" />;
        return <Chip size="small" label="Global" variant="outlined" />;
      }
    },
    {
      key: "period",
      label: "Validity",
      render: (row) => (
        <Typography variant="caption">
          {row.start_date} to {row.end_date}
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
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => handleEditClick(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Offers Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ backgroundColor: "#ffcc00", color: "#000", "&:hover": { backgroundColor: "#e2b600" } }}
        >
          Create Offer
        </Button>
      </Stack>

      <SearchBarWithFilter
        placeholder="Search offers..."
        onSearch={setSearchTerm}
        showFilter={false}
      />

      <DataTable
        columns={columns}
        rows={offers}
        loading={loading}
        count={Math.ceil(totalCount / 10)}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        totalItems={totalCount}
        emptyMessage="No offers found. Create one to get started!"
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Offer"
        message={`Are you sure you want to delete the offer "${offerToDelete?.title}"? This action cannot be undone.`}
        color="error"
        confirmLabel="Delete"
      />

      <OfferModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        offer={selectedOffer}
      />
    </Box>
  );
}
