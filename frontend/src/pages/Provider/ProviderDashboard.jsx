// src/pages/provider/ProviderDashboard.jsx
import React from "react";
import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItem, ListItemText, CssBaseline, IconButton, Divider, Button } from "@mui/material";
import { Menu as MenuIcon, Dashboard, Work, AccountCircle, Settings, Logout } from "@mui/icons-material";

const drawerWidth = 240;

const menuItems = [
  { text: "Dashboard", icon: <Dashboard /> },
  { text: "My Services", icon: <Work /> },
  { text: "Profile", icon: <AccountCircle /> },
  { text: "Settings", icon: <Settings /> },
];

export default function ProviderDashboard() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Provider Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item, index) => (
          <ListItem button key={index}>
            {item.icon}
            <ListItemText primary={item.text} sx={{ marginLeft: 1 }} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button variant="contained" color="error" fullWidth startIcon={<Logout />}>
          Logout
        </Button>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* Top Navbar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Provider Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="sidebar folders"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Typography variant="h4" gutterBottom>
          Welcome, Provider 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This is your dashboard. You can manage services, view requests, and update your profile here.
        </Typography>
        <Box sx={{ mt: 4 }}>
          {/* Placeholder for dashboard content */}
          <Box
            sx={{
              border: "2px dashed #ccc",
              p: 4,
              borderRadius: 2,
              textAlign: "center",
              color: "gray",
            }}
          >
            Dashboard content will appear here.
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
