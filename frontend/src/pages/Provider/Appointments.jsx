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

// ------------------ Demo Data ------------------
// `day` indicates offset from weekStart (0 = Monday, 6 = Sunday)
const DEMO_EVENTS = [
  { id: 1, day: 0, start: "08:20", end: "09:30", title: "Devon Lane", subtitle: "Vehicle Maintenance", color: "#E7F64A" },
  { id: 2, day: 2, start: "09:45", end: "11:30", title: "Devon Lane", subtitle: "Vehicle Maintenance", color: "#E7F64A" },
  { id: 3, day: 4, start: "08:30", end: "09:15", title: "Vehicle Service", subtitle: "Oil change", color: "#E7F64A" },
  { id: 4, day: 1, start: "11:00", end: "12:15", title: "Anna Roy", subtitle: "AC Service", color: "#9EE6FF" },
  { id: 5, day: 3, start: "13:30", end: "15:00", title: "Home Clean", subtitle: "Deep cleaning", color: "#FFD59E" },
];

// ------------------ Component ------------------
export default function WeekScheduleDemo() {
  const [mode, setMode] = useState("week");
  const [pastRange, setPastRange] = useState("all");

  // weekStart is a Date representing the Monday of the visible week
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));

  // UI sizing & layout
  const dayStart = "08:00";
  const dayEnd = "18:00";
  const rows = 10;
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

  // Navigation handlers
  const goPreviousWeek = () => setWeekStart((s) => addDays(s, -7));
  const goNextWeek = () => setWeekStart((s) => addDays(s, 7));
  const goToday = () => setWeekStart(startOfWeekMonday(new Date()));

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
      <Box sx={{ display: "flex", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
        {/* Time Column */}
        <Box sx={{ width: 110, borderRight: "1px solid rgba(0,0,0,0.06)", bgcolor: "#fafafa", p: 1 }}>
          {/* <-- spacer to align with header of day columns --> */}
          <Box sx={{ height: headerHeight }} />

          {/* time rows (start at same vertical offset as day grid) */}
          {Array.from({ length: rows }).map((_, idx) => {
            const hour = 8 + idx;
            const ampm = hour < 12 ? "am" : "pm";
            const dispHour = hour === 12 ? 12 : hour % 12 || 12;

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
              {DEMO_EVENTS.map((ev) => {
                // ev.day is 0..6 relative to Monday of a week
                if (ev.day < 0 || ev.day >= columnCount) return null;

                const { topPx, heightPx } = computePxForEvent(ev.start, ev.end, dayStart, dayEnd, bodyHeight);
                const leftPercent = ev.day * columnPercent;

                return (
                  <Box
                    key={ev.id}
                    sx={{
                      position: "absolute",
                      left: `calc(${leftPercent}% + ${horizontalGutterPx / 2}px)`,
                      width: `calc(${columnPercent}% - ${horizontalGutterPx}px)`,
                      top: headerHeight + topPx, // aligns with the grid body
                      height: heightPx,
                      bgcolor: ev.color,
                      borderRadius: 2,
                      boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                    }}
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
