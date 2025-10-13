import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchNotifications,
  markNotificationRead,
} from "../../redux/slices/notificationSlice";

const Notifications = () => {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.notifications);
  const [filter, setFilter] = useState("all"); // all, read, unread
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) setFilter(newFilter);
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  // ✅ Filter notifications
  const filteredNotifications = list.filter((note) => {
    if (filter === "read") return note.is_read;
    if (filter === "unread") return !note.is_read;
    return true;
  });

  // ✅ Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #e0f7fa, #fff)",
        py: 6,
        px: { xs: 2, md: 6 },
      }}
    >
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Notifications
      </Typography>

      {/* 🔍 Filter & Sort Controls */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          mb: 3,
        }}
      >
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          aria-label="notification filter"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="unread">Unread</ToggleButton>
          <ToggleButton value="read">Read</ToggleButton>
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortOrder}
            onChange={handleSortChange}
            label="Sort By"
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 🔔 Notification List */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">
          Failed to load notifications: {error}
        </Typography>
      ) : sortedNotifications.length === 0 ? (
        <Typography>No notifications found.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sortedNotifications.map((note) => (
            <Paper
              key={note.id}
              elevation={2}
              onClick={() => handleMarkRead(note.id)}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                p: 2,
                borderRadius: 2,
                cursor: "pointer",
                backgroundColor: note.is_read ? "#f5f5f5" : "#fff",
                borderLeft: note.is_read
                  ? "5px solid transparent"
                  : "5px solid #007bff",
                "&:hover": { boxShadow: 6 },
                transition: "0.2s ease-in-out",
              }}
            >
              <Avatar sx={{ bgcolor: "#0066CC", mr: 2 }}>
                <NotificationsIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {note.title || note.type.toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {note.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  From: {note.sender_name || "System"} | Received by:{" "}
                  {note.recipient_name || "You"}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Notifications;
