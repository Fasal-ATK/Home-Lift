// ProviderLayout.jsx
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import ProviderSidebar from "../components/provider/ProviderSidebar";
import LoadingOverlay from "../components/common/LoadingOverlay";

const ProviderLayout = () => {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Fixed Sidebar */}
      <ProviderSidebar open={open} setOpen={setOpen} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          bgcolor: "#f5f5f5",
          ml: `${open ? 190 : 70}px`, // matches sidebar width
          transition: "margin-left 0.3s ease",
        }}
      >
        <LoadingOverlay />
        <Outlet />
      </Box>
    </Box>
  );
};

export default ProviderLayout;
