import React, { useEffect, useState, useRef, useCallback } from "react";
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
  Checkbox,
  Fade,
  Slide,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  DoneAll,
  Close,
  Delete,
  MarkEmailRead,
  SelectAll,
  Deselect,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchNotifications,
  markNotificationRead,
  markNotificationsRead,
  deleteNotifications,
  clearNotifications,
} from "../../redux/slices/notificationSlice";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import { toast } from "react-toastify";

const Notifications = () => {
  const dispatch = useDispatch();
  const { list, loading, error, hasMore, page } = useSelector((state) => state.notifications);

  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedNote, setSelectedNote] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // ✅ Infinite Scroll Observer
  const observer = useRef();
  const lastNoteRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        dispatch(fetchNotifications(page + 1));
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, page, dispatch]);

  useEffect(() => {
    // Initial fetch
    dispatch(clearNotifications());
    dispatch(fetchNotifications(1));
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
    if (newFilter !== null) {
      setFilter(newFilter);
      setSelectedIds([]); // Clear selection on filter change
    }
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  // ✅ Filter & Sort notifications
  const filteredNotifications = list.filter((note) => {
    if (filter === "read") return note.is_read;
    if (filter === "unread") return !note.is_read;
    return true;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  // ✅ Selection Handlers
  const handleToggleSelect = (e, id) => {
    e.stopPropagation(); // Don't open modal
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sortedNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedNotifications.map((n) => n.id));
    }
  };

  // ✅ Bulk Action Handlers
  const handleBulkRead = async () => {
    try {
      await dispatch(markNotificationsRead(selectedIds)).unwrap();
      toast.success("Notifications marked as read");
      setSelectedIds([]);
    } catch (err) {
      toast.error("Failed to update notifications");
    }
  };


  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} notifications?`)) {
      try {
        await dispatch(deleteNotifications(selectedIds)).unwrap();
        toast.success("Notifications deleted");
        setSelectedIds([]);
      } catch (err) {
        toast.error("Failed to delete notifications");
      }
    }
  };

  const isAllSelected = sortedNotifications.length > 0 && selectedIds.length === sortedNotifications.length;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f0f7ff, #ffffff)",
        py: 4,
        px: { xs: 2, md: 8 },
        pb: 12, // Space for floating bar
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="800" color="primary.main">
          Notifications
        </Typography>

        {sortedNotifications.length > 0 && (
          <Button
            variant="text"
            startIcon={isAllSelected ? <Deselect /> : <SelectAll />}
            onClick={handleSelectAll}
            sx={{ fontWeight: 'bold' }}
          >
            {isAllSelected ? "Unselect All" : "Select All"}
          </Button>
        )}
      </Box>

      {/* 🔍 Filter & Sort Controls */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', bgcolor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          size="small"
          color="primary"
        >
          <ToggleButton value="all" sx={{ px: 3, fontWeight: 'bold' }}>All</ToggleButton>
          <ToggleButton value="unread" sx={{ px: 3, fontWeight: 'bold' }}>Unread</ToggleButton>
          <ToggleButton value="read" sx={{ px: 3, fontWeight: 'bold' }}>Read</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flexGrow: 1 }} />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortOrder}
            onChange={handleSortChange}
            label="Sort By"
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* 🔔 Notification List */}
      {loading && list.length === 0 ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px solid #ffcdd2', bgcolor: '#fff9f9' }}>
          <Typography color="error" fontWeight="bold">
            Failed to load notifications: {error}
          </Typography>
          <Button onClick={() => dispatch(fetchNotifications())} sx={{ mt: 2 }}>Retry</Button>
        </Paper>
      ) : sortedNotifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <NotificationsIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No notifications found.
          </Typography>
          <Typography variant="body2" color="text.disabled">
            We'll notify you when something important happens.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {sortedNotifications.map((note, index) => {
            const isSelected = selectedIds.includes(note.id);
            const isLast = index === sortedNotifications.length - 1;
            return (
              <Box
                key={note.id}
                ref={isLast ? lastNoteRef : null}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={(e) => handleToggleSelect(e, note.id)}
                  sx={{ color: 'primary.light' }}
                />
                <Paper
                  elevation={isSelected ? 4 : (note.is_read ? 0 : 2)}
                  onClick={() => handleOpenModal(note)}
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    borderRadius: 3,
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#f0f7ff" : (note.is_read ? "#fdfdfd" : "#fff"),
                    border: isSelected ? "2px solid #007bff" : (note.is_read ? "1px solid #eee" : "1px solid transparent"),
                    "&:hover": {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      bgcolor: isSelected ? "#ebf4ff" : (note.is_read ? "#f8f9fa" : "#fff")
                    },
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    borderLeft: note.is_read
                      ? "none"
                      : "6px solid #007bff",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: note.is_read ? "#e3f2fd" : "#007bff", color: note.is_read ? "#1976d2" : "#fff", width: 45, height: 45 }}>
                      <NotificationsIcon />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight={note.is_read ? "600" : "800"}
                        color={note.is_read ? "text.secondary" : "text.primary"}
                        sx={{ lineHeight: 1.2, mb: 0.5 }}
                      >
                        {note.title || note.type.toUpperCase()}
                      </Typography>

                      <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography component="span" variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                          {note.sender_name || "System"}
                        </Typography>
                        • {new Date(note.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  {note.is_read ? (
                    <MarkEmailReadIcon sx={{ color: "#4caf50", opacity: 0.6 }} />
                  ) : (
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#007bff', boxShadow: '0 0 8px #007bff' }} />
                  )}
                </Paper>
              </Box>
            );
          })}

          {/* ✅ Loading More Indicator */}
          {loading && list.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* ✅ No More Notifications */}
          {!hasMore && list.length > 0 && (
            <Typography variant="body2" color="text.disabled" align="center" sx={{ py: 3, opacity: 0.6 }}>
              You've caught up with all notifications.
            </Typography>
          )}
        </Box>
      )}

      {/* 🛠️ Floating Actions Toolbar */}
      <Slide direction="up" in={selectedIds.length > 0} mountOnEnter unmountOnExit>
        <Paper
          elevation={10}
          sx={{
            position: "fixed",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%) !important",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, md: 3 },
            py: 1.5,
            px: { xs: 2, md: 4 },
            borderRadius: 10,
            bgcolor: "#2c3e50",
            color: "white",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, borderRight: '1px solid rgba(255,255,255,0.2)', pr: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
              {selectedIds.length} Selected
            </Typography>
          </Box>

          {selectedIds.some(id => !list.find(n => n.id === id)?.is_read) && (
            <Tooltip title="Mark as Read">
              <IconButton color="inherit" onClick={handleBulkRead} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                <MarkEmailRead />
              </IconButton>
            </Tooltip>
          )}


          <Tooltip title="Delete Selected">
            <IconButton color="error" onClick={handleBulkDelete} sx={{ "&:hover": { bgcolor: "rgba(244,67,54,0.1)" } }}>
              <Delete />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />

          <Button
            variant="text"
            color="inherit"
            onClick={() => setSelectedIds([])}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            Cancel
          </Button>
        </Paper>
      </Slide>

      {/* 🧾 View Notification Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 4,
            overflow: 'hidden'
          },
        }}
      >
        {selectedNote && (
          <>
            <DialogTitle
              sx={{
                bgcolor: selectedNote.is_read ? '#f8f9fa' : '#007bff',
                color: selectedNote.is_read ? 'text.primary' : 'white',
                display: "flex",
                alignItems: "center",
                justifyContent: 'space-between',
                py: 3
              }}
            >
              <Typography variant="h6" fontWeight="800">
                {selectedNote.title || "Notification Details"}
              </Typography>
              <IconButton onClick={handleCloseModal} sx={{ color: selectedNote.is_read ? 'inherit' : 'white' }}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 3, px: 4 }}>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.6, fontSize: '1.1rem', mb: 4 }}>
                {selectedNote.message}
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#fbfbfb', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.disabled" display="block">SENDER</Typography>
                  <Typography variant="subtitle2" fontWeight="bold">{selectedNote.sender_name || "Home Lift System"}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.disabled" display="block">DATE</Typography>
                  <Typography variant="subtitle2" fontWeight="bold">{new Date(selectedNote.created_at).toLocaleString()}</Typography>
                </Box>
              </Paper>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button onClick={handleCloseModal} variant="contained" size="large" sx={{ borderRadius: 3, px: 4, fontWeight: 'bold' }}>
                Got it
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Notifications;
