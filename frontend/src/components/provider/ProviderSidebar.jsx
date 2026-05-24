import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  Stack,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import {
  Dashboard,
  Description,
  CalendarMonth,
  History,
  Person,
  AccountBalanceWallet,
  Menu,
  ChevronLeft,
  SupportAgent,
  Chat,
  ArrowBack,
  WorkHistory,
} from "@mui/icons-material";

// ─── animations ──────────────────────────────────────────────────────────────
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const pulse = keyframes`
  0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); }
  50%      { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
`;

// ─── styled ──────────────────────────────────────────────────────────────────
const SidebarWrap = styled(Box)(({ open }) => ({
  width: open ? 220 : 72,
  position: "fixed",
  left: 0,
  top: 0,
  bottom: 0,
  height: "100vh",
  backgroundColor: "#fff",
  borderRight: "1px solid rgba(0, 0, 0, 0.06)",
  display: "flex",
  flexDirection: "column",
  transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
  zIndex: 1200,
  overflow: "visible",
  boxShadow: "4px 0 20px rgba(0,0,0,0.02)",
  "&::before": {
    content: '""',
    position: "absolute",
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: "50%",
    background: "rgba(99,102,241,0.02)",
    pointerEvents: "none",
  },
}));

const NavItem = styled(Box)(({ active }) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 14px",
  borderRadius: 14,
  margin: "2px 8px",
  cursor: "pointer",
  position: "relative",
  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
  background: active
    ? "rgba(99, 102, 241, 0.08)"
    : "transparent",
  border: active ? "1px solid rgba(99, 102, 241, 0.15)" : "1px solid transparent",
  "&:hover": {
    background: active
      ? "rgba(99, 102, 241, 0.12)"
      : "rgba(0, 0, 0, 0.04)",
    transform: "translateX(3px)",
  },
  // left accent bar when active
  "&::before": active
    ? {
        content: '""',
        position: "absolute",
        left: -8,
        top: "50%",
        transform: "translateY(-50%)",
        width: 3,
        height: "60%",
        borderRadius: 10,
        background: "linear-gradient(180deg,#6366f1,#8b5cf6)",
        boxShadow: "0 0 8px rgba(99,102,241,0.4)",
      }
    : {},
}));

const IconWrap = styled(Box)(({ active }) => ({
  width: 36,
  height: 36,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  background: active
    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
    : "rgba(0, 0, 0, 0.04)",
  boxShadow: active ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
  transition: "all 0.2s",
  animation: active ? `${pulse} 3s ease-in-out infinite` : "none",
}));

// ─── nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { text: "Dashboard",    icon: <Dashboard   sx={{ fontSize: 18 }} />, path: "/provider/dashboard"    },
  { text: "Job Requests", icon: <Description sx={{ fontSize: 18 }} />, path: "/provider/job-requests" },
  { text: "Appointments", icon: <CalendarMonth sx={{ fontSize: 18 }} />, path: "/provider/appointments" },
  { text: "Bio",          icon: <Person      sx={{ fontSize: 18 }} />, path: "/provider/bio"          },
  { text: "History",      icon: <WorkHistory sx={{ fontSize: 18 }} />, path: "/provider/history"      },
  { text: "Wallet",       icon: <AccountBalanceWallet sx={{ fontSize: 18 }} />, path: "/provider/wallet" },
];

const BOTTOM_ITEMS = [
  { text: "Support", icon: <SupportAgent sx={{ fontSize: 18 }} />, path: "/provider/support" },
  { text: "Chat",    icon: <Chat         sx={{ fontSize: 18 }} />, path: "/provider/chat"    },
];

