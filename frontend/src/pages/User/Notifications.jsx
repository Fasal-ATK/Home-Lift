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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  DoneAll,
  Close,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchNotifications,
  markNotificationRead,
} from "../../redux/slices/notificationSlice";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";


const Notifications = () => {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.notifications);

  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedNote, setSelectedNote] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleOpenModal = (note) => {
    setSelectedNote(note);
    setOpenModal(true);
    if (!note.is_read) dispatch(markNotificationRead(note.id));
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedNote(null);
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
        elevation={note.is_read ? 1 : 4}
        onClick={() => handleOpenModal(note)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderRadius: 2,
          cursor: "pointer",
          backgroundColor: note.is_read ? "#f8f9fa" : "#e8f1ff",
          borderLeft: note.is_read
            ? "5px solid #cfd8dc"
            : "5px solid #007bff",
          "&:hover": { boxShadow: 6 },
          transition: "0.2s ease-in-out",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          <Avatar sx={{ bgcolor: note.is_read ? "#90caf9" : "#007bff", mr: 3 }}>
            <NotificationsIcon />
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={note.is_read ? "500" : "bold"}
              color={note.is_read ? "text.secondary" : "text.primary"}
            >
              {note.title || note.type.toUpperCase()}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              From: {note.sender_name || "System"} |{" "}
              {new Date(note.created_at).toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* ✅ Read/Unread Icon */}
        {note.is_read ? (
          <MarkEmailReadIcon sx={{ color: "#4caf50" }} />
        ) : (
          <MarkEmailUnreadIcon sx={{ color: "#ff9800" }} />
        )}
      </Paper>
    ))}
  </Box>
)}
      {/* 🧾 View Notification Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            p: 2,
          },
        }}
      >
        {selectedNote && (
          <>
            <DialogTitle
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Typography variant="h6" fontWeight="bold">
                {selectedNote.title || "Notification"}
              </Typography>
              <Box flexGrow={1} />
              <Tooltip
                title={selectedNote.is_read ? "Read" : "Unread"}
                arrow
              >
                <IconButton
                  color={selectedNote.is_read ? "success" : "default"}
                  size="small"
                >
                  {selectedNote.is_read ? <DoneAll /> : <CheckCircle />}
                </IconButton>
              </Tooltip>
              <IconButton onClick={handleCloseModal}>
                <Close />
              </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedNote.message}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  From: {selectedNote.sender_name || "System"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(selectedNote.created_at).toLocaleString()}
                </Typography>
              </Box>
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseModal} variant="contained">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Notifications;
