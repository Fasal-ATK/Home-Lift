import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Dashboard,
  Description,
  CalendarMonth,
  History,
  Person,
  AccountBalanceWallet,
  Menu,
  ChevronLeft,
  Home as HomeIcon,
  SupportAgent,
  Chat,
  ArrowBack,
} from "@mui/icons-material";

export default function ProviderSidebar({ open, setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/provider/dashboard" },
    { text: "Job Requests", icon: <Description />, path: "/provider/job-requests" },
    { text: "Appointments", icon: <CalendarMonth />, path: "/provider/appointments" },
    { text: "Bio", icon: <Person />, path: "/provider/bio" },
    { text: "History", icon: <History />, path: "/provider/history" },
    { text: "Wallet", icon: <AccountBalanceWallet />, path: "/provider/wallet" },
    { text: "Support", icon: <SupportAgent />, path: "/provider/support" },
    { text: "Chat", icon: <Chat />, path: "/provider/chat" },
  ];

  return (
    <Box
      sx={{
        width: open ? 190 : 70,
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        height: "100vh",
        backgroundColor: "#fff",
        borderRight: "1px solid #eee",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s",
        zIndex: 1200,
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          p: 2,
          borderBottom: "2px solid #eee",
          display: "flex",
          alignItems: "center",
          gap: 1,
          justifyContent: open ? "flex-start" : "center",
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate("/home")}
          sx={{
            color: "primary.main",
            "&:hover": { bgcolor: "primary.light" },
          }}
          title="Back to User Side"
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        
        {open && (
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
            <span style={{ color: "#cddc39" }}>Home</span> Lift
          </Typography>
        )}
      </Box>

      {/* Center Toggle Button */}
      <IconButton
        size="small"
        onClick={() => setOpen(!open)}
        sx={{
          position: "absolute",
          right: -17,
          top: "50%",
          transform: "translateY(-50%)",
          bgcolor: "#fff",
          border: "1px solid #ddd",
          boxShadow: 12,
          "&:hover": { bgcolor: "#f4f4f4" },
          zIndex: 1500,
        }}
      >
        {open ? <ChevronLeft /> : <Menu />}
      </IconButton>

      {/* Navigation */}
      <List sx={{ 
        flex: 1, 
        mt: 2, 
        overflowY: "auto", 
        overflowX: "hidden",
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#ccc", borderRadius: "4px" }
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              component={Link}
              to={item.path}
              key={item.text}
              sx={{
                backgroundColor: isActive ? "#f4e04d" : "transparent",
                borderRadius: "12px",
                mb: 1,
                py: 1.4,
                justifyContent: open ? "initial" : "center",
                px: open ? 1 : 1.5,
                "&:hover": { backgroundColor: "#fff9c4" },
                transition: "all 0.3s",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "unset",
                  mr: open ? 2 : 0,
                  justifyContent: "center",
                  color: "#000",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && <ListItemText primary={item.text} />}
            </ListItemButton>
          );
        })}
      </List>

      <Divider />
    </Box>
  );
}
