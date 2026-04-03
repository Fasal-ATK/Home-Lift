// ProviderLayout.jsx
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import ProviderSidebar from "../components/provider/ProviderSidebar";

const ProviderLayout = () => {
  const [open, setOpen] = useState(true);

  const sidebarWidth = open ? 190 : 70;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {/* Fixed Sidebar */}
      <ProviderSidebar open={open} setOpen={setOpen} />

      {/* Main Content — shifted right by sidebar width, limited to remaining width */}
      <Box
        component="main"
        sx={{
          ml: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
          minHeight: "100vh",
          bgcolor: "#f5f5f5",
          transition: "margin-left 0.3s ease, width 0.3s ease",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default ProviderLayout;
