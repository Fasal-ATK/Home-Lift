// src/pages/user/Home.jsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Grid, Paper, Container, TextField, InputAdornment, Stack, useTheme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ProviderApplicationModal from "../../components/provider/ApplicationForm";
import ProviderStatusModal from "../../components/provider/ProviderStatusModal";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchServices } from "../../redux/slices/serviceSlice";
import { fetchPublicOffers } from "../../redux/slices/admin/offersSlice";
import { fetchProviderApplicationStatus } from "../../redux/slices/user/userSlice";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/common/Loader";

import { setProvider, setUser } from "../../redux/slices/authSlice";
import { ShowToast } from "../../components/common/Toast";
import { userService } from "../../services/apiServices";

// assets
import moreImg from "../../assets/user/home/more.png";
import ruServiceProvider from "../../assets/user/home/ru-service-provider.png";
import earningsIcon from "../../assets/user/home/partner/Increase-Your-Earnings.png";
import productivityIcon from "../../assets/user/home/partner/Improve-Productivity.png";
import customerBaseIcon from "../../assets/user/home/partner/Large-Customer-Base.png";

// ------------------- Reusable Components ------------------- //
import ServiceCard from "../../components/common/ServiceCard";

const BenefitItem = ({ icon, title, description }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2.5 }}>
    <Box
      sx={{
        width: 48,
        height: 48,
        mr: 2,
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Box component="img" src={icon} alt={title} sx={{ width: 28, height: 28 }} />
    </Box>
    <Box>
      <Typography variant="subtitle1" fontWeight="800" color="white" sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ lineHeight: 1.5 }}>{description}</Typography>
    </Box>
  </Box>
);

// ------------------- Home Component ------------------- //

