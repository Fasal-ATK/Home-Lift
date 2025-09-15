// src/pages/user/Home.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Container
} from "@mui/material";
import ProviderApplicationModal from "../../components/provider/ApplicationForm";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchServices } from "../../redux/slices/serviceSlice";

// assets
import moreImg from "../../assets/user/home/more.png";
import ruServiceProvider from "../../assets/user/home/ru-service-provider.png";

// Why Home Lift assets
import earningsIcon from "../../assets/user/home/partner/Increase-Your-Earnings.png";
import productivityIcon from "../../assets/user/home/partner/Improve-Productivity.png";
import customerBaseIcon from "../../assets/user/home/partner/Large-Customer-Base.png";

const Home = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { list: categories } = useSelector((state) => state.categories);
  const {
    list: services,
    loading: servicesLoading,
    error: servicesError
  } = useSelector((state) => state.services);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchServices());
  }, [dispatch]);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Services List */}
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        Popular Services
      </Typography>
      <Grid container spacing={2} justifyContent="flex-start">
        {servicesLoading ? (
          <Typography>Loading services...</Typography>
        ) : servicesError ? (
          <Typography color="error">Failed to load services</Typography>
        ) : (
          <>
            {services.slice(0, 9).map((srv) => (
              <Grid item xs={6} sm={4} md={2} key={srv.id}>
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
                    justifyContent: "space-between",
                    "&:hover": { backgroundColor: "#f9f9f9" }
                  }}
                >
                  {srv.icon ? (
                    <Box
                      component="img"
                      src={srv.icon}
                      alt={srv.name}
                      sx={{ pt : 2, width: 60, height: 60, objectFit: "contain" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        backgroundColor: "#eee",
                        borderRadius: "8px"
                      }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{
                      mb: 2,
                      width: "100%",
                      textAlign: "center",
                      whiteSpace: "normal",
                      wordBreak: "break-word"
                    }}
                  >
                    {srv.name}
                  </Typography>
                </Paper>
              </Grid>
            ))}

            {/* More Services Box */}
            <Grid item xs={6} sm={4} md={2}>
              <Paper
                sx={{
                  width: 140,
                  height: 140,
                  textAlign: "center",
                  backgroundColor: "white",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": { backgroundColor: "#f9f9f9" }
                }}
              >
                <Box
                  component="img"
                  src={moreImg}
                  alt="More Services"
                  sx={{ width: 60, height: 60, mb: 3 }}
                />
                <Typography variant="body2" fontWeight="bold">
                  More Services
                </Typography>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>

      {/* Call to Action with Benefits */}
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
        {/* Left Column */}
        <Box sx={{ flex: 1, minWidth: 250, pr: { md: 4, xs: 0, textAlign:'center' } }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            gutterBottom
            sx={{ textTransform: "uppercase" }}
          >
            Are you a service expert?
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Join world's largest service network
          </Typography>

          <Button
            variant="contained"
            onClick={handleOpenModal}
            sx={{
              backgroundColor: "#007bff",
              color: "yellow",
              textTransform: "none",
              px: 3,
              mb: 3,
              borderRadius: "9px",

            }}
          >
            Register as Partner
          </Button>

          {/* Benefits list */}
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
            <Box
              component="img"
              src={earningsIcon}
              alt="Increase Earnings"
              sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                Increase Your Earnings
              </Typography>
              <Typography variant="body2">
                With HOME LIFT, you earn more than your cost and minimize
                efforts.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
            <Box
              component="img"
              src={productivityIcon}
              alt="Improve Productivity"
              sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                Improve Productivity
              </Typography>
              <Typography variant="body2">
                Easy scheduling, invoicing, and recommendations to boost your
                workflow.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <Box
              component="img"
              src={customerBaseIcon}
              alt="Large Customer Base"
              sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                Large Customer Base
              </Typography>
              <Typography variant="body2">
                Reach a much larger customer base without marketing costs.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Column - Workers Image */}
        <Box
          component="img"
          src={ruServiceProvider}
          alt="Service Experts"
          sx={{
            flex: 1,
            maxWidth: 350,
            borderRadius: "10px",
            mt: { xs: 3, md: 0 }
          }}
        />
      </Box>

      {/* Modal */}
      <ProviderApplicationModal
        open={modalOpen}
        onClose={handleCloseModal}
        categories={categories}
        services={services}
      />
    </Container>
  );
};

export default Home;
