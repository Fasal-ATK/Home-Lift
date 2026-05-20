import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
} from "@mui/material";
import { ExpandMore, LocalOffer, Category, Description } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { fetchCategories } from "../../../redux/slices/categorySlice";
import ServiceCard from "../../common/ServiceCard";



const ServiceDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const service = location.state?.service;
  const allServices = useSelector((state) => state.services.list);
  const categories = useSelector((state) => state.categories.list);

  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories]);

  if (!service) {
    navigate("/services");
    return null;
  }

  // ✅ Filter related services based on same category
  const relatedServices = allServices?.filter(
    (srv) => srv.category === service.category && srv.id !== service.id
  );

  const categoryName = categories?.find(c => c.id === service.category)?.name || "Category";

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 3 }}>
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Chip 
              icon={<Category fontSize="small" />} 
              label={categoryName} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
            {service.rating && (
              <Chip label={`⭐ ${service.rating} ${service.reviews ? `(${service.reviews} Reviews)` : ""}`} size="small" />
            )}
          </Box>
          <Typography variant="h4" fontWeight="bold">
            {service.name}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <Typography variant="h5" color="text.primary" fontWeight="bold">
              ₹{service.price}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="warning"
          size="large"
          sx={{ fontWeight: "bold", px: 4, py: 1.5, borderRadius: 2 }}
          onClick={() => navigate("/booking-page", { state: { service } })}
        >
          Book Now
        </Button>
      </Box>

      {/* Offer Section */}
      {service.active_offer && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2.5, 
            mb: 3, 
            borderRadius: 2, 
            borderColor: "success.main",
            bgcolor: "success.50",
            display: "flex",
            alignItems: "flex-start",
            gap: 2
          }}
        >
          <Box sx={{ bgcolor: "success.100", p: 1, borderRadius: 2, display: "flex" }}>
            <LocalOffer color="success" />
          </Box>
          <Box>
            <Typography variant="h6" color="success.dark" fontWeight="bold">
              {service.active_offer.title} ({service.active_offer.discount_value}% OFF)
            </Typography>
            {service.active_offer.description && (
              <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                {service.active_offer.description}
              </Typography>
            )}
            {service.active_offer.max_discount && parseFloat(service.active_offer.max_discount) > 0 && (
              <Typography variant="caption" color="success.dark" sx={{ display: "block", mt: 1, fontWeight: 500 }}>
                * Maximum discount up to ₹{service.active_offer.max_discount}
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* Description Section */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2, borderColor: "grey.200" }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Description color="action" />
          <Typography variant="h6" fontWeight="bold">About this Service</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
          {service.description || "No detailed description provided for this service."}
        </Typography>
      </Paper>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight="bold">Terms & Conditions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight="bold">How it Works</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
        </AccordionDetails>
      </Accordion>



      {/* ✅ Related Services */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Related Services
        </Typography>
        {relatedServices?.length ? (
          <Grid container spacing={2}>
            {relatedServices.map((srv) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={srv.id}>
                <ServiceCard
                  name={srv.name}
                  icon={srv.icon}
                  offer={srv.active_offer}
                  price={srv.price}
                  onClick={() => navigate("/service-details", { state: { service: srv } })}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No related services found.
          </Typography>
        )}
      </Box>


    </Container>
  );
};
;

export default ServiceDetails;