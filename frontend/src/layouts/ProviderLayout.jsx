// ProviderLayout.jsx
import { Box, AppBar, Toolbar, IconButton, Typography, Stack, Avatar, useMediaQuery, useTheme } from "@mui/material";
import { Menu as MenuIcon, Chat as ChatIcon } from "@mui/icons-material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import ProviderSidebar from "../components/provider/ProviderSidebar";

const ProviderLayout = () => {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { rooms } = useSelector((state) => state.chat);
  const chatUnreadCount = rooms?.reduce((acc, room) => acc + (room.unread_count || 0), 0) || 0;

  const sidebarWidth = isMobile ? 0 : open ? 220 : 72;

  const getPageTitle = (path) => {
    if (path.includes("/provider/job-requests")) return "Job Requests";
    if (path.includes("/provider/appointments")) return "Appointments";
    if (path.includes("/provider/bio")) return "Provider Bio";
    if (path.includes("/provider/history")) return "History";
    if (path.includes("/provider/wallet")) return "Wallet";
    if (path.includes("/provider/chat")) return "Chat";
    if (path.includes("/provider/support")) return "Support";
    return "Dashboard";
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fc", display: "flex", flexDirection: "column" }}>
      {/* Mobile Header Bar */}
      {isMobile && (
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "#fff",
            color: "#0f172a",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            zIndex: theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                edge="start"
                color="inherit"
                aria-label="open drawer"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                HL
              </Avatar>
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a" noWrap>
                {getPageTitle(location.pathname)}
              </Typography>
            </Stack>

            <IconButton
              size="small"
              onClick={() => navigate("/provider/chat")}
              sx={{ color: chatUnreadCount > 0 ? "#6366f1" : "rgba(0,0,0,0.6)" }}
            >
              <ChatIcon fontSize="small" />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar (Desktop Fixed / Mobile Drawer) */}
      <ProviderSidebar
        open={open}
        setOpen={setOpen}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          ml: `${sidebarWidth}px`,
          width: { xs: "100%", md: `calc(100% - ${sidebarWidth}px)` },
          minHeight: isMobile ? "calc(100vh - 56px)" : "100vh",
          bgcolor: "#f8f9fc",
          transition: "margin-left 0.3s ease, width 0.3s ease",
          boxSizing: "border-box",
          overflowX: "hidden",
          flexGrow: 1,
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

