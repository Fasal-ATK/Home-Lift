import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Stack,
  Alert,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  VerifiedUser as VerifiedUserIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material";
import { providerService } from "../../services/apiServices";

function Bio() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBio = async () => {
      try {
        const data = await providerService.fetchDetails();
        setDetails(data);
      } catch (err) {
        console.error("Failed to fetch provider details:", err);
        setError("Unable to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBio();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!details) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">No provider details found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Profile Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(to bottom, #ffffff, #fcfcfc)",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: "primary.main",
                fontSize: "2.5rem",
                fontWeight: "bold",
                boxShadow: 2,
              }}
            >
              {details.user_name?.[0]?.toUpperCase() || "P"}
            </Avatar>
          </Grid>
          <Grid item xs={12} sm>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1, flexWrap: "wrap" }}>
              <Typography variant="h4" fontWeight="bold">
                {details.user_name}
              </Typography>
              {details.is_active ? (
                <Chip
                  icon={<VerifiedUserIcon />}
                  label="Verified Provider"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: "bold" }}
                />
              ) : (
                <Chip label="Pending / Inactive" color="warning" size="small" />
              )}
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ color: "text.secondary" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon fontSize="small" />
                <Typography variant="body1">{details.user_email}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PhoneIcon fontSize="small" />
                <Typography variant="body1">{details.user_phone}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Services Section */}
      <Box>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
          <WorkIcon color="primary" /> Provided Services
        </Typography>

        {details.services?.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", bgcolor: "grey.50" }}>
            <Typography color="text.secondary">No services listed yet.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {details.services.map((service) => (
              <Grid item xs={12} md={6} lg={4} key={service.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderRadius: 2,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                      borderColor: "primary.light",
                    },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {service.service_name}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={2}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                          <AttachMoneyIcon fontSize="small" />
                          <Typography variant="body2">Starting Price</Typography>
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          ₹{service.price}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                          <AccessTimeIcon fontSize="small" />
                          <Typography variant="body2">Experience</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                          {service.experience_years} Years
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={service.is_active ? "Active" : "Inactive"}
                          color={service.is_active ? "success" : "default"}
                          size="small"
                          sx={{ width: "100%" }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default Bio;