// ─── component ────────────────────────────────────────────────────────────────
export default function ProviderSidebar({ open, setOpen }) {
  const location = useLocation();
  const navigate  = useNavigate();

  const renderItem = (item) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");

    const inner = (
      <NavItem
        active={isActive ? 1 : 0}
        component={Link}
        to={item.path}
        sx={{ textDecoration: "none" }}
      >
        <IconWrap active={isActive ? 1 : 0}>
          <Box sx={{ color: isActive ? "#fff" : "rgba(0, 0, 0, 0.54)", display: "flex" }}>
            {item.icon}
          </Box>
        </IconWrap>

        {open && (
          <Typography
            variant="body2"
            fontWeight={isActive ? 800 : 500}
            noWrap
            sx={{
              color: isActive ? "#4f46e5" : "rgba(0, 0, 0, 0.65)",
              fontSize: 13.5,
              animation: `${slideIn} 0.25s ease both`,
              letterSpacing: isActive ? 0 : 0.2,
            }}
          >
            {item.text}
          </Typography>
        )}

        {/* Active dot when collapsed */}
        {!open && isActive && (
          <Box
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "#6366f1",
              boxShadow: "0 0 6px rgba(99,102,241,0.6)",
            }}
          />
        )}
      </NavItem>
    );

    return (
      <Tooltip
        key={item.path}
        title={!open ? item.text : ""}
        placement="right"
        arrow
      >
        <Box>{inner}</Box>
      </Tooltip>
    );
  };

  return (
    <SidebarWrap open={open ? 1 : 0}>

      {/* ── Brand header ──────────────────────────────────────── */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          minHeight: 64,
          flexShrink: 0,
        }}
      >
        {open ? (
          <>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  fontSize: 14,
                  fontWeight: 900,
                  boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                }}
              >
                HL
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={800} sx={{ color: "#1e1b4b", lineHeight: 1.1, fontSize: 14 }}>
                  <Box component="span" sx={{ color: "#6366f1" }}>Home</Box> Lift
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(0, 0, 0, 0.45)", fontSize: 10 }}>
                  Provider Portal
                </Typography>
              </Box>
            </Stack>

            <Tooltip title="Back to user side" placement="right">
              <IconButton
                size="small"
                onClick={() => navigate("/home")}
                sx={{
                  color: "rgba(0, 0, 0, 0.54)",
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                  "&:hover": { bgcolor: "rgba(0, 0, 0, 0.08)", color: "#000" },
                  width: 28, height: 28,
                }}
              >
                <ArrowBack sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Back to user side" placement="right">
            <Avatar
              onClick={() => navigate("/home")}
              sx={{
                width: 36,
                height: 36,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                "&:hover": { transform: "scale(1.05)" },
                transition: "transform 0.2s",
              }}
            >
              HL
            </Avatar>
          </Tooltip>
        )}
      </Box>

      {/* ── Toggle button ─────────────────────────────────────── */}
      <IconButton
        size="small"
        onClick={() => setOpen(!open)}
        sx={{
          position: "absolute",
          right: -14,
          top: "50%",
          transform: "translateY(-50%)",
          bgcolor: "#fff",
          border: "1px solid rgba(0, 0, 0, 0.12)",
          color: "rgba(0, 0, 0, 0.6)",
          width: 28,
          height: 28,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          "&:hover": { bgcolor: "#6366f1", color: "#fff", borderColor: "#6366f1" },
          zIndex: 1500,
          transition: "all 0.2s",
        }}
      >
        {open ? <ChevronLeft sx={{ fontSize: 16 }} /> : <Menu sx={{ fontSize: 16 }} />}
      </IconButton>

      {/* ── Main nav ──────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          py: 1.5,
          "&::-webkit-scrollbar": { width: 0 },
        }}
      >
        {open && (
          <Typography
            variant="caption"
            sx={{
              color: "rgba(0, 0, 0, 0.35)",
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontSize: 10,
              px: 2.5,
              pb: 1,
              display: "block",
            }}
          >
            Main Menu
          </Typography>
        )}

        {NAV_ITEMS.map(renderItem)}

        <Box sx={{ mx: 2, my: 2 }}>
          <Divider sx={{ borderColor: "rgba(0, 0, 0, 0.06)" }} />
        </Box>

        {open && (
          <Typography
            variant="caption"
            sx={{
              color: "rgba(0, 0, 0, 0.35)",
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontSize: 10,
              px: 2.5,
              pb: 1,
              display: "block",
            }}
          >
            More
          </Typography>
        )}

        {BOTTOM_ITEMS.map(renderItem)}
      </Box>

      {/* ── Footer ────────────────────────────────────────────── */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid rgba(0, 0, 0, 0.06)",
          flexShrink: 0,
        }}
      >
        {open ? (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: "rgba(99, 102, 241, 0.06)",
              border: "1px solid rgba(99, 102, 241, 0.12)",
            }}
          >
            <Typography variant="caption" fontWeight={700} sx={{ color: "#6366f1", display: "block" }}>
              Provider Mode
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(0, 0, 0, 0.5)", fontSize: 10 }}>
              Managing your services
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              width: 36, height: 8,
              borderRadius: 10,
              bgcolor: "#6366f1",
              mx: "auto",
              opacity: 0.6,
            }}
          />
        )}
      </Box>
    </SidebarWrap>
  );
}
