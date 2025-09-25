import { useLocation, Link } from "react-router-dom";
import LogoutButton from "../common/Logout";
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
} from "@mui/icons-material";

export default function ProviderSidebar({ open, setOpen }) {
  const location = useLocation();

  const navItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/provider/dashboard" },
    { text: "Requests", icon: <Description />, path: "#" },
    { text: "Bookings", icon: <CalendarMonth />, path: "#" },
    { text: "History", icon: <History />, path: "#" },
    { text: "Profile", icon: <Person />, path: "#" },
    { text: "Wallet", icon: <AccountBalanceWallet />, path: "#" },
  ];

  return (
    <Box
      sx={{
        width: open ? 200 : 70,
        position: "fixed", // makes sidebar fixed
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
      {/* Top: Brand + Toggle */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          p: 2,
          borderBottom: "1px solid #eee",
        }}
      >
        {open && (
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            <span style={{ color: "#cddc39" }}>Home</span> Lift
          </Typography>
        )}
        <IconButton size="small" onClick={() => setOpen(!open)}>
          {open ? <ChevronLeft /> : <Menu />}
        </IconButton>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, mt: 2 }}>
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
                py: 1.5,
                justifyContent: open ? "initial" : "center",
                px: open ? 2 : 1.5,
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

        {/* Logout */}
        <Box sx={{ mt: 2 }}>
          <LogoutButton collapsed={!open} />
        </Box>
      </List>

      <Divider />
    </Box>
  );
}
