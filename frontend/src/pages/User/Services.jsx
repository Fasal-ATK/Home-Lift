import React, { useEffect, useState } from "react";
import { Grid, Paper, Typography, Box, Container } from "@mui/material";
import { useSelector, useDispatch } from "react-redux"; // ✅ <-- Add useDispatch
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchServices } from "../../redux/slices/serviceSlice";
import allCategory from "../../assets/services/All.png";

const Card = ({ name, icon, onClick, selected }) => (
  <Paper
    onClick={onClick}
    sx={{
      width: 120,
      height: 140,
      textAlign: "center",
      backgroundColor: selected ? "#f0f8ff" : "white",
      border: selected ? "2px solid #1976d2" : "1px solid #e0e0e0",
      borderRadius: "10px",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      "&:hover": { backgroundColor: "#f9f9f9" },
    }}
  >
    <Box
      component="img"
      src={icon}
      alt={name}
      sx={{
        width: 60,
        height: 60,
        objectFit: "contain",
        mb: 2,
      }}
    />
    <Typography
      variant="body2"
      fontWeight="bold"
      sx={{
        textAlign: "center",
        whiteSpace: "normal",
        wordBreak: "break-word",
      }}
    >
      {name}
    </Typography>
  </Paper>
);

function Services() {
  const dispatch = useDispatch(); // ✅ Correct hook

  const { list: categories } = useSelector((state) => state.categories);
  const { list: services, loading: servicesLoading } = useSelector(
    (state) => state.services
  );

  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (!categories.length) dispatch(fetchCategories());
    if (!services.length) dispatch(fetchServices());
  }, [dispatch, categories.length, services.length]);

  const filteredServices =
    selectedCategory === null
      ? services
      : services.filter((srv) => srv.category === selectedCategory);

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Categories
      </Typography>

      {/* Categories */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* All Services */}
        <Grid item xs={6} sm={4} md={2}>
          <Card
            name="All Services"
            icon={allCategory}
            onClick={() => setSelectedCategory(null)}
            selected={selectedCategory === null}
          />
        </Grid>

        {categories.map((cat) => (
          <Grid item xs={6} sm={4} md={2} key={cat.id}>
            <Card
              name={cat.name}
              icon={cat.icon}
              onClick={() => setSelectedCategory(cat.id)}
              selected={selectedCategory === cat.id}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" fontWeight="bold" mb={2}>
        {selectedCategory === null
          ? "All Services"
          : categories.find((c) => c.id === selectedCategory)?.name}
      </Typography>

      {/* Services */}
      <Grid container spacing={3}>
        {servicesLoading ? (
          <Typography>Loading...</Typography>
        ) : (
          filteredServices.map((srv) => (
            <Grid item xs={6} sm={4} md={2} key={srv.id}>
              <Card name={srv.name} icon={srv.icon} />
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}

export default Services;
