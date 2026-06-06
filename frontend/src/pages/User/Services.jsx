import React, { useEffect, useState } from "react";
import { Grid, Paper, Typography, Box, Container, TextField, InputAdornment, IconButton, Button, Pagination } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchServices } from "../../redux/slices/serviceSlice";
import allCategory from "../../assets/services/All.png";
import useDebounce from "../../hooks/useDebounce";
import ServiceCard from "../../components/common/ServiceCard";

function Services() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { list: categories, isFullList: categoriesFull } = useSelector((state) => state.categories);
  const { list: services, loading: servicesLoading, totalCount } = useSelector(
    (state) => state.services
  );

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategories, setShowCategories] = useState(true);
  
  // Pagination state (if backend uses it)
  const [page, setPage] = useState(1);

  // Use debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    // Categories are still fetched completely for the category bar
    if (!categoriesFull) dispatch(fetchCategories({ no_pagination: true }));
  }, [dispatch, categoriesFull]);

  useEffect(() => {
    // Fetch services from backend using search query and category
    const params = {
      page: page,
      page_size: 14,
    };
    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim();
    }
    if (selectedCategory !== null) {
      params.category = selectedCategory;
    }
    dispatch(fetchServices(params));
  }, [dispatch, debouncedSearchQuery, selectedCategory, page]);

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
    }
  }, [location.state]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset page on new search
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPage(1);
  };

  // ✅ Navigate to ServiceBooking when service card clicked
  const handleServiceClick = (srv) => {
    navigate("/service-details", { state: { service: srv } });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Search services
      </Typography>

      <Paper
        component="form"
        onSubmit={(e) => e.preventDefault()}
        elevation={0}
        sx={{
          mb: 3,
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          borderRadius: 3,
          bgcolor: "background.paper",
          boxShadow: "0 1px 8px rgba(15, 23, 42, 0.08)",
        }}
      >
        <TextField
          fullWidth
          placeholder="Search services by name or description..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch}>
                  <ClearIcon fontSize="small" sx={{ color: "text.disabled" }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Paper>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Categories
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowCategories((prev) => !prev)}
          startIcon={showCategories ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ textTransform: "none" }}
        >
          {showCategories ? "Hide categories" : "Show categories"}
        </Button>
      </Box>

      {showCategories && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <ServiceCard
              name="All Services"
              icon={allCategory}
              onClick={() => setSelectedCategory(null)}
              selected={selectedCategory === null}
            />
          </Grid>

          {categories.map((cat) => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={cat.id}>
              <ServiceCard
                name={cat.name}
                icon={cat.icon}
                onClick={() => setSelectedCategory(cat.id)}
                selected={selectedCategory === cat.id}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h6" fontWeight="bold" mb={2}>
        {selectedCategory === null
          ? "All Services"
          : categories.find((c) => c.id === selectedCategory)?.name}
      </Typography>

      {/* Services */}
      <Grid container spacing={3} columns={14}>
        {servicesLoading ? (
          <Typography>Loading...</Typography>
        ) : services.length === 0 ? (
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 3,
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="h6" color="text.secondary">
                No services found for "{searchQuery}". Try a different search term or category.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          services.map((srv) => (
            <Grid size={{ xs: 14, sm: 7, md: 2 }} key={srv.id}>
              <ServiceCard
                name={srv.name}
                icon={srv.icon}
                offer={srv.active_offer}
                price={srv.price}
                onClick={() => handleServiceClick(srv)}
              />
            </Grid>
          ))
        )}
      </Grid>

      {/* Pagination */}
      {totalCount > 14 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={Math.ceil(totalCount / 14)}
            page={page}
            onChange={(_, val) => {
              setPage(val);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            color="primary"
            shape="rounded"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
}

export default Services;
