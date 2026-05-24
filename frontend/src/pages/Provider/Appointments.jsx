// src/pages/Provider/Appointments.jsx

import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Drawer,
  Avatar,
  Divider,
  Chip,
  TextField,
  Grid,
  CircularProgress,
  InputAdornment,
  Paper,
  Tooltip,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SearchIcon from "@mui/icons-material/Search";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotesIcon from "@mui/icons-material/Notes";
import ChatIcon from "@mui/icons-material/Chat";
import DescriptionIcon from "@mui/icons-material/Description";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import CancelIcon from "@mui/icons-material/Cancel";
import PaymentIcon from "@mui/icons-material/Payment";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DirectionsIcon from "@mui/icons-material/Directions";

import { useNavigate } from "react-router-dom";
import { providerJobService } from "../../services/apiServices";
import api from "../../API/apiConfig";
import { ShowToast } from "../../components/common/Toast";

// ------------------ Helper Date Utilities ------------------
function pad(n) {
  return String(n).padStart(2, "0");
}

function minutesFromMidnight(hm) {
  if (!hm) return 0;
  const [h, m] = String(hm).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function computePxForEvent(startHM, endHM, dayStart = "06:00", dayEnd = "22:00", bodyHeight = 960) {
  const startMin = minutesFromMidnight(startHM);
  const endMin = minutesFromMidnight(endHM);
  const base = minutesFromMidnight(dayStart);
  const total = Math.max(1, minutesFromMidnight(dayEnd) - base);

  const topPx = Math.max(0, ((startMin - base) / total) * bodyHeight);
  const heightPx = Math.max(32, ((endMin - startMin) / total) * bodyHeight);

  return { topPx, heightPx };
}

function dayLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function startOfWeekMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "#b45309",
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.3)",
    gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.1) 100%)",
  },
  confirmed: {
    label: "Confirmed",
    color: "#4338ca",
    bg: "rgba(99, 102, 241, 0.08)",
    border: "rgba(99, 102, 241, 0.3)",
    gradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)",
  },
  in_progress: {
    label: "In Progress",
    color: "#0369a1",
    bg: "rgba(14, 165, 233, 0.08)",
    border: "rgba(14, 165, 233, 0.3)",
    gradient: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%)",
  },
  completed: {
    label: "Completed",
    color: "#065f46",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.3)",
    gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.1) 100%)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#9f1239",
    bg: "rgba(244, 63, 94, 0.08)",
    border: "rgba(244, 63, 94, 0.3)",
    gradient: "linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(251, 113, 133, 0.1) 100%)",
  },
};

// ------------------ Month Grid Utilities ------------------
const getMonthDaysGrid = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  let firstDayOfWeek = firstDay.getDay(); 
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Align Sunday to index 6 (Monday starts index 0)

  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const grid = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthTotalDays - i);
    grid.push({ date: d, isCurrentMonth: false, iso: toISODate(d) });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    grid.push({ date: d, isCurrentMonth: true, iso: toISODate(d) });
  }

  // Next month leading days to complete row grid
  const remaining = grid.length % 7;
  if (remaining > 0) {
    const toAdd = 7 - remaining;
    for (let i = 1; i <= toAdd; i++) {
      const d = new Date(year, month + 1, i);
      grid.push({ date: d, isCurrentMonth: false, iso: toISODate(d) });
    }
  }

  // Ensure minimum grid cells count (35 or 42 depending on span)
  while (grid.length < 35) {
    const d = new Date(year, month + 1, grid.length - totalDays - firstDayOfWeek + 1);
    grid.push({ date: d, isCurrentMonth: false, iso: toISODate(d) });
  }

  return grid;
};

