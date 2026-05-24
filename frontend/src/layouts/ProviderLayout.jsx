// ProviderLayout.jsx
import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProviderSidebar from "../components/provider/ProviderSidebar";

const ProviderLayout = () => {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const sidebarWidth = open ? 220 : 72;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fc" }}>
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
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ width: "100%", height: "100%" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default ProviderLayout;
