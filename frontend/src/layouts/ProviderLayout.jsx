// ProviderLayout.jsx
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import ProviderSidebar from "../components/provider/ProviderSidebar";

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
          p: 3,
          bgcolor: "#f5f5f5",
          ml: `${open ? 200 : 70}px`, // matches sidebar width
          transition: "margin-left 0.3s ease",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default ProviderLayout;
