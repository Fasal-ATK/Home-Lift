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
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";



const ServiceBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const service = location.state?.service;
  const allServices = useSelector((state) => state.services.list); // Adjust key as per your slice

  if (!service) {
    navigate("/services");
    return null;
  }

  // ✅ Filter related services based on same category
  const relatedServices = allServices?.filter(
    (srv) => srv.category === service.category && srv.id !== service.id
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          {service.name}
        </Typography>
        <Button
          variant="contained"
          color="warning"
          size="large"
          onClick={() => navigate("/booking-form", { state: { service } })}
        >
          Book Now
        </Button>

      </Box>

      <Typography variant="body2" mb={2}>
        {service.location || "Your City"} | ⭐ {service.rating || 4.5} (
        {service.reviews || 12345} Reviews)
      </Typography>

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

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          Looking for the best {service.name} services in town?
        </Typography>
        <Typography variant="body2">
          {service.description ||
            "We provide top-notch services to make your car shine and stay protected."}
        </Typography>

        {/* <Typography variant="subtitle2" fontWeight="bold" mt={2}>
          Advantages
        </Typography>
        <ul>
          {service.advantages?.length ? (
            service.advantages.map((adv, i) => <li key={i}>{adv}</li>)
          ) : (
            <>
              <li>Protection from Harmful UV Rays</li>
              <li>Protection from Chemical Stains</li>
              <li>Hydrophobic Nature, Ease of Cleaning</li>
              <li>Candy-Like Gloss</li>
            </>
          )}
        </ul> */}
      </Box>

      {/* ✅ Related Services */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Related Services
        </Typography>
        {relatedServices?.length ? (
          <Grid container spacing={2}>
            {relatedServices.map((srv) => (
              <Grid item xs={6} sm={4} key={srv.id}>
                <Paper
                  sx={{
                    textAlign: "center",
                    p: 2,
                    cursor: "pointer",
                    "&:hover": { boxShadow: 4 },
                  }}
                  onClick={() => navigate("/service-booking", { state: { service: srv } })}
                >
                  <Box
                    component="img"
                    src={srv.icon}
                    alt={srv.name}
                    sx={{ width: 60, height: 60, mb: 1 }}
                  />
                  <Typography variant="body2">{srv.name}</Typography>
                </Paper>
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

export default ServiceBooking;
