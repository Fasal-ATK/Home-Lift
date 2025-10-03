import React, { useState } from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import { useSelector } from "react-redux";
import allCategory from "../../assets/services/All.png";

const Card = ({ name, icon, onClick, selected }) => (
  <Paper
    onClick={onClick}
    sx={{
      width: 130,
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
      sx={{ textAlign: "center", whiteSpace: "normal", wordBreak: "break-word" }}
    >
      {name}
    </Typography>
  </Paper>
);

function Services() {
  const { list: categories } = useSelector((state) => state.categories);
  const { list: services } = useSelector((state) => state.services);

  // Track selected category (null means "All")
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filter services based on selected category
  const filteredServices =
    selectedCategory === null
      ? services
      : services.filter((srv) => srv.category === selectedCategory);

  return (
    <div>
      <h1>Services</h1>

      {/* Categories */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Static All Services button */}
        <Grid item xs={6} sm={4} md={2}>
          <Card
            name="All Services"
            icon={allCategory}
            onClick={() => setSelectedCategory(null)}
            selected={selectedCategory === null}
          />
        </Grid>

        {/* Dynamic categories from Redux */}
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

      {/* Selected category services */}
      <h2>
        {selectedCategory === null
          ? "All Services"
          : categories.find((c) => c.id === selectedCategory)?.name}
      </h2>

      <Grid container spacing={2}>
        {filteredServices.map((srv) => (
          <Grid item xs={6} sm={4} md={2} key={srv.id}>
            <Card name={srv.name} icon={srv.icon} />
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default Services;
