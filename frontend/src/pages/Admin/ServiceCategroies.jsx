import { Box, Button } from "@mui/material";
import React, { useState } from "react";
import CategoryTable from "../../components/admin/service&category/CategoryTable";
import ServiceTable from "../../components/admin/service&category/ServiceTable"; 

function ServiceCategroies() {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <Box sx={{ p: 3 }}>
      {/* Toggle Buttons */}
      <Box sx={{ display: "flex", width: "100%", mb: 3 }}>
        <Button
          fullWidth
          onClick={() => setActiveTab("categories")}
          sx={{
            p: 2,
            fontSize: "1.2rem",
            fontWeight: "bold",
            borderRadius: "12px 0 0 12px",
            backgroundColor:
              activeTab === "categories" ? "#1976d2" : "rgba(25, 118, 210, 0.3)",
            color: "white",
            textTransform: "none",
            transition: "0.3s",
            "&:hover": {
              backgroundColor:
                activeTab === "categories"
                  ? "#1565c0"
                  : "rgba(25, 118, 210, 0.5)",
            },
          }}
        >
          Categories
        </Button>
        <Button
          fullWidth
          onClick={() => setActiveTab("services")}
          sx={{
            p: 2,
            fontSize: "1.2rem",
            fontWeight: "bold",
            borderRadius: "0 12px 12px 0",
            backgroundColor:
              activeTab === "services" ? "#1976d2" : "rgba(25, 118, 210, 0.3)",
            color: "white",
            textTransform: "none",
            transition: "0.3s",
            "&:hover": {
              backgroundColor:
                activeTab === "services"
                  ? "#1565c0"
                  : "rgba(25, 118, 210, 0.5)",
            },
          }}
        >
          Services
        </Button>
      </Box>

      {/* Render Table based on selection */}
      <Box>
        {activeTab === "categories" ? <CategoryTable /> : <ServiceTable />}
      </Box>
    </Box>
  );
}

export default ServiceCategroies;
