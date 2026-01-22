// src/components/Appointments.jsx

import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useNavigate } from "react-router-dom";
import { providerJobService } from "../../services/apiServices";

import { toast } from "react-toastify";
import { useEffect } from "react";


// ------------------ Helpers ------------------
function pad(n) {
  return String(n).padStart(2, "0");
}

function minutesFromMidnight(hm) {
  if (!hm) return 0;
  const [h, m] = String(hm).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function computePxForEvent(startHM, endHM, dayStart = "08:00", dayEnd = "18:00", bodyHeight = 600) {
  const startMin = minutesFromMidnight(startHM);
  const endMin = minutesFromMidnight(endHM);
  const base = minutesFromMidnight(dayStart);
  const total = Math.max(1, minutesFromMidnight(dayEnd) - base);

  const topPx = Math.max(0, ((startMin - base) / total) * bodyHeight);
  const heightPx = Math.max(28, ((endMin - startMin) / total) * bodyHeight);

  return { topPx, heightPx };
}

function dayLabel(iso) {
  const d = new Date(iso);
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

// ------------------ Component ------------------
export default function WeekScheduleDemo() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("week");

  const [pastRange, setPastRange] = useState("all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);


  // weekStart is a Date representing the Monday of the visible week
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));

  // UI sizing & layout
  const dayStart = "06:00";
  const dayEnd = "22:00";
  const rows = 16;
  const rowHeight = 60;
  const headerHeight = 56;
  const bodyHeight = rows * rowHeight;
  const columnCount = 7; // 7 days
  const columnPercent = 100 / columnCount;
  const horizontalGutterPx = 12;

  // build weekDays from weekStart
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(weekStart, i);
      const iso = d.toISOString().slice(0, 10);
      return { iso, label: dayLabel(iso) };
    });
  }, [weekStart]);

  // Fetch real appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const data = await providerJobService.getMyAppointments();

        // Map backend bookings to calendar events
        const mapped = data.map((b) => {
          const wsISO = toISODate(weekStart);
          const bISO = b.booking_date;

          const d1 = new Date(wsISO + "T00:00:00Z");
          const d2 = new Date(bISO + "T00:00:00Z");

          const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));

          const [h, m] = b.booking_time.split(":").map(Number);
          const endH = (h + 1).toString().padStart(2, '0');
          const endT = `${endH}:${m.toString().padStart(2, '0')}`;

          const getStatusColor = (status) => {
            switch (status) {
              case "completed":
                return "#5ce267ff"; // Light Green
              case "confirmed":
                return "#fff172ff"; // Light Yellow
              case "in_progress":
                return "#4fb5ffff"; // Light Blue
              case "cancelled":
                return "#ff5555ff"; // Light Red
              default:
                return "#bebebeff"; // Default Light Grey
            }
          };

          return {
            id: b.id,
            day: diffDays,
            start: b.booking_time.slice(0, 5),
            end: endT,
            title: b.service_name,
            subtitle: b.full_name,
            color: getStatusColor(b.status),
          };
        });

        setEvents(mapped);
      } catch (err) {
        toast.error("Failed to load appointments");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [weekStart]);


  // Navigation handlers
  const goPreviousWeek = () => setWeekStart((s) => addDays(s, -7));
  const goNextWeek = () => setWeekStart((s) => addDays(s, 7));
  const goToday = () => setWeekStart(startOfWeekMonday(new Date()));

  // Position events for overlaps
  const positionedEvents = useMemo(() => {
    // Group by day first
    const byDay = {};
    events.forEach((ev) => {
      if (!byDay[ev.day]) byDay[ev.day] = [];
      byDay[ev.day].push(ev);
    });

    const processed = [];
    Object.keys(byDay).forEach((dayNum) => {
      const dayEvents = byDay[dayNum].sort((a, b) => a.start.localeCompare(b.start));

      // Simple clustering: if an event overlaps with ANY event in a cluster, it belongs to that cluster
      let clusters = [];
      dayEvents.forEach((ev) => {
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

      // Assign columns within each cluster
      clusters.forEach((cluster) => {
        cluster.forEach((ev, idx) => {
          processed.push({
            ...ev,
            col: idx,
            totalCols: cluster.length,
          });
        });
      });
    });
    return processed;
  }, [events]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto", bgcolor: "#fff" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: "#eef4ea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarTodayIcon sx={{ color: "#7aa86b" }} />
            </Box>
            <Typography variant="subtitle2" sx={{ color: "#7aa86b" }}>
              Week of {new Date(weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={goPreviousWeek} title="Previous week">
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <Button size="small" variant="outlined" onClick={goToday}>
              Today
            </Button>
            <IconButton size="small" onClick={goNextWeek} title="Next week">
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <ToggleButtonGroup value={mode} exclusive onChange={(e, v) => v && setMode(v)} size="small">
          <ToggleButton value="day">Day</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Calendar */}
      <Box sx={{ display: "flex", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
        {loading && (
          <Box sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(255,255,255,0.7)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 'bold'
          }}>
            Loading appointments...
          </Box>
        )}
        {/* Time Column */}
        <Box sx={{ width: 110, borderRight: "1px solid rgba(0,0,0,0.06)", bgcolor: "#fafafa", p: 1 }}>
          {/* <-- spacer to align with header of day columns --> */}
          <Box sx={{ height: headerHeight }} />

          {/* time rows (start at same vertical offset as day grid) */}
          {Array.from({ length: rows }).map((_, idx) => {
            const hour = 6 + idx;
            const ampm = hour < 12 ? "am" : "pm";
            const dispHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);

            return (
              <Box
                key={hour}
                sx={{
                  height: rowHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {pad(dispHour)}.00 {ampm}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Day Columns */}
        <Box sx={{ flex: 1, position: "relative" }}>
          {/* Day Headers */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              bgcolor: "#fff",
              minHeight: headerHeight,
            }}
          >
            {weekDays.map((d) => (
              <Box key={d.iso} sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {d.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Grid Rows */}
          <Box
            sx={{
              position: "relative",
              height: bodyHeight,
              display: "grid",
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            }}
          >
            {/* Table-like Cells */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <React.Fragment key={rowIdx}>
                {Array.from({ length: columnCount }).map((__, colIdx) => (
                  <Box
                    key={`${rowIdx}-${colIdx}`}
                    sx={{
                      borderRight: colIdx === columnCount - 1 ? "none" : "1px solid rgba(0,0,0,0.06)",
                      borderBottom: "2px solid rgba(0,0,0,0.06)",
                      height: rowHeight,
                    }}
                  />
                ))}
              </React.Fragment>
            ))}

            {/* Events */}
            <Box sx={{ position: "absolute", inset: 0 }}>
              {positionedEvents.map((ev) => {
                // ev.day is 0..6 relative to Monday of a week
                if (ev.day < 0 || ev.day >= columnCount) return null;

                const { topPx, heightPx } = computePxForEvent(ev.start, ev.end, dayStart, dayEnd, bodyHeight);
                const leftPercent = ev.day * columnPercent;

                const widthPercent = columnPercent / ev.totalCols;
                const offsetPercent = ev.col * widthPercent;

                return (
                  <Box
                    key={ev.id}
                    sx={{
                      position: "absolute",
                      left: `calc(${leftPercent + offsetPercent}% + ${horizontalGutterPx / 2}px)`,
                      width: `calc(${widthPercent}% - ${horizontalGutterPx}px)`,
                      top: topPx, // removed headerHeight offset
                      height: heightPx,
                      bgcolor: ev.color,
                      borderRadius: 2,
                      boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      zIndex: 1,
                      "&:hover": { zIndex: 2, boxShadow: "0 8px 18px rgba(0,0,0,0.15)" },
                    }}
                    onClick={() => navigate(`/provider/job-requests/details/${ev.id}`)}
                  >
                    <Box sx={{ overflow: "hidden" }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ev.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ev.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              {!loading && events.length === 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No appointments scheduled for this week
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
        <Button variant="outlined" size="small">Pick week</Button>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={pastRange} onChange={(e) => setPastRange(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="this_week">This Week</MenuItem>
            <MenuItem value="past3m">Past 3 Months</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
}