// ------------------ Component ------------------
export default function WeekScheduleDemo() {
  const navigate = useNavigate();

  // Active dates states
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [mode, setMode] = useState("week"); // "day" | "week" | "month" | "list"
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [rawBookings, setRawBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Drawer detail modal state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Live timeline tracker effect
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // UI layout configuration constants
  const dayStart = "06:00";
  const dayEnd = "22:00";
  const rows = 16; // 6:00 to 22:00
  const rowHeight = 60;
  const headerHeight = 56;
  const bodyHeight = rows * rowHeight;
  
  // Calculate relative Monday for the active week start
  const weekStart = useMemo(() => startOfWeekMonday(currentDate), [currentDate]);

  // Generate 7 days of the active week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(weekStart, i);
      const iso = toISODate(d);
      return { iso, label: dayLabel(iso), dateObj: d };
    });
  }, [weekStart]);

  // Fetch Assigned Bookings
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await providerJobService.getMyAppointments();
      setRawBookings(data);
    } catch (err) {
      ShowToast("Failed to load appointments", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Map backend bookings to dynamic calendar objects
  const events = useMemo(() => {
    return rawBookings.map((b) => {
      const [h, m] = b.booking_time.split(":").map(Number);
      const endH = (h + 1).toString().padStart(2, "0");
      const endT = `${endH}:${m.toString().padStart(2, "0")}`;

      return {
        id: b.id,
        dateStr: b.booking_date,
        start: b.booking_time.slice(0, 5),
        end: endT,
        title: b.service_name || b.service,
        subtitle: b.full_name,
        status: b.status,
        cfg: STATUS_CONFIG[b.status] || STATUS_CONFIG.pending,
        rawBooking: b,
      };
    });
  }, [rawBookings]);

  // Group events correctly for overlaps on Day and Week views
  const processDayEvents = (dayEvents) => {
    const sorted = [...dayEvents].sort((a, b) => a.start.localeCompare(b.start));
    let clusters = [];

    sorted.forEach((ev) => {
      let joined = false;
      for (let i = 0; i < clusters.length; i++) {
        if (clusters[i].some((existing) => ev.start < existing.end && ev.end > existing.start)) {
          clusters[i].push(ev);
          joined = true;
          break;
        }
      }
      if (!joined) clusters.push([ev]);
    });

    const result = [];
    clusters.forEach((cluster) => {
      cluster.forEach((ev, idx) => {
        result.push({
          ...ev,
          col: idx,
          totalCols: cluster.length,
        });
      });
    });
    return result;
  };

  // Positioned events for Week Grid View
  const positionedWeekEvents = useMemo(() => {
    const byDay = {};
    weekDays.forEach((wd, i) => {
      byDay[wd.iso] = [];
    });

    events.forEach((ev) => {
      if (byDay[ev.dateStr] !== undefined) {
        byDay[ev.dateStr].push(ev);
      }
    });

    const processed = [];
    Object.keys(byDay).forEach((dateStr) => {
      const dayIndex = weekDays.findIndex((wd) => wd.iso === dateStr);
      const positioned = processDayEvents(byDay[dateStr]);
      positioned.forEach((ev) => {
        processed.push({
          ...ev,
          dayIndex,
        });
      });
    });

    return processed;
  }, [events, weekDays]);

  // Positioned events for Single Day Grid View
  const positionedDayEvents = useMemo(() => {
    const activeISO = toISODate(currentDate);
    const dayEvents = events.filter((ev) => ev.dateStr === activeISO);
    return processDayEvents(dayEvents);
  }, [events, currentDate]);

  // Month grid dates mapping
  const monthGridDays = useMemo(() => getMonthDaysGrid(currentDate), [currentDate]);

  // Events filtered for List / Agenda View
  const listEventsFiltered = useMemo(() => {
    return events
      .filter((ev) => {
        const matchesSearch =
          ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ev.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(ev.id).includes(searchTerm);
        
        const matchesStatus = statusFilter === "all" || ev.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateCompare = a.dateStr.localeCompare(b.dateStr);
        if (dateCompare !== 0) return dateCompare;
        return a.start.localeCompare(b.start);
      });
  }, [events, searchTerm, statusFilter]);

  // Navigation handlers
  const handlePrev = () => {
    if (mode === "day") setCurrentDate((d) => addDays(d, -1));
    else if (mode === "week") setCurrentDate((d) => addDays(d, -7));
    else if (mode === "month") {
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      setCurrentDate(prevMonth);
    }
  };

  const handleNext = () => {
    if (mode === "day") setCurrentDate((d) => addDays(d, 1));
    else if (mode === "week") setCurrentDate((d) => addDays(d, 7));
    else if (mode === "month") {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      setCurrentDate(nextMonth);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateSelect = (e) => {
    if (e.target.value) {
      setCurrentDate(new Date(e.target.value));
    }
  };

  // Status modification action handler
  const handleStatusChange = async (id, newStatus) => {
    setUpdatingStatus(true);
    try {
      await providerJobService.updateBookingStatus(id, newStatus);
      ShowToast(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}!`, "success");
      
      // Update selected drawer view state dynamically
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent((prev) => {
          if (!prev) return null;
          const updatedRaw = { ...prev.rawBooking, status: newStatus };
          return {
            ...prev,
            status: newStatus,
            cfg: STATUS_CONFIG[newStatus] || STATUS_CONFIG.pending,
            rawBooking: updatedRaw,
          };
        });
      }
      
      await fetchAppointments();
    } catch (e) {
      ShowToast(e?.response?.data?.error || e?.message || "Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Invoice downloader
  const handleDownloadInvoice = async (id) => {
    try {
      ShowToast("Generating invoice PDF...", "info");
      const response = await api.get(`/provider/jobs/${id}/invoice/`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_Booking_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      ShowToast("Invoice downloaded successfully!", "success");
    } catch (err) {
      ShowToast("Could not download invoice. Permission denied or file unavailable.", "error");
    }
  };

  // Chat Redirect helper
  const handleChatWithClient = (booking) => {
    if (booking.user_details || booking.user) {
      navigate("/provider/chat", {
        state: {
          prefilledRecipient: booking.user_username || booking.user_email || booking.user,
        },
      });
    } else {
      ShowToast("Chat details unavailable for this booking.", "warning");
    }
  };

  const openEventDrawer = (ev) => {
    setSelectedEvent(ev);
    setDrawerOpen(true);
  };

  // Active range display label
  const activeRangeText = useMemo(() => {
    if (mode === "day") {
      return currentDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } else if (mode === "week") {
      const endD = addDays(weekStart, 6);
      return `Week of ${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${endD.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }
  }, [mode, currentDate, weekStart]);

  // Compute live current-time indicator line position
  const todayISO = toISODate(now);
  const nowHours = now.getHours() + now.getMinutes() / 60;
  const isTimeInBounds = nowHours >= 6 && nowHours <= 22;

  const currentHourTopPx = useMemo(() => {
    if (!isTimeInBounds) return 0;
    const startHour = 6;
    const totalHours = 16;
    return ((nowHours - startHour) / totalHours) * bodyHeight;
  }, [nowHours, isTimeInBounds, bodyHeight]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1300, mx: "auto", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* ── HEADER ── */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3.5,
          border: "1px solid",
          borderColor: "grey.200",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
          {/* Brand info */}
          <Box>
            <Typography variant="h4" fontWeight={900} color="text.primary" sx={{ letterSpacing: "-0.5px" }}>
              Appointments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              Manage your assigned service schedules, track hours, and update client jobs.
            </Typography>
          </Box>

          {/* View Mode controls */}
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(e, v) => v && setMode(v)}
            size="small"
            sx={{
              bgcolor: "grey.100",
              p: 0.5,
              borderRadius: 2.5,
              "& .MuiToggleButtonGroup-grouped": {
                border: 0,
                borderRadius: "8px !important",
                px: 2.5,
                py: 0.8,
                textTransform: "none",
                fontWeight: 700,
                color: "text.secondary",
                "&.Mui-selected": {
                  bgcolor: "white",
                  color: "primary.main",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  "&:hover": { bgcolor: "white" },
                },
              },
            }}
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="list">List View</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {/* Navigation / Jump controllers */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Nav Arrows */}
            <Stack direction="row" spacing={0.5} sx={{ bgcolor: "grey.50", p: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "grey.200" }}>
              <IconButton size="small" onClick={handlePrev} sx={{ color: "text.primary" }}>
                <ArrowBackIosNewIcon sx={{ fontSize: 13 }} />
              </IconButton>
              <Button onClick={handleToday} variant="text" size="small" sx={{ textTransform: "none", fontWeight: 700, px: 2, color: "text.primary" }}>
                Today
              </Button>
              <IconButton size="small" onClick={handleNext} sx={{ color: "text.primary" }}>
                <ArrowForwardIosIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Stack>

            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ pl: 1 }}>
              {activeRangeText}
            </Typography>
          </Stack>

          {/* Jump DatePicker */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "white",
                border: "1.5px solid",
                borderColor: "grey.200",
                borderRadius: 2.5,
                px: 2,
                py: 0.8,
                position: "relative",
                cursor: "pointer",
                transition: "border-color 0.2s",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" fontWeight={700} color="text.secondary">
                Jump to Date
              </Typography>
              <input
                type="date"
                onChange={handleDateSelect}
                value={toISODate(currentDate)}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                }}
              />
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* ── APPOINTMENTS GRID / LISTS ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3.5,
          border: "1px solid",
          borderColor: "grey.200",
          overflow: "hidden",
          position: "relative",
          bgcolor: "white",
          minHeight: 500,
        }}
      >
        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255, 255, 255, 0.7)",
              zIndex: 15,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={45} />
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              Refreshing schedules...
            </Typography>
          </Box>
        )}

        {/* 1. WEEK VIEW */}
        {mode === "week" && (
          <Box sx={{ display: "flex", minWidth: 800 }}>
            {/* Timeline hour sidebar */}
            <Box sx={{ width: 85, borderRight: "1px solid", borderColor: "grey.100", bgcolor: "grey.50", py: 1, flexShrink: 0 }}>
              <Box sx={{ height: headerHeight }} />
              {Array.from({ length: rows }).map((_, idx) => {
                const hour = 6 + idx;
                const ampm = hour < 12 ? "AM" : "PM";
                const dispHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                return (
                  <Box key={hour} sx={{ height: rowHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: "0.68rem" }}>
                      {dispHour} {ampm}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Day columns grid */}
            <Box sx={{ flexGrow: 1 }}>
              {/* Header labels */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid", borderColor: "grey.100", minHeight: headerHeight, bgcolor: "white" }}>
                {weekDays.map((wd) => {
                  const isToday = wd.iso === todayISO;
                  return (
                    <Box
                      key={wd.iso}
                      onClick={() => {
                        setCurrentDate(wd.dateObj);
                        setMode("day");
                      }}
                      sx={{
                        p: 1,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        borderRight: "1px solid",
                        borderColor: "grey.100",
                        bgcolor: isToday ? "rgba(99, 102, 241, 0.04)" : "transparent",
                        transition: "background-color 0.15s",
                        "&:hover": { bgcolor: "grey.50" },
                      }}
                    >
                      <Typography variant="caption" fontWeight={800} color={isToday ? "primary.main" : "text.secondary"} sx={{ textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: 0.5 }}>
                        {wd.label.split(" ")[0]}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={900}
                        color={isToday ? "white" : "text.primary"}
                        sx={{
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          bgcolor: isToday ? "primary.main" : "transparent",
                          mt: 0.2,
                        }}
                      >
                        {wd.label.split(" ")[1]}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Grid content rows */}
              <Box sx={{ position: "relative", height: bodyHeight }}>
                {/* Horizontal row cells */}
                {Array.from({ length: rows }).map((_, rowIdx) => (
                  <Box
                    key={rowIdx}
                    sx={{
                      height: rowHeight,
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      borderBottom: "1px solid",
                      borderColor: "grey.50",
                      boxSizing: "border-box",
                    }}
                  >
                    {Array.from({ length: 7 }).map((__, colIdx) => (
                      <Box key={colIdx} sx={{ borderRight: "1px solid", borderColor: "grey.100", height: "100%" }} />
                    ))}
                  </Box>
                ))}

                {/* Overlaps positioned events */}
                {positionedWeekEvents.map((ev) => {
                  const { topPx, heightPx } = computePxForEvent(ev.start, ev.end, dayStart, dayEnd, bodyHeight);
                  const columnPercent = 100 / 7;
                  const leftOffset = ev.dayIndex * columnPercent;

                  const widthPercent = columnPercent / ev.totalCols;
                  const leftColOffset = ev.col * widthPercent;

                  return (
                    <Box
                      key={ev.id}
                      onClick={() => openEventDrawer(ev)}
                      sx={{
                        position: "absolute",
                        top: topPx,
                        height: heightPx - 3,
                        left: `calc(${leftOffset + leftColOffset}% + 4px)`,
                        width: `calc(${widthPercent}% - 8px)`,
                        bgcolor: ev.cfg.bg,
                        border: "1.5px solid",
                        borderColor: ev.cfg.border,
                        borderRadius: 2,
                        p: 1,
                        cursor: "pointer",
                        zIndex: 2,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          zIndex: 5,
                          transform: "scale(1.02)",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                        },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={800} color={ev.cfg.color} sx={{ fontSize: "0.78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.1 }}>
                          {ev.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", fontSize: "0.68rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", mt: 0.2 }}>
                          {ev.subtitle}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: "auto" }}>
                        <AccessTimeIcon sx={{ fontSize: 9, color: ev.cfg.color }} />
                        <Typography variant="caption" fontWeight={700} color={ev.cfg.color} sx={{ fontSize: "0.62rem" }}>
                          {ev.start}
                        </Typography>
                      </Stack>
                    </Box>
                  );
                })}

                {/* Live Current Time Marker */}
                {isTimeInBounds &&
                  weekDays.map((wd, dayIdx) => {
                    if (wd.iso !== todayISO) return null;
                    const columnPercent = 100 / 7;
                    const leftOffset = dayIdx * columnPercent;
                    return (
                      <Box
                        key={`time-${wd.iso}`}
                        sx={{
                          position: "absolute",
                          left: `${leftOffset}%`,
                          width: `${columnPercent}%`,
                          top: currentHourTopPx,
                          height: 1,
                          bgcolor: "error.main",
                          zIndex: 10,
                          pointerEvents: "none",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: -4,
                            top: -3.5,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "error.main",
                          },
                        }}
                      />
                    );
                  })}
              </Box>
            </Box>
          </Box>
        )}

        {/* 2. DAY VIEW */}
        {mode === "day" && (
          <Box sx={{ display: "flex" }}>
            {/* Timeline hour sidebar */}
            <Box sx={{ width: 85, borderRight: "1px solid", borderColor: "grey.100", bgcolor: "grey.50", py: 1, flexShrink: 0 }}>
              <Box sx={{ height: 20 }} />
              {Array.from({ length: rows }).map((_, idx) => {
                const hour = 6 + idx;
                const ampm = hour < 12 ? "AM" : "PM";
                const dispHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                return (
                  <Box key={hour} sx={{ height: rowHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: "0.68rem" }}>
                      {dispHour} {ampm}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Single day schedule container */}
            <Box sx={{ flexGrow: 1, position: "relative", height: bodyHeight + 20, pt: 2.5 }}>
              {/* Grid cell lines */}
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <Box
                  key={rowIdx}
                  sx={{
                    height: rowHeight,
                    borderBottom: "1px solid",
                    borderColor: "grey.100",
                    mx: 2,
                  }}
                />
              ))}

              {/* Day events blocks */}
              {positionedDayEvents.map((ev) => {
                const { topPx, heightPx } = computePxForEvent(ev.start, ev.end, dayStart, dayEnd, bodyHeight);
                const widthPercent = 100 / ev.totalCols;
                const leftOffset = ev.col * widthPercent;

                return (
                  <Box
                    key={ev.id}
                    onClick={() => openEventDrawer(ev)}
                    sx={{
                      position: "absolute",
                      top: topPx + 20,
                      height: heightPx - 4,
                      left: `calc(${leftOffset}% + 20px)`,
                      width: `calc(${widthPercent}% - 40px)`,
                      bgcolor: ev.cfg.bg,
                      border: "1.5px solid",
                      borderColor: ev.cfg.border,
                      borderRadius: 3,
                      p: 2,
                      cursor: "pointer",
                      zIndex: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                        <Chip
                          label={ev.cfg.label}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            bgcolor: ev.cfg.border,
                            color: ev.cfg.color,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          #{ev.id}
                        </Typography>
                      </Stack>
                      <Typography variant="subtitle1" fontWeight={900} color={ev.cfg.color} sx={{ lineHeight: 1.2 }}>
                        {ev.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mt: 0.5 }}>
                        Client: {ev.subtitle}
                      </Typography>
                    </Box>

                    <Stack alignItems="flex-end" justifyContent="space-between" sx={{ height: "100%", flexShrink: 0 }}>
                      <Typography variant="subtitle2" fontWeight={800} color={ev.cfg.color}>
                        {ev.start} - {ev.end}
                      </Typography>
                      {ev.rawBooking.price && (
                        <Typography variant="h6" fontWeight={900} color="text.primary">
                          ₹{ev.rawBooking.price}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                );
              })}

              {/* Day Time Indicator Line */}
              {isTimeInBounds && toISODate(currentDate) === todayISO && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 20,
                    right: 20,
                    top: currentHourTopPx + 20,
                    height: 1.5,
                    bgcolor: "error.main",
                    zIndex: 10,
                    pointerEvents: "none",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: -4,
                      top: -3,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "error.main",
                    },
                  }}
                />
              )}

              {/* Empty state single day */}
              {positionedDayEvents.length === 0 && (
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <Stack spacing={1} alignItems="center">
                    <EventAvailableIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      No appointments scheduled for this day
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* 3. MONTH VIEW */}
        {mode === "month" && (
          <Box>
            {/* Week header labels */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid", borderColor: "grey.100", minHeight: 40, bgcolor: "grey.50" }}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
                <Box key={dayName} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: 0.5 }}>
                    {dayName}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Days grid layout */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(105px, 1fr)" }}>
              {monthGridDays.map((cell, idx) => {
                const cellEvents = events.filter((ev) => ev.dateStr === cell.iso);
                const isCellToday = cell.iso === todayISO;

                return (
                  <Box
                    key={`${cell.iso}-${idx}`}
                    onClick={() => {
                      setCurrentDate(cell.date);
                      setMode("day");
                    }}
                    sx={{
                      p: 1.2,
                      borderRight: "1px solid",
                      borderBottom: "1px solid",
                      borderColor: "grey.100",
                      bgcolor: isCellToday ? "rgba(99, 102, 241, 0.02)" : "white",
                      opacity: cell.isCurrentMonth ? 1 : 0.45,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      minHeight: 105,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      "&:hover": { bgcolor: "grey.50" },
                    }}
                  >
                    {/* Day number */}
                    <Box display="flex" justifyContent="flex-end">
                      <Typography
                        variant="caption"
                        fontWeight={900}
                        color={isCellToday ? "white" : "text.primary"}
                        sx={{
                          width: 22,
                          height: 22,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          bgcolor: isCellToday ? "primary.main" : "transparent",
                          fontSize: "0.72rem",
                        }}
                      >
                        {cell.date.getDate()}
                      </Typography>
                    </Box>

                    {/* Compact Events chips inside monthly cell */}
                    <Stack spacing={0.5} sx={{ mt: 1, overflow: "hidden" }}>
                      {cellEvents.slice(0, 3).map((ev) => (
                        <Box
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventDrawer(ev);
                          }}
                          sx={{
                            px: 1,
                            py: 0.2,
                            borderRadius: 1,
                            bgcolor: ev.cfg.bg,
                            borderLeft: "2.5px solid",
                            borderColor: ev.cfg.color,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="caption" fontWeight={800} color={ev.cfg.color} sx={{ fontSize: "0.6rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ev.start} {ev.title}
                          </Typography>
                        </Box>
                      ))}
                      {cellEvents.length > 3 && (
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: "0.58rem", pl: 0.5 }}>
                          + {cellEvents.length - 3} more
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* 4. LIST / AGENDA VIEW */}
        {mode === "list" && (
          <Box sx={{ p: 3 }}>
            {/* Search and status filter dashboard */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }} justifyContent="space-between">
              <TextField
                size="small"
                placeholder="Search appointments, clients, or IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  width: { xs: "100%", sm: 320 },
                  "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "white" },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction="row" spacing={0.8} overflow="auto" sx={{ py: 0.5 }}>
                {[
                  { value: "all", label: "All Statuses" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ].map((opt) => {
                  const isSel = statusFilter === opt.value;
                  return (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      onClick={() => setStatusFilter(opt.value)}
                      variant={isSel ? "filled" : "outlined"}
                      color={isSel ? "primary" : "default"}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        height: 28,
                        cursor: "pointer",
                      }}
                    />
                  );
                })}
              </Stack>
            </Stack>

            {/* Appointments vertical listings */}
            <Stack spacing={2}>
              {listEventsFiltered.map((ev) => {
                const b = ev.rawBooking;
                const formattedDate = new Date(ev.dateStr + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <Tooltip
                    key={ev.id}
                    placement="top"
                    arrow
                    title={
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="caption" fontWeight={800} display="block">{ev.title}</Typography>
                        <Typography variant="caption" color="grey.300" display="block">#{ev.id} · {ev.subtitle}</Typography>
                        <Typography variant="caption" color="grey.300" display="block">{formattedDate} · {ev.start}–{ev.end}</Typography>
                        {b.price && <Typography variant="caption" color="grey.200" fontWeight={700} display="block">₹{b.price}</Typography>}
                        {(b.address_details || b.address) && (
                          <Typography variant="caption" color="grey.400" display="block" sx={{ mt: 0.3 }}>
                            📍 {b.address_details ? `${b.address_details.address_line || ""}, ${b.address_details.city || ""}` : b.address}
                          </Typography>
                        )}
                      </Box>
                    }
                    componentsProps={{ tooltip: { sx: { bgcolor: "grey.900", borderRadius: 2, maxWidth: 260 } }, arrow: { sx: { color: "grey.900" } } }}
                  >
                  <Paper
                    elevation={0}
                    onClick={() => openEventDrawer(ev)}
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 3,
                      border: "1.5px solid",
                      borderColor: "grey.100",
                      bgcolor: "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: ev.cfg.border,
                        boxShadow: `0 6px 24px rgba(0,0,0,0.06)`,
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    {/* Colored left accent bar */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 4, borderRadius: 4, flexShrink: 0, background: ev.cfg.color, minHeight: 60, opacity: 0.7 }} />

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Grid container spacing={2} alignItems="center">
                          {/* Left: Schedule stamp */}
                          <Grid item xs={12} sm={3.5} md={3}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2.5,
                                  bgcolor: ev.cfg.bg,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  border: `1.5px solid ${ev.cfg.border}`,
                                }}
                              >
                                <CalendarTodayIcon sx={{ fontSize: 20, color: ev.cfg.color }} />
                              </Box>
                              <Box>
                                <Typography variant="body2" fontWeight={800} color="text.primary">
                                  {formattedDate}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mt: 0.1, display: "block" }}>
                                  {ev.start} – {ev.end}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>

                          {/* Middle: Service + address */}
                          <Grid item xs={12} sm={4.5} md={5.5}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={900} color="text.primary" sx={{ lineHeight: 1.2 }}>
                                {ev.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 0.3, display: "block" }}>
                                Client: {ev.subtitle} · #{ev.id}
                              </Typography>
                              {/* Address preview */}
                              {(b.address_details || b.address) && (
                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.8 }}>
                                  <LocationOnIcon sx={{ fontSize: 13, color: "error.light", flexShrink: 0 }} />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: "-webkit-box",
                                      WebkitLineClamp: 1,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                      fontWeight: 500,
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {b.address_details
                                      ? `${b.address_details.address_line || ""}, ${b.address_details.city || ""}`
                                      : b.address}
                                  </Typography>
                                </Stack>
                              )}
                            </Box>
                          </Grid>

                          {/* Right: Price, status & action buttons */}
                          <Grid item xs={12} sm={4} md={3.5}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ sm: "flex-end" }} sx={{ width: "100%" }}>
                              <Box textAlign="right" sx={{ flex: 1 }}>
                                {b.price && (
                                  <Typography variant="h6" fontWeight={900} color="text.primary" sx={{ lineHeight: 1, mb: 0.5 }}>
                                    ₹{b.price}
                                  </Typography>
                                )}
                                <Chip
                                  label={ev.cfg.label}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "0.62rem",
                                    fontWeight: 800,
                                    bgcolor: ev.cfg.bg,
                                    color: ev.cfg.color,
                                    border: `1.5px solid ${ev.cfg.border}`,
                                  }}
                                />
                              </Box>

                              {/* Chat icon button */}
                              <Tooltip title="Chat with client" placement="top">
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); handleChatWithClient(b); }}
                                  sx={{
                                    bgcolor: "#eff6ff",
                                    color: "#2563eb",
                                    border: "1.5px solid #bfdbfe",
                                    borderRadius: 2,
                                    width: 34,
                                    height: 34,
                                    flexShrink: 0,
                                    "&:hover": { bgcolor: "#dbeafe" },
                                  }}
                                >
                                  <ChatIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>

                              {/* Invoice icon button */}
                              <Tooltip title="Download invoice" placement="top">
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(ev.id); }}
                                  sx={{
                                    bgcolor: "#f5f3ff",
                                    color: "#7c3aed",
                                    border: "1.5px solid #ddd6fe",
                                    borderRadius: 2,
                                    width: 34,
                                    height: 34,
                                    flexShrink: 0,
                                    "&:hover": { bgcolor: "#ede9fe" },
                                  }}
                                >
                                  <DescriptionIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  </Paper>
                  </Tooltip>
                );
              })}

              {listEventsFiltered.length === 0 && (
                <Box sx={{ p: 8, textAlign: "center" }}>
                  <Stack spacing={1.5} alignItems="center">
                    <SearchIcon sx={{ fontSize: 44, color: "text.disabled" }} />
                    <Typography variant="body1" color="text.secondary" fontWeight={700}>
                      No appointments matching search terms.
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* ── INTERACTIVE EVENT DETAILS DRAWER ── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "95vw", sm: 560 },
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            boxShadow: "-10px 0 40px rgba(0,0,0,0.1)",
            bgcolor: "#f8fafc",
            overflow: "hidden",
          },
        }}
      >
        {selectedEvent && (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {/* Header banner */}
            <Box>
              <Box sx={{ p: 2.5, bgcolor: "white", borderBottom: "1px solid", borderColor: "grey.100", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" fontWeight={900}>
                  Appointment Card
                </Typography>
                <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ bgcolor: "grey.50" }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              {/* Scrollable details form */}
              <Box sx={{ p: 3, overflowY: "auto", maxHeight: "calc(100vh - 160px)" }}>
                {/* Status and ID row */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <Chip
                    label={selectedEvent.cfg.label}
                    sx={{
                      bgcolor: selectedEvent.cfg.bg,
                      color: selectedEvent.cfg.color,
                      border: `1.5px solid ${selectedEvent.cfg.border}`,
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      textTransform: "uppercase",
                      height: 24,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Booking ID: #{selectedEvent.id}
                  </Typography>
                </Stack>

                {/* Service Card info */}
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "grey.200", bgcolor: "white", mb: 3 }}>
                  <Typography variant="caption" fontWeight={850} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.58rem", display: "block", mb: 0.8 }}>
                    Service Booked
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={900} color="text.primary" sx={{ lineHeight: 1.2 }}>
                    {selectedEvent.title}
                  </Typography>
                  {selectedEvent.rawBooking.category_name && (
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mt: 0.4, display: "block" }}>
                      Category: {selectedEvent.rawBooking.category_name}
                    </Typography>
                  )}
                  {selectedEvent.rawBooking.service_description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: "0.76rem", lineHeight: 1.4 }}>
                      {selectedEvent.rawBooking.service_description}
                    </Typography>
                  )}
                </Paper>

                {/* Schedule details */}
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "grey.200", bgcolor: "white", mb: 3 }}>
                  <Typography variant="caption" fontWeight={850} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.58rem", display: "block", mb: 1.2 }}>
                    Schedule
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CalendarTodayIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", fontSize: "0.6rem", textTransform: "uppercase" }}>
                          Date
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color="text.primary">
                          {new Date(selectedEvent.dateStr + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <AccessTimeIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", fontSize: "0.6rem", textTransform: "uppercase" }}>
                          Time slot
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color="text.primary">
                          {selectedEvent.start} - {selectedEvent.end} (1 hr duration)
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Client Contact Info */}
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "grey.200", bgcolor: "white", mb: 3 }}>
                  <Typography variant="caption" fontWeight={850} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.58rem", display: "block", mb: 1.2 }}>
                    Client Information
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: "primary.light", fontWeight: 800, width: 38, height: 38 }}>
                        {selectedEvent.subtitle.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={800} color="text.primary">
                          {selectedEvent.subtitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Client Owner
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ borderStyle: "dashed" }} />

                    {selectedEvent.rawBooking.phone && (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <PhoneIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", fontSize: "0.6rem" }}>
                            Phone
                          </Typography>
                          <Typography
                            component="a"
                            href={`tel:${selectedEvent.rawBooking.phone}`}
                            variant="body2"
                            fontWeight={800}
                            color="primary.main"
                            sx={{ textDecoration: "none" }}
                          >
                            {selectedEvent.rawBooking.phone}
                          </Typography>
                        </Box>
                      </Stack>
                    )}

                    {selectedEvent.rawBooking.user_email && (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <EmailIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", fontSize: "0.6rem" }}>
                            Email
                          </Typography>
                          <Typography
                            component="a"
                            href={`mailto:${selectedEvent.rawBooking.user_email}`}
                            variant="body2"
                            fontWeight={800}
                            color="primary.main"
                            sx={{ textDecoration: "none" }}
                          >
                            {selectedEvent.rawBooking.user_email}
                          </Typography>
                        </Box>
                      </Stack>
                    )}
                  </Stack>
                </Paper>

                {/* Location address */}
                {(selectedEvent.rawBooking.address_details || selectedEvent.rawBooking.address) && (() => {
                  const ad = selectedEvent.rawBooking.address_details;
                  const addressText = ad
                    ? [ad.address_line, ad.city, ad.district, ad.state, ad.postal_code].filter(Boolean).join(", ")
                    : selectedEvent.rawBooking.address;
                  const mapsQuery = encodeURIComponent(addressText);
                  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

                  return (
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "grey.200", bgcolor: "white", mb: 3 }}>
                      <Typography variant="caption" fontWeight={850} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.58rem", display: "block", mb: 1.2 }}>
                        Service Address
                      </Typography>

                      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
                        <LocationOnIcon sx={{ fontSize: 20, color: "error.main", mt: 0.2, flexShrink: 0 }} />
                        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.5 }}>
                          {addressText}
                        </Typography>
                      </Stack>

                      {/* Get Directions button */}
                      <Button
                        component="a"
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        variant="contained"
                        fullWidth
                        startIcon={<DirectionsIcon />}
                        endIcon={<OpenInNewIcon sx={{ fontSize: "14px !important" }} />}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 2,
                          py: 1,
                          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                          "&:hover": {
                            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                          },
                          textDecoration: "none",
                        }}
                      >
                        Get Directions
                      </Button>
                    </Paper>
                  );
                })()}

                {/* Payment info / pricing summary */}
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "grey.200", bgcolor: "white", mb: 3 }}>
                  <Typography variant="caption" fontWeight={850} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.58rem", display: "block", mb: 1.2 }}>
                    Billing Details
                  </Typography>
                  <Stack spacing={1.2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Total Price
                      </Typography>
                      <Typography variant="body2" fontWeight={800} color="text.primary">
                        ₹{selectedEvent.rawBooking.price}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Advance Paid
                      </Typography>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          ₹{selectedEvent.rawBooking.advance}
                        </Typography>
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: "10px !important", color: "#15803d" }} />}
                          label="Paid"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: "0.58rem",
                            fontWeight: 800,
                            bgcolor: "#f0fdf4",
                            color: "#15803d",
                            "& .MuiChip-icon": { color: "#15803d" },
                          }}
                        />
                      </Stack>
                    </Stack>
                    {selectedEvent.rawBooking.remaining_payment > 0 && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Remaining Payment
                        </Typography>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Typography variant="body2" fontWeight={800} color="primary.main">
                            ₹{selectedEvent.rawBooking.remaining_payment}
                          </Typography>
                          <Chip
                            label={selectedEvent.rawBooking.is_fully_paid ? "Paid" : "Due at Service"}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: "0.58rem",
                              fontWeight: 800,
                              bgcolor: selectedEvent.rawBooking.is_fully_paid ? "#f0fdf4" : "#eff6ff",
                              color: selectedEvent.rawBooking.is_fully_paid ? "#15803d" : "#0369a1",
                            }}
                          />
                        </Stack>
                      </Stack>
                    )}
                  </Stack>
                </Paper>

                {selectedEvent.rawBooking.notes && (
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "grey.200", bgcolor: "white", mb: 3 }}>
                    <Typography variant="caption" fontWeight={850} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.58rem", display: "block", mb: 1.2 }}>
                      Client Notes
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <NotesIcon sx={{ fontSize: 16, color: "text.disabled", mt: 0.2 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", lineHeight: 1.4 }}>
                        "{selectedEvent.rawBooking.notes}"
                      </Typography>
                    </Stack>
                  </Paper>
                )}
              </Box>
            </Box>

            {/* Bottom Actions footer bar */}
            <Box sx={{ p: 2.5, bgcolor: "white", borderTop: "1px solid", borderColor: "grey.100" }}>
              <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
                {/* 1. Confirm -> Start Job */}
                {selectedEvent.status === "confirmed" && (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleStatusChange(selectedEvent.id, "in_progress")}
                    disabled={updatingStatus}
                    startIcon={updatingStatus ? <CircularProgress size={16} color="inherit" /> : <PlayCircleFilledIcon />}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, py: 1.2, bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
                  >
                    Start Job
                  </Button>
                )}

                {/* 2. In Progress -> Complete Job */}
                {selectedEvent.status === "in_progress" && (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleStatusChange(selectedEvent.id, "completed")}
                    disabled={updatingStatus}
                    startIcon={updatingStatus ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, py: 1.2, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
                  >
                    Complete Job
                  </Button>
                )}

                {/* 3. Chat with client — icon only */}
                <Tooltip title="Chat with client" placement="top">
                  <IconButton
                    onClick={() => handleChatWithClient(selectedEvent.rawBooking)}
                    sx={{
                      bgcolor: "#eff6ff",
                      color: "#2563eb",
                      border: "1.5px solid #bfdbfe",
                      borderRadius: 2,
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      "&:hover": { bgcolor: "#dbeafe" },
                    }}
                  >
                    <ChatIcon sx={{ fontSize: 19 }} />
                  </IconButton>
                </Tooltip>

                {/* 4. Download Invoice — icon only */}
                <Tooltip title="Download invoice" placement="top">
                  <IconButton
                    onClick={() => handleDownloadInvoice(selectedEvent.id)}
                    sx={{
                      bgcolor: "#f5f3ff",
                      color: "#7c3aed",
                      border: "1.5px solid #ddd6fe",
                      borderRadius: 2,
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      "&:hover": { bgcolor: "#ede9fe" },
                    }}
                  >
                    <DescriptionIcon sx={{ fontSize: 19 }} />
                  </IconButton>
                </Tooltip>

                {/* 5. Cancel Job option */}
                {(selectedEvent.status === "pending" || selectedEvent.status === "confirmed") && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleStatusChange(selectedEvent.id, "cancelled")}
                    disabled={updatingStatus}
                    startIcon={<CancelIcon />}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, py: 1.2, px: 2 }}
                  >
                    Cancel
                  </Button>
                )}
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