const Home = () => {
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const { list: categories, isFullList: categoriesFull } = useSelector((state) => state.categories);
  const { list: services, loading: servicesLoading, error: servicesError, isFullList: servicesFull } = useSelector((state) => state.services);
  const { list: activeOffers, loading: offersLoading } = useSelector((state) => state.offers);
  const { providerApplicationStatus, rejectionReason, isProviderActive } = useSelector((state) => state.user);
  const { isProvider, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // We want the full catalog for browsing if it's small, otherwise use pagination.
    // For now, let's fetch all to avoid complexity in transitions.
    if (!categoriesFull) dispatch(fetchCategories({ no_pagination: true }));
    if (!servicesFull) dispatch(fetchServices({ no_pagination: true }));
    if (!providerApplicationStatus) dispatch(fetchProviderApplicationStatus());
    dispatch(fetchPublicOffers());
  }, [dispatch, categoriesFull, servicesFull, providerApplicationStatus]);

  useEffect(() => {
    if (providerApplicationStatus?.toLowerCase() === "approved") {
      dispatch(setProvider(true));
    }
  }, [providerApplicationStatus, dispatch]);

  const handleProviderRedirect = async () => {
    try {
      const latestUser = await userService.fetchProfile();
      dispatch(setUser(latestUser));

      if (latestUser.is_provider_active === false) {
        ShowToast("Access Denied: Your provider account has been blocked.", "error");
      } else {
        navigate("/provider/dashboard");
      }
    } catch (error) {
      console.error("Failed to check provider status:", error);
      if (user?.is_provider_active === false) {
        ShowToast("Access Denied: Your provider account is currently blocked.", "error");
      } else {
        navigate("/provider/dashboard");
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/services", { state: { searchQuery } });
    }
  };

  // Normalize status string
  const normalizedStatus = providerApplicationStatus?.toLowerCase();

  const renderCTAButton = () => {
    if (isProvider && normalizedStatus === "approved") {
      return (
        <Button
          variant="contained"
          onClick={handleProviderRedirect}
          endIcon={<ArrowForwardIcon />}
          sx={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            textTransform: "none",
            fontWeight: 800,
            fontSize: "1.05rem",
            px: 4,
            py: 1.5,
            borderRadius: 3,
            boxShadow: "0 8px 20px rgba(16,185,129,0.3)",
            "&:hover": { background: "linear-gradient(135deg, #059669, #047857)" }
          }}
        >
          Go to Provider Dashboard
        </Button>
      );
    }

    else if (normalizedStatus === "pending") {
      return (
        <Button
          variant="contained"
          disabled
          sx={{
            backgroundColor: "rgba(255,255,255,0.1) !important",
            color: "rgba(255,255,255,0.7) !important",
            textTransform: "none",
            fontWeight: 800,
            fontSize: "1.05rem",
            px: 4,
            py: 1.5,
            borderRadius: 3,
          }}
        >
          Application Pending Review
        </Button>
      );
    }

    else if (normalizedStatus === "rejected") {
      return (
        <Button
          variant="contained"
          onClick={() => setApplicationModalOpen(true)}
          sx={{
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            color: "white",
            textTransform: "none",
            fontWeight: 800,
            fontSize: "1.05rem",
            px: 4,
            py: 1.5,
            borderRadius: 3,
            boxShadow: "0 8px 20px rgba(239,68,68,0.3)",
            "&:hover": { background: "linear-gradient(135deg, #b91c1c, #991b1b)" }
          }}
        >
          Application Rejected - Try Again
        </Button>
      );
    }

    else if (!providerApplicationStatus && !isProvider) {
      return (
        <Button
          variant="contained"
          onClick={() => setApplicationModalOpen(true)}
          endIcon={<ArrowForwardIcon />}
          sx={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "white",
            textTransform: "none",
            fontWeight: 800,
            fontSize: "1.05rem",
            px: 4,
            py: 1.5,
            borderRadius: 3,
            boxShadow: "0 8px 20px rgba(245,158,11,0.3)",
            "&:hover": { background: "linear-gradient(135deg, #d97706, #b45309)" }
          }}
        >
          Register as Partner
        </Button>
      );
    }

    return null;
  };

  // ✅ Navigate to ServiceBooking when service card clicked
  const handleServiceClick = (srv) => {
    navigate("/service-details", { state: { service: srv } });
  };

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 10 }}>
      {/* ── HERO SECTION ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)",
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          px: 2,
          borderBottomLeftRadius: { xs: 32, md: 64 },
          borderBottomRightRadius: { xs: 32, md: 64 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background circles */}
        <Box sx={{ position: "absolute", top: -100, right: -50, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -50, left: -100, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Typography variant="h3" fontWeight={900} color="white" sx={{ mb: 2, letterSpacing: -0.5, fontSize: { xs: "2.2rem", md: "3.5rem" } }}>
            Your Home Needs, <Box component="span" sx={{ color: "#fcd34d" }}>Expertly Handled.</Box>
          </Typography>
          <Typography variant="h6" color="rgba(255,255,255,0.8)" sx={{ mb: 5, fontWeight: 500, maxWidth: 600, mx: "auto" }}>
            Book trusted professionals for cleaning, repairs, beauty, and more—all at your fingertips.
          </Typography>

          <Paper
            component="form"
            onSubmit={handleSearch}
            elevation={0}
            sx={{
              p: "6px",
              display: "flex",
              alignItems: "center",
              width: "100%",
              maxWidth: 650,
              mx: "auto",
              borderRadius: 4,
              bgcolor: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              transition: "transform 0.2s",
              "&:focus-within": { transform: "translateY(-2px)" }
            }}
          >
            <InputAdornment position="start" sx={{ pl: 2 }}>
              <SearchIcon sx={{ color: "#4f46e5", fontSize: 28 }} />
            </InputAdornment>
            <TextField
              fullWidth
              placeholder="What do you need help with today?"
              variant="standard"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ disableUnderline: true, sx: { fontSize: "1.1rem", fontWeight: 600, color: "#1e293b", py: 1.5, px: 2 } }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#4f46e5",
                color: "white",
                borderRadius: 3,
                py: 1.5,
                px: 4,
                fontWeight: 800,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": { bgcolor: "#4338ca" }
              }}
            >
              Search
            </Button>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: { xs: -4, md: -6 }, position: "relative", zIndex: 2 }}>
        {/* ── POPULAR SERVICES ── */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 5, bgcolor: "white", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
            <Box>
              <Typography variant="h5" fontWeight="900" color="#0f172a" sx={{ letterSpacing: -0.5 }}>
                Popular Services
              </Typography>
              <Box sx={{ width: 40, height: 4, bgcolor: "#4f46e5", borderRadius: 2, mt: 1 }} />
            </Box>
            <Button endIcon={<ArrowForwardIcon />} onClick={() => navigate("/services")} sx={{ textTransform: "none", fontWeight: 700, color: "#4f46e5" }}>
              View All
            </Button>
          </Stack>

          {servicesLoading ? (
            <Loader message="Fetching Popular Services..." sx={{ py: 6 }} />
          ) : servicesError ? (
            <Typography color="error">Failed to load services</Typography>
          ) : (
            <Grid container spacing={3}>
              {services.slice(0, 11).map((srv) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={srv.id}>
                  <Box sx={{ "& > *": { height: "100%" } }}>
                    <ServiceCard
                      name={srv.name}
                      icon={srv.icon || ""}
                      offer={srv.active_offer}
                      price={srv.price}
                      onClick={() => handleServiceClick(srv)}
                    />
                  </Box>
                </Grid>
              ))}

              <Grid item xs={6} sm={4} md={3} lg={2}>
                <Box sx={{ "& > *": { height: "100%" } }}>
                  <ServiceCard
                    name="More Services"
                    icon={moreImg}
                    isMore
                    onClick={() => navigate("/services")}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </Paper>

        {/* ── OFFERS & DISCOUNTS ── */}
        {activeOffers.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Box sx={{ mb: 4, px: 1 }}>
              <Typography variant="h5" fontWeight="900" color="#0f172a" sx={{ letterSpacing: -0.5 }}>
                Exclusive Offers
              </Typography>
              <Box sx={{ width: 40, height: 4, bgcolor: "#f59e0b", borderRadius: 2, mt: 1 }} />
            </Box>
            
            {/* Scrollable horizontal container for offers */}
            <Box sx={{ display: "flex", overflowX: "auto", pb: 3, pt: 1, px: 1, gap: 3, "&::-webkit-scrollbar": { display: "none" }, scrollBehavior: "smooth", mx: -1 }}>
              {activeOffers.map((offer) => {
                const name = offer.service_name || offer.category_name || offer.title;
                const icon = offer.service_icon || offer.category_icon || "";

                return (
                  <Box key={offer.unique_key || offer.id} sx={{ minWidth: { xs: 160, sm: 200, md: 240 }, flexShrink: 0 }}>
                    <ServiceCard
                      name={name}
                      icon={icon}
                      offer={offer}
                      price={offer.service_price}
                      onClick={() => {
                        if (offer.service) {
                          const fullService = services.find(s => s.id === offer.service);
                          if (fullService) {
                            handleServiceClick(fullService);
                          } else {
                            navigate("/service-details", { state: { service: { id: offer.service, name: offer.service_name, icon: offer.service_icon } } });
                          }
                        } else if (offer.category) {
                          navigate("/services");
                        }
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ── CALL TO ACTION (PROVIDER) ── */}
        <Box
          sx={{
            mt: 8,
            borderRadius: 6,
            background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 24px 50px rgba(30,27,75,0.3)",
          }}
        >
          {/* Decorative shapes */}
          <Box sx={{ position: "absolute", top: -50, right: "20%", width: 200, height: 200, borderRadius: "50%", background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%)", filter: "blur(40px)" }} />
          
          <Grid container alignItems="center">
            <Grid item xs={12} md={7} sx={{ p: { xs: 4, md: 8 }, zIndex: 2 }}>
              <Typography variant="caption" fontWeight="800" sx={{ color: "#fcd34d", letterSpacing: 1.5, textTransform: "uppercase", display: "block", mb: 2 }}>
                Join our expert network
              </Typography>
              <Typography variant="h3" fontWeight="900" color="white" sx={{ mb: 2, letterSpacing: -1, lineHeight: 1.1, fontSize: { xs: "2rem", md: "3rem" } }}>
                Are you a service expert?
              </Typography>
              <Typography variant="h6" color="rgba(255,255,255,0.7)" sx={{ mb: 5, fontWeight: 500, maxWidth: 500 }}>
                Partner with Home Lift. Be your own boss, set your own schedule, and earn what you deserve.
              </Typography>

              <Box sx={{ mb: 6 }}>
                <BenefitItem icon={earningsIcon} title="Increase Your Earnings" description="Earn more than your cost and minimize efforts with our steady stream of bookings." />
                <BenefitItem icon={productivityIcon} title="Improve Productivity" description="Easy scheduling, invoicing, and recommendations to boost your daily workflow." />
                <BenefitItem icon={customerBaseIcon} title="Large Customer Base" description="Reach a much larger customer base instantly without any marketing costs." />
              </Box>

              {renderCTAButton()}
            </Grid>

            <Grid item xs={12} md={5} sx={{ display: { xs: "none", md: "block" }, height: "100%", alignSelf: "stretch" }}>
              <Box
                sx={{
                  height: "100%",
                  width: "100%",
                  backgroundImage: `url(${ruServiceProvider})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderTopRightRadius: 24,
                  borderBottomRightRadius: 24,
                  maskImage: "linear-gradient(to right, transparent, black 20%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent, black 20%)",
                }}
              />
            </Grid>
          </Grid>
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
    </Box>
  );
};

export default Home;
