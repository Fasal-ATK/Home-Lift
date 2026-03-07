import React, { useEffect, useState } from "react";
import { Grid, Paper, Typography, Box, Container } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom"; // ✅ Add this
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchServices } from "../../redux/slices/serviceSlice";
import allCategory from "../../assets/services/All.png";

import ServiceCard from "../../components/common/ServiceCard";

function Services() {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // ✅ Initialize navigate

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

  // ✅ Navigate to ServiceBooking when service card clicked
  const handleServiceClick = (srv) => {
    navigate("/service-details", { state: { service: srv } });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Categories
      </Typography>

      {/* Categories */}
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
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={srv.id}>
              <ServiceCard
                name={srv.name}
                icon={srv.icon}
                offer={srv.active_offer}
                price={srv.price}
                onClick={() => handleServiceClick(srv)} // ✅ Redirect with service data
              />
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}

export default Services;
