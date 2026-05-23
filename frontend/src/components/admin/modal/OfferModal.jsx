import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    Box,
    Typography,
    CircularProgress,
    Divider,
    InputAdornment,
    Paper,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { createOffer, updateOffer, fetchOffers } from "../../../redux/slices/admin/offersSlice";
import { fetchCategories } from "../../../redux/slices/categorySlice";
import { fetchServices } from "../../../redux/slices/serviceSlice";
import { toast } from "react-toastify";
import {
    LocalOffer as OfferIcon,
    Category as CategoryIcon,
    Build as ServiceIcon,
    Event as DateIcon,
    CurrencyRupee as RupeeIcon,
    Percent as PercentIcon,
    Close as CloseIcon
} from "@mui/icons-material";
import { Stack, IconButton } from "@mui/material";

export default function OfferModal({ open, handleClose, offer = null }) {
    const dispatch = useDispatch();
    const { actionLoading } = useSelector((state) => state.offers);
    const { list: categories } = useSelector((state) => state.categories);
    const { list: services } = useSelector((state) => state.services);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        max_discount: "",
        service: "",
        start_date: "",
        end_date: "",
    });

    useEffect(() => {
        if (open) {
            dispatch(fetchCategories());
            dispatch(fetchServices());
        }
    }, [dispatch, open]);

    useEffect(() => {
        if (offer) {
            setFormData({
                title: offer.title || "",
                description: offer.description || "",
                discount_type: "percentage", // Always percentage
                discount_value: offer.discount_value || "",
                max_discount: offer.max_discount || "",
                service: offer.service || "",
                start_date: offer.start_date || "",
                end_date: offer.end_date || "",
            });
        } else {
            setFormData({
                title: "",
                description: "",
                discount_type: "percentage", // Always percentage
                discount_value: "",
                max_discount: "",
                service: "",
                start_date: "",
                end_date: "",
            });
        }
    }, [offer, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updates = { [name]: value };
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.discount_value || !formData.start_date || !formData.end_date) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (Number(formData.discount_value) < 0) {
            toast.error("Discount value cannot be negative");
            return;
        }

        if (Number(formData.discount_value) > 100) {
            toast.error("Percentage discount cannot exceed 100%");
            return;
        }

        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            toast.error("End date cannot be earlier than start date");
            return;
        }

        if (!offer) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(formData.start_date);
            if (startDate < today) {
                toast.error("Start date cannot be in the past");
                return;
            }
        }

        const data = { ...formData };
        if (!data.service) delete data.service;
        if (!data.max_discount) delete data.max_discount;

        try {
            if (offer) {
                await dispatch(updateOffer({ id: offer.id, data })).unwrap();
                toast.success("Offer updated successfully");
            } else {
                await dispatch(createOffer(data)).unwrap();
                toast.success("Offer created successfully");
            }
            handleClose();
        } catch (err) {
            // Check if the error object has specific validation errors from the backend
            if (err && typeof err === 'object') {
                const firstKey = Object.keys(err)[0];
                const msg = Array.isArray(err[firstKey]) ? err[firstKey][0] : err[firstKey];
                toast.error(msg || "Failed to save offer");
            } else {
                toast.error(typeof err === "string" ? err : "Failed to save offer");
            }
        }
    };

    const minDate = offer ? undefined : new Date().toISOString().split('T')[0];
    const minEndDate = formData.start_date || minDate;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }
            }}
        >
            <DialogTitle sx={{ pb: 1, pt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: 'primary.50', p: 1, borderRadius: 2, display: 'flex' }}>
                        <OfferIcon color="primary" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
                            {offer ? "Edit Promotion Offer" : "Configure New Promotion"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {offer ? "Modify the details of your existing offer." : "Create a new percentage-based discount."}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleClose} size="small" sx={{ bgcolor: 'grey.100' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <Divider />
            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ py: 3 }}>
                    <Grid container spacing={3}>
                        {/* Column 1: Basic Info & Targeting */}
                        <Grid item xs={12} md={6}>
                            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%', borderColor: 'grey.200' }}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary" sx={{ mb: 2 }}>
                                    GENERAL INFORMATION
                                </Typography>
                                <Stack spacing={2.5}>
                                    <TextField
                                        fullWidth
                                        label="Promotion Title"
                                        name="title"
                                        placeholder="e.g. Festival Special Discount"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        size="small"
                                    />
                                    
                                    <TextField
                                        fullWidth
                                        select
                                        label="Target Specific Service"
                                        name="service"
                                        value={formData.service}
                                        onChange={handleChange}
                                        size="small"
                                        helperText="Select a service or apply globally to all services."
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><ServiceIcon fontSize="small" /></InputAdornment>
                                        }}
                                    >
                                        <MenuItem value=""><em>Global Offer (All Services)</em></MenuItem>
                                        {services.map((ser) => (
                                            <MenuItem key={ser.id} value={ser.id}>{ser.name}</MenuItem>
                                        ))}
                                    </TextField>

                                    <TextField
                                        fullWidth
                                        label="Short Description"
                                        name="description"
                                        placeholder="Briefly explain the offer..."
                                        value={formData.description}
                                        onChange={handleChange}
                                        multiline
                                        rows={2}
                                        size="small"
                                    />
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Column 2: Discount Profile & Period */}
                        <Grid item xs={12} md={6}>
                            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%', borderColor: 'grey.200', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary" sx={{ mb: 2 }}>
                                        DISCOUNT PROFILE
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Percentage (%)"
                                                name="discount_value"
                                                type="number"
                                                value={formData.discount_value}
                                                onChange={handleChange}
                                                required
                                                size="small"
                                                helperText="(1 - 100)"
                                                InputProps={{
                                                    inputProps: { min: 1, max: 100 },
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PercentIcon fontSize="small" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Max Cap (₹)"
                                                name="max_discount"
                                                type="number"
                                                placeholder="e.g. 200"
                                                value={formData.max_discount}
                                                onChange={handleChange}
                                                size="small"
                                                helperText="Leave empty for unlimited."
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <RupeeIcon fontSize="small" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary" sx={{ mb: 2 }}>
                                        VALIDITY PERIOD
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Starts From"
                                                name="start_date"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={formData.start_date}
                                                onChange={handleChange}
                                                required
                                                size="small"
                                                inputProps={{ min: minDate }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Ends At"
                                                name="end_date"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={formData.end_date}
                                                onChange={handleChange}
                                                required
                                                size="small"
                                                inputProps={{ min: minEndDate }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2.5, px: 3, bgcolor: '#fcfcfc' }}>
                    <Button onClick={handleClose} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>
                        Discard
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={actionLoading}
                        sx={{
                            borderRadius: 2,
                            px: 4,
                            backgroundColor: "#1976d2",
                            fontWeight: 'bold',
                            "&:hover": { backgroundColor: "#1565c0" }
                        }}
                    >
                        {actionLoading ? <CircularProgress size={24} color="inherit" /> : offer ? "Save Changes" : "Create Offer"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
