// src/components/WeekScheduleDemo.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

// ------------------ Helpers ------------------
function pad(n) { return String(n).padStart(2, "0"); }

function minutesFromMidnight(hm) {
  if (!hm) return 0;
  const [h, m] = String(hm).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// compute top (%) and height (%) relative to dayStart..dayEnd
function computeStyleForEvent(startHM, endHM, dayStart = "06:00", dayEnd = "20:00") {
  const startMin = minutesFromMidnight(startHM);
  const endMin = minutesFromMidnight(endHM);
  const base = minutesFromMidnight(dayStart);
  const total = minutesFromMidnight(dayEnd) - base;
  const topPerc = Math.max(0, ((startMin - base) / total) * 100);
  const heightPerc = Math.max(3, ((endMin - startMin) / total) * 100);
  return { top: `${topPerc}%`, height: `${heightPerc}%` };
}

function toLocalYMD(dateStr) {
  if (!dateStr) return null;
  try {
    const simpleMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    if (simpleMatch) return dateStr;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return null;
  }
}

function dayLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

// ------------------ Demo data ------------------
// compute week start (Monday)
const sampleWeekStart = (() => {
  const d = new Date();
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const diff = (day === 0 ? -6 : 1 - day); // make Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
})();

const makeDateIso = (base, dayOffset) => {
  const d = new Date(base);
  d.setDate(base.getDate() + dayOffset);
  return d.toISOString().slice(0,10);
};

// demo events (day: 0 = Mon, 1 = Tue, ... 4 = Fri)
const DEMO_EVENTS = [
  { id: 1, day: 0, start: "07:00", end: "08:00", title: "Devon Lane", subtitle: "Vehicle Maintenance", color: "#E7F64A" },
  { id: 2, day: 2, start: "09:00", end: "10:30", title: "Devon Lane", subtitle: "Vehicle Maintenance", color: "#E7F64A" },
  { id: 3, day: 4, start: "08:30", end: "09:30", title: "Devon Lane", subtitle: "Vehicle Maintenance", color: "#E7F64A" },
  // extra demo entries
  { id: 4, day: 1, start: "11:00", end: "12:15", title: "Anna Roy", subtitle: "AC Service", color: "#9EE6FF" },
  { id: 5, day: 3, start: "13:30", end: "15:00", title: "Home Clean", subtitle: "Deep cleaning", color: "#FFD59E" },
];

// ------------------ Component ------------------
export default function WeekScheduleDemo() {
  const [mode, setMode] = useState("week"); // not used to change layout in this demo
  const [pastRange, setPastRange] = useState("all"); // kept for UI parity
  const weekDays = useMemo(() => {
    return [0,1,2,3,4].map(i => ({ iso: makeDateIso(sampleWeekStart, i), label: dayLabel(makeDateIso(sampleWeekStart, i)) }));
  }, []);

  const dayStart = "06:00";
  const dayEnd = "20:00";

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto", bgcolor: "#fff" }}>
      {/* header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "#eef4ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarTodayIcon sx={{ color: "#7aa86b" }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: "#7aa86b" }}>
                Today, {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </Typography>
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup value={mode} exclusive onChange={(e, v) => v && setMode(v)} size="small">
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {/* calendar grid container */}
      <Box sx={{ display: "flex", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden", minHeight: 920 }}>
        {/* time column */}
        <Box sx={{ width: 100, borderRight: "1px solid rgba(0,0,0,0.04)", bgcolor: "#fafafa", p: 1 }}>
          {Array.from({ length: 15 }).map((_, idx) => {
            const hour = 6 + idx;
            const ampm = hour < 12 ? "am" : "pm";
            const dispHour = hour === 12 ? 12 : ((hour % 12) || 12);
            return (
              <Box key={hour} sx={{ height: 60, display: "flex", alignItems: "center", px: 1 }}>
                <Typography variant="caption" color="text.secondary">{pad(dispHour)}.00 {ampm}</Typography>
              </Box>
            );
          })}
        </Box>

        {/* days grid (5 columns) */}
        <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", position: "relative" }}>
          {/* day headers */}
          {weekDays.map((d) => (
            <Box key={d.iso} sx={{ borderBottom: "1px solid rgba(0,0,0,0.04)", p: 1, bgcolor: "#fff" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{d.label}</Typography>
            </Box>
          ))}

          {/* grid body rows */}
          {Array.from({ length: 15 }).map((_, rowIdx) => (
            <React.Fragment key={rowIdx}>
              {Array.from({ length: 5 }).map((__, colIdx) => (
                <Box key={colIdx} sx={{ minHeight: 60, borderBottom: "1px dashed rgba(0,0,0,0.03)", borderLeft: "1px solid rgba(0,0,0,0.02)" }} />
              ))}
            </React.Fragment>
          ))}

          {/* events overlay (positioned absolute across the grid) */}
          <Box sx={{ gridColumn: "1 / -1", gridRow: "1 / -1", position: "absolute", inset: 0 }}>
            {DEMO_EVENTS.map(ev => {
              const style = computeStyleForEvent(ev.start, ev.end, dayStart, dayEnd);
              const colWidth = `calc(100% / 5)`; // each column width
              return (
                <Box
                  key={ev.id}
                  sx={{
                    position: "absolute",
                    left: `calc(${ev.day} * ${colWidth})`,
                    width: `calc(${colWidth} - 12px)`,
                    transform: "translateX(8px)",
                    top: style.top,
                    height: style.height,
                    bgcolor: ev.color || "#e7f64a",
                    borderRadius: 2,
                    boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
                    p: 1.25,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  title={`${ev.title} — ${ev.subtitle} (${ev.start} - ${ev.end})`}
                  onClick={() => alert(`${ev.title} — ${ev.subtitle}\n${ev.start} - ${ev.end}`)}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "rgba(0,0,0,0.08)", color: "#111" }}>
                    {ev.title.split(" ").map(p=>p[0]).slice(0,2).join("")}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ev.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ev.subtitle}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* small footer controls (demo) */}
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
        <Box>
          <Button variant="outlined" size="small" onClick={() => alert("Open date picker (demo)")}>Pick week</Button>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={pastRange} onChange={(e) => setPastRange(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="this_week">This week</MenuItem>
              <MenuItem value="past3m">Past 3 months</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>
    </Box>
  );
}
