// src/pages/user/Home.jsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Grid, Paper, Container } from "@mui/material";
import ProviderApplicationModal from "../../components/provider/ApplicationForm";
import ProviderStatusModal from "../../components/provider/ProviderStatusModal";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchServices } from "../../redux/slices/serviceSlice";
import { fetchProviderApplicationStatus } from "../../redux/slices/user/userSlice";
import { useNavigate } from "react-router-dom";

import { setProvider } from "../../redux/slices/authSlice"; // import the action

// assets
import moreImg from "../../assets/user/home/more.png";
import ruServiceProvider from "../../assets/user/home/ru-service-provider.png";
import earningsIcon from "../../assets/user/home/partner/Increase-Your-Earnings.png";
import productivityIcon from "../../assets/user/home/partner/Improve-Productivity.png";
import customerBaseIcon from "../../assets/user/home/partner/Large-Customer-Base.png";

// ------------------- Reusable Components ------------------- //
const ServiceCard = ({ name, icon, isMore }) => (
  <Paper
    sx={{
      width: 130,
      height: 140,
      textAlign: "center",
      backgroundColor: "white",
      borderRadius: "10px",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      "&:hover": { backgroundColor: "#f9f9f9" },
      p: isMore ? 1 : 0,
    }}
  >
    <Box
      component="img"
      src={icon}
      alt={name}
      sx={{ width: 60, height: 60, objectFit: "contain", mb: isMore ? 1 : 2, pt: isMore ? 0 : 2 }}
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

const BenefitItem = ({ icon, title, description }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
    <Box component="img" src={icon} alt={title} sx={{ width: 40, height: 40, mr: 2 }} />
    <Box>
      <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
      <Typography variant="body2">{description}</Typography>
    </Box>
  </Box>
);

// ------------------- Home Component ------------------- //

const Home = () => {
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list: categories } = useSelector((state) => state.categories);
  const { list: services, loading: servicesLoading, error: servicesError } = useSelector((state) => state.services);
  const { providerApplicationStatus, rejectionReason} = useSelector((state) => state.user);
  const { isProvider } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchServices());
    dispatch(fetchProviderApplicationStatus());
  }, [dispatch]);

  useEffect(() => {
  if (providerApplicationStatus?.toLowerCase() === "approved") {
    dispatch(setProvider(true));
  }
}, [providerApplicationStatus, dispatch]);

  // Normalize status string
  const normalizedStatus = providerApplicationStatus?.toLowerCase();

  const renderCTAButton = () => {
    if (isProvider && normalizedStatus === "approved") {
      return (
        <Button
          variant="contained"
          onClick={() => navigate("/provider/dashboard")}
          sx={{
            backgroundColor: "green",
            ":hover": { backgroundColor: "darkgreen" },
            color: "white",
            textTransform: "none",
            px: 3,
            mb: 3,
            borderRadius: "9px"
          }}
        >
          Go to Provider
        </Button>
      );
    }

    else if (normalizedStatus === "pending") {
      return (
        <Button
          variant="contained"
          disabled
          sx={{
            backgroundColor: "#ff9800",
            color: "white",
            textTransform: "none",
            px: 3,
            mb: 3,
            borderRadius: "9px"
          }}
        >
          Application Pending
        </Button>
      );
    }

    else if (normalizedStatus === "rejected") {
      return (
        <Button
          variant="contained"
          onClick={() => setApplicationModalOpen(true)}
          sx={{
            backgroundColor: "red",
            ":hover": { backgroundColor: "darkred" },
            color: "white",
            textTransform: "none",
            px: 3,
            mb: 3,
            borderRadius: "9px"
          }}
        >
          Application Rejected - Retry
        </Button>
      );
    }

      // else if (!providerApplicationStatus ) {
      else if (!providerApplicationStatus ) {
      return (
        <Button
          variant="contained"
          onClick={() => setApplicationModalOpen(true)}
          sx={{
            backgroundColor: "#007bff",
            ":hover": { backgroundColor: "black" },
            color: "yellow",
            textTransform: "none",
            px: 3,
            mb: 3,
            borderRadius: "9px"
          }}
        >
          Register as Partner
        </Button>
      );
    }

    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Popular Services */}
      <Typography variant="h5" fontWeight="bold" mb={3}>Popular Services</Typography>
      {servicesLoading ? (
        <Typography>Loading services...</Typography>
      ) : servicesError ? (
        <Typography color="error">Failed to load services</Typography>
      ) : (
        <Grid container spacing={2}>
          {services.slice(0, 9).map((srv) => (
            <Grid item xs={6} sm={4} md={2} key={srv.id}>
              <ServiceCard name={srv.name} icon={srv.icon || ""} />
            </Grid>
          ))}
          <Grid item xs={6} sm={4} md={2}>
            <ServiceCard name="More Services" icon={moreImg} isMore />
          </Grid>
        </Grid>
      )}

      {/* Call to Action */}
      <Box
        sx={{
          mt: 6,
          p: 4,
          backgroundColor: "white",
          border: "2px solid #f2b705",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap"
        }}
      >
        <Box sx={{ flex: 1, minWidth: 250, pr: { md: 4, xs: 0 } }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ textTransform: "uppercase" }}>
            Are you a service expert?
          </Typography>
          <Typography variant="body2" mb={2}>Join world's largest service network</Typography>

          {renderCTAButton()}

          <BenefitItem icon={earningsIcon} title="Increase Your Earnings" description="With HOME LIFT, you earn more than your cost and minimize efforts." />
          <BenefitItem icon={productivityIcon} title="Improve Productivity" description="Easy scheduling, invoicing, and recommendations to boost your workflow." />
          <BenefitItem icon={customerBaseIcon} title="Large Customer Base" description="Reach a much larger customer base without marketing costs." />
        </Box>

        <Box
          component="img"
          src={ruServiceProvider}
          alt="Service Experts"
          sx={{ flex: 1, maxWidth: 350, borderRadius: "10px", mt: { xs: 3, md: 0 } }}
        />
      </Box>

      {/* Modals */}
      <ProviderApplicationModal
        open={applicationModalOpen}
        onClose={() => setApplicationModalOpen(false)}
        categories={categories}
        services={services}
      />

      <ProviderStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        status={providerApplicationStatus}
        rejectionReason={rejectionReason}
      />
    </Container>
  );
};

export default Home;
