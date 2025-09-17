import { Box, Button } from "@mui/material";
import React, { useState } from "react";
import ProviderManager from "../../components/admin/emp/ProviderManager";
import ProviderApplications from "../../components/admin/emp/ProviderApplications";

function EmpManager() {
  const [activeTab, setActiveTab] = useState("providers");

  return (
    <Box sx={{ p: 3 }}>
      {/* Toggle Buttons */}
      <Box sx={{ display: "flex", width: "100%", mb: 3 }}>
        <Button
          fullWidth
          onClick={() => setActiveTab("providers")}
          sx={{
            p: 2,
            fontSize: "1.2rem",
            fontWeight: "bold",
            borderRadius: "12px 0 0 12px",
            backgroundColor:
              activeTab === "providers" ? "#1976d2" : "rgba(25, 118, 210, 0.3)",
            color: "white",
            textTransform: "none",
            transition: "0.3s",
            "&:hover": {
              backgroundColor:
                activeTab === "providers"
                  ? "#1565c0"
                  : "rgba(25, 118, 210, 0.5)",
            },
          }}
        >
          Providers
        </Button>
        <Button
          fullWidth
          onClick={() => setActiveTab("applications")}
          sx={{
            p: 2,
            fontSize: "1.2rem",
            fontWeight: "bold",
            borderRadius: "0 12px 12px 0",
            backgroundColor:
              activeTab === "applications" ? "#1976d2" : "rgba(25, 118, 210, 0.3)",
            color: "white",
            textTransform: "none",
            transition: "0.3s",
            "&:hover": {
              backgroundColor:
                activeTab === "applications"
                  ? "#1565c0"
                  : "rgba(25, 118, 210, 0.5)",
            },
          }}
        >
          Applications
        </Button>
      </Box>

      {/* Render Component based on selection */}
      <Box>
        {activeTab === "providers" ? <ProviderManager /> : <ProviderApplications />}
      </Box>
    </Box>
  );
}

export default EmpManager;
