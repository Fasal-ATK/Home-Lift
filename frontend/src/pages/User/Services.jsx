import React, { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  Box,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  Skeleton,
  Chip,
  Fade,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import GridViewIcon from "@mui/icons-material/GridView";
import TuneIcon from "@mui/icons-material/Tune";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchServices } from "../../redux/slices/serviceSlice";
import allCategory from "../../assets/services/All.png";
import useDebounce from "../../hooks/useDebounce";
import ServiceCard from "../../components/common/ServiceCard";

const PAGE_SIZE = 14;

function Services() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { list: categories, isFullList: categoriesFull } = useSelector(
    (state) => state.categories
  );
  const {
    list: services,
    loading: servicesLoading,
    totalCount,
  } = useSelector((state) => state.services);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (!categoriesFull) dispatch(fetchCategories({ no_pagination: true }));
  }, [dispatch, categoriesFull]);

  useEffect(() => {
    const params = { page, page_size: PAGE_SIZE };
    if (debouncedSearchQuery.trim()) params.search = debouncedSearchQuery.trim();
    if (selectedCategory !== null) params.category = selectedCategory;
    dispatch(fetchServices(params));
  }, [dispatch, debouncedSearchQuery, selectedCategory, page]);

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
    }
  }, [location.state]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPage(1);
  };

  const handleServiceClick = (srv) => {
    navigate("/service-details", { state: { service: srv } });
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const selectedCategoryName =
    selectedCategory === null
      ? "All Services"
      : categories.find((c) => c.id === selectedCategory)?.name ?? "";

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #f8faff 0%, #f0f4ff 40%, #fafafa 100%)",
        pb: 8,
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 4 }}>

        {/* ── Hero Header ─────────────────────────────── */}
        <Box sx={{ mb: 5, textAlign: "center" }}>
          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              background:
                "linear-gradient(135deg, #1e1b4b 0%, #4f46e5 60%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: -1,
              mb: 1,
            }}
          >
            Our Services
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 480, mx: "auto" }}
          >
            Discover professional home services tailored to your needs. Book in
            minutes.
          </Typography>
        </Box>

        {/* ── Search Bar ──────────────────────────────── */}
        <Box
          sx={{
            mb: 4,
            maxWidth: 680,
            mx: "auto",
            position: "relative",
          }}
        >
          <TextField
            fullWidth
            placeholder="Search for any service…"
            value={searchQuery}
            onChange={handleSearchChange}
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#6366f1", fontSize: 22 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={clearSearch}
                    sx={{ color: "#94a3b8" }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                background: "white",
                boxShadow: "0 4px 24px rgba(99,102,241,0.12)",
                fontSize: "1rem",
                "& fieldset": { borderColor: "rgba(99,102,241,0.2)" },
                "&:hover fieldset": { borderColor: "#6366f1" },
                "&.Mui-focused fieldset": {
                  borderColor: "#6366f1",
                  borderWidth: 2,
                },
              },
            }}
          />
          {/* Glow effect under search bar */}
          <Box
            sx={{
              position: "absolute",
              inset: -4,
              borderRadius: "20px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              opacity: searchQuery ? 0.12 : 0,
              transition: "opacity 0.3s",
              pointerEvents: "none",
              zIndex: -1,
              filter: "blur(8px)",
            }}
          />
        </Box>

        {/* ── Category filter toggle ───────────────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <TuneIcon sx={{ color: "#6366f1", fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700} color="#1e1b4b">
              Filter by Category
            </Typography>
            {selectedCategory !== null && (
              <Chip
                label={selectedCategoryName}
                size="small"
                onDelete={() => handleCategorySelect(null)}
                sx={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  "& .MuiChip-deleteIcon": {
                    color: "rgba(255,255,255,0.8)",
                  },
                }}
              />
            )}
          </Box>
          <IconButton
            onClick={() => setShowFilters((p) => !p)}
            sx={{
              bgcolor: showFilters ? "rgba(99,102,241,0.1)" : "transparent",
              color: "#6366f1",
              borderRadius: "10px",
              border: "1.5px solid",
              borderColor: showFilters
                ? "#6366f1"
                : "rgba(99,102,241,0.25)",
              "&:hover": { bgcolor: "rgba(99,102,241,0.12)" },
            }}
          >
            <GridViewIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* ── Category Grid ───────────────────────────── */}
        <Fade in={showFilters} unmountOnExit>
          <Box
            sx={{
              mb: 4,
              p: 2.5,
              borderRadius: "20px",
              background: "white",
              boxShadow: "0 2px 16px rgba(99,102,241,0.07)",
              border: "1.5px solid rgba(99,102,241,0.08)",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 4, sm: 3, md: 2 }}>
                <ServiceCard
                  name="All Services"
                  icon={allCategory}
                  onClick={() => handleCategorySelect(null)}
                  selected={selectedCategory === null}
                />
              </Grid>
              {categories.map((cat) => (
                <Grid size={{ xs: 4, sm: 3, md: 2 }} key={cat.id}>
                  <ServiceCard
                    name={cat.name}
                    icon={cat.icon}
                    onClick={() => handleCategorySelect(cat.id)}
                    selected={selectedCategory === cat.id}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>

        {/* ── Section Header ───────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight={800}
              color="#1e1b4b"
              sx={{ lineHeight: 1.1 }}
            >
              {debouncedSearchQuery
                ? `Results for "${debouncedSearchQuery}"`
                : selectedCategoryName}
            </Typography>
            {!servicesLoading && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {totalCount} service{totalCount !== 1 ? "s" : ""} available
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── Services Grid ────────────────────────────── */}
        <Grid container spacing={2.5}>
          {servicesLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={i}>
                <Skeleton
                  variant="rounded"
                  height={200}
                  sx={{ borderRadius: "18px" }}
                  animation="wave"
                />
              </Grid>
            ))
          ) : services.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  textAlign: "center",
                  py: 10,
                  px: 4,
                  borderRadius: "24px",
                  background: "white",
                  border: "1.5px dashed rgba(99,102,241,0.25)",
                }}
              >
                <Box sx={{ fontSize: 56, mb: 2 }}>🔍</Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="#1e1b4b"
                  mb={0.5}
                >
                  No services found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 340, mx: "auto" }}
                >
                  {debouncedSearchQuery
                    ? `We couldn't find anything for "${debouncedSearchQuery}". Try a different keyword or browse by category.`
                    : "No services available in this category yet."}
                </Typography>
                {(debouncedSearchQuery || selectedCategory !== null) && (
                  <Box
                    component="span"
                    onClick={() => {
                      clearSearch();
                      handleCategorySelect(null);
                    }}
                    sx={{
                      display: "inline-block",
                      mt: 3,
                      px: 3,
                      py: 1,
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                    }}
                  >
                    Clear filters
                  </Box>
                )}
              </Box>
            </Grid>
          ) : (
            services.map((srv) => (
              <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={srv.id}>
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

        {/* ── Pagination ───────────────────────────────── */}
        {totalPages > 1 && (
          <Fade in>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, val) => {
                  setPage(val);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                shape="rounded"
                size="large"
                sx={{
                  "& .MuiPaginationItem-root": {
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  },
                  "& .Mui-selected": {
                    background:
                      "linear-gradient(135deg, #6366f1, #8b5cf6) !important",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
                  },
                }}
              />
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  );
}

export default Services;
