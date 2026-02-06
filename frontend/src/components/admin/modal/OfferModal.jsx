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
    Percent as PercentIcon
} from "@mui/icons-material";
import { Stack } from "@mui/material";

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
        category: "",
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
                discount_type: offer.discount_type || "percentage",
                discount_value: offer.discount_value || "",
                max_discount: offer.max_discount || "",
                category: offer.category || "",
                service: offer.service || "",
                start_date: offer.start_date || "",
                end_date: offer.end_date || "",
            });
        } else {
            setFormData({
                title: "",
                description: "",
                discount_type: "percentage",
                discount_value: "",
                max_discount: "",
                category: "",
                service: "",
                start_date: "",
                end_date: "",
            });
        }
    }, [offer, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updates = { [name]: value };
        if (name === "category" && value) updates.service = "";
        if (name === "service" && value) updates.category = "";
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.discount_value || !formData.start_date || !formData.end_date) {
            toast.error("Please fill in all required fields");
            return;
        }

        const data = { ...formData };
        if (!data.category) delete data.category;
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
            toast.error(typeof err === "string" ? err : "Failed to save offer");
        }
    };

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
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <OfferIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                    {offer ? "Edit Promotion Offer" : "Configure New Promotion"}
                </Typography>
            </DialogTitle>
            <Divider />
            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ py: 3 }}>
                    <Grid container spacing={4}>
                        {/* Section 1: Basic Info */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
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
                                    label="Short Description"
                                    name="description"
                                    placeholder="Briefly explain the offer..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                    size="small"
                                />
                            </Stack>
                        </Grid>

                        {/* Section 2: Discount Profile */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                                DISCOUNT PROFILE
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Type"
                                        name="discount_type"
                                        value={formData.discount_type}
                                        onChange={handleChange}
                                        size="small"
                                    >
                                        <MenuItem value="percentage">Percentage (%)</MenuItem>
                                        <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Value"
                                        name="discount_value"
                                        type="number"
                                        value={formData.discount_value}
                                        onChange={handleChange}
                                        required
                                        size="small"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    {formData.discount_type === 'percentage' ? <PercentIcon fontSize="small" /> : <RupeeIcon fontSize="small" />}
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Maximum Discount Cap"
                                        name="max_discount"
                                        type="number"
                                        placeholder="Allow unlimited if empty"
                                        value={formData.max_discount}
                                        onChange={handleChange}
                                        size="small"
                                        helperText="Sets a ceiling for percentage-based discounts."
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
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                        </Grid>

                        {/* Section 3: Targeting */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                                TARGET AUDIENCE
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Target Category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><CategoryIcon fontSize="small" /></InputAdornment>
                                    }}
                                >
                                    <MenuItem value=""><em>Global Offer (All Categories)</em></MenuItem>
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    fullWidth
                                    select
                                    label="Target Specific Service"
                                    name="service"
                                    value={formData.service}
                                    onChange={handleChange}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><ServiceIcon fontSize="small" /></InputAdornment>
                                    }}
                                >
                                    <MenuItem value=""><em>Global Offer (All Services)</em></MenuItem>
                                    {services.map((ser) => (
                                        <MenuItem key={ser.id} value={ser.id}>{ser.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Stack>
                        </Grid>

                        {/* Section 4: Period */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                                VALIDITY PERIOD
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
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
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><DateIcon fontSize="small" /></InputAdornment>
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
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
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><DateIcon fontSize="small" /></InputAdornment>
                                        }}
                                    />
                                </Grid>
                            </Grid>
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
