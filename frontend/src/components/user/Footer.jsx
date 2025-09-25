import React from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Link,
  IconButton,
} from "@mui/material";
import { Facebook, Twitter, LinkedIn, Instagram } from "@mui/icons-material";

import onDemand from "../../assets/user/home/whyHomeLift/On-Demand-Scheduled.webp";
import verified from "../../assets/user/home/whyHomeLift/Verified-Partners.webp";
import warranty from "../../assets/user/home/whyHomeLift/Service-Warranty.webp";
import pricing from "../../assets/user/home/whyHomeLift/Transparent-Pricing.webp";
import payments from "../../assets/user/home/whyHomeLift/Online-Payments.webp";
import support from "../../assets/user/home/whyHomeLift/customer-support.webp";

const whyHomeLift = [
  { title: "On Demand Booking", icon: onDemand },
  { title: "Verified Partners", icon: verified },
  { title: "Service Warranty", icon: warranty },
  { title: "Transparent Pricing", icon: pricing },
  { title: "Online Payments", icon: payments },
  { title: "24/7 Customer Support", icon: support },
];

const cities = [
  "Chennai",
  "Kochi",
  "Pengulbo",
  "Hyderabad",
  "Mumbai",
  "Delhi NCR",
  "Kolkata",
  "Ahmedabad",
  "Kanpur",
  "Jaipur",
  "Trane",
  "Bhoyall",
];

export default function Footer() {
  return (
    <Box sx={{ backgroundColor: "#f9f9f9", mt: 6, p: 4 }}>
      {/* Why Home Lift */}
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Why Home Lift?
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {whyHomeLift.map((item, idx) => (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={idx}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                textAlign: "center",
                backgroundColor: "transparent",
              }}
            >
              <Box
                component="img"
                src={item.icon}
                alt={item.title}
                sx={{
                  width: 40,
                  height: 40,
                  objectFit: "contain",
                  mx: "auto",
                  mb: 1,
                }}
              />
              <Typography variant="body2" fontWeight="bold">
                {item.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Cities */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          INDIA
        </Typography>
        <Typography variant="body2">
          {cities.map((city, idx) => (
            <React.Fragment key={idx}>
              <Link href="#" underline="hover" sx={{ mr: 1 }}>
                {city}
              </Link>
              {idx < cities.length - 1 && " | "}
            </React.Fragment>
          ))}
        </Typography>
      </Box>

      {/* Info */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          HOME LIFT
        </Typography>
        <Typography variant="body2" sx={{ maxWidth: 700 }}>
          HOME LIFT provides easy app offerings for home repairs and appliances.
          Offering verified partners, service warranty, transparent pricing,
          and 24/7 support. Experience seamless service with HOME LIFT.
        </Typography>
      </Box>

      {/* Social Media */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          Follow Us
        </Typography>
        <Box>
          <IconButton href="#" color="inherit">
            <Facebook />
          </IconButton>
          <IconButton href="#" color="inherit">
            <Twitter />
          </IconButton>
          <IconButton href="#" color="inherit">
            <LinkedIn />
          </IconButton>
          <IconButton href="#" color="inherit">
            <Instagram />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
