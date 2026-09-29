// src/pages/Chat/ChatPage.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Badge,
  ListItemButton,
  InputAdornment,
  Tooltip,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import { Done, DoneAll, AdminPanelSettings } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchChatRooms,
  fetchMessages,
  sendMessage,
  setActiveRoom,
  optimisticAddMessage,
  clearActiveRoom,
} from "../../redux/slices/chatSlice";

// ─── Typing dots animation ──────────────────────────────────────────────────
const TypingDots = () => (
  <Box sx={{ display: "flex", gap: "4px", alignItems: "center", px: 0.5 }}>
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: "#94a3b8",
          display: "inline-block",
        }}
      />
    ))}
  </Box>
);

// ─── Message bubble ──────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isMe, formatTime }) => {
  const isPending = msg.isPending;
  const isFailed = msg.isFailed;
  const isAdminSender = Boolean(msg.is_sender_admin);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: isPending ? 0.65 : 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginBottom: 8,
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: "88%", sm: "75%", md: "66%" },
          px: { xs: 1.5, md: 2 },
          py: { xs: 1, md: 1.2 },
          borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
          background: isFailed
            ? "#fef2f2"
            : isMe
            ? "linear-gradient(135deg, #1e3a5f 0%, #1976d2 100%)"
            : isAdminSender
            ? "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)"
            : "rgba(255,255,255,0.92)",
          color: isFailed ? "#dc2626" : isMe ? "#ffffff" : "#101828",
          boxShadow: isMe
            ? "0 4px 12px rgba(25, 118, 210, 0.25)"
            : isAdminSender
            ? "0 4px 14px rgba(79, 70, 229, 0.12)"
            : "0 2px 8px rgba(0,0,0,0.06)",
          border: isFailed
            ? "1px solid #fca5a5"
            : isMe
            ? "none"
            : isAdminSender
            ? "1.5px solid rgba(99, 102, 241, 0.3)"
            : "1px solid rgba(0,0,0,0.06)",
          backdropFilter: !isMe ? "blur(8px)" : "none",
        }}
      >
        {isAdminSender && !isMe && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <AdminPanelSettings sx={{ fontSize: 13, color: "#4f46e5" }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                fontSize: "0.65rem",
                color: "#4f46e5",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Admin Support
            </Typography>
          </Box>
        )}
        <Typography
          variant="body2"
          sx={{
            wordBreak: "break-word",
            fontSize: { xs: "0.9rem", md: "0.935rem" },
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
          }}
        >
          {msg.content}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            mt: 0.5,
            gap: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.68rem",
              color: isFailed
                ? "#ef4444"
                : isMe
                ? "rgba(255,255,255,0.65)"
                : "#94a3b8",
            }}
          >
            {isFailed ? "Failed to send" : isPending ? "Sending…" : formatTime(msg.created_at)}
          </Typography>
          {isMe && !isPending && !isFailed && (
            msg.is_read ? (
              <DoneAll sx={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }} />
            ) : (
              <Done sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }} />
            )
          )}
        </Box>
      </Box>
    </motion.div>
  );
};

// ─── Room list item ──────────────────────────────────────────────────────────
const RoomItem = ({ room, isActive, onClick, isOnline }) => {
  const otherName = room.other_user_name || "Unknown";
  const lastMsg = room.last_message?.content || "No messages yet";
  const unread = room.unread_count || 0;
  const initial = otherName.charAt(0).toUpperCase();
  const avatar = room.other_user_avatar || null;
  const isOtherAdmin = Boolean(room.is_other_user_admin);

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={onClick}
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 1.5,
          borderRadius: 3,
          mx: 0.5,
          mb: 0.5,
          bgcolor: isActive ? "rgba(25, 118, 210, 0.1)" : "transparent",
          transition: "all 0.2s",
          "&:hover": {
            bgcolor: isActive ? "rgba(25, 118, 210, 0.15)" : "rgba(0,0,0,0.04)",
          },
        }}
      >
        <Badge badgeContent={unread} color="primary" overlap="circular" sx={{ mr: 1.5 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={avatar}
              sx={{
                width: { xs: 42, md: 46 },
                height: { xs: 42, md: 46 },
                bgcolor: avatar
                  ? "transparent"
                  : isOtherAdmin
                  ? "#4f46e5"
                  : isActive
                  ? "#1976d2"
                  : "#e2e8f0",
                color: isOtherAdmin ? "#fff" : isActive ? "#fff" : "#475569",
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: isActive ? "0 4px 12px rgba(25,118,210,0.3)" : "none",
                transition: "all 0.25s",
              }}
            >
              {!avatar && (isOtherAdmin ? <AdminPanelSettings sx={{ fontSize: 20 }} /> : initial)}
            </Avatar>
            {isOnline && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 1,
                  right: 1,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: "#22c55e",
                  border: "2px solid #fff",
                }}
              />
            )}
          </Box>
        </Badge>
        <ListItemText
          primary={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 0.5,
                overflow: "hidden",
              }}
            >
              <Typography
                fontWeight={unread > 0 ? 700 : 500}
                sx={{ color: "#101828", fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {otherName}
              </Typography>
              {isOtherAdmin && (
                <Chip
                  label="ADMIN"
                  size="small"
                  sx={{
                    height: 17,
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    flexShrink: 0,
                    bgcolor: "rgba(79, 70, 229, 0.12)",
                    color: "#4f46e5",
                    border: "1px solid rgba(79, 70, 229, 0.25)",
                  }}
                />
              )}
            </Box>
          }
          secondary={
            <Typography
              variant="body2"
              noWrap
              sx={{
                color: unread > 0 ? "#1976d2" : "#94a3b8",
                fontWeight: unread > 0 ? 600 : 400,
                fontSize: "0.8rem",
              }}
            >
              {lastMsg}
            </Typography>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

// ─── Main ChatPage ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const initialNavHandledRef = useRef(false);

  const { user } = useSelector((state) => state.auth);
  const { rooms, messages, activeRoomId, loading, onlineUsers = [] } = useSelector(
    (state) => state.chat
  );

  const [messageInput, setMessageInput] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [isTyping] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchChatRooms());
  }, [dispatch]);

  // Initial room from navigation state
  useEffect(() => {
    if (initialNavHandledRef.current) return;
    const navRoomId = location.state?.roomId;
    const prefilledRecipient = location.state?.prefilledRecipient;

    if (navRoomId) {
      const parsedId = Number(navRoomId) || navRoomId;
      dispatch(setActiveRoom(parsedId));
      dispatch(fetchMessages(parsedId));
      initialNavHandledRef.current = true;
      navigate(location.pathname, { replace: true, state: {} });
    } else if (prefilledRecipient && rooms && rooms.length > 0) {
      const needle = String(prefilledRecipient).toLowerCase();
      const found = rooms.find(
        (r) =>
          String(r.other_user_name || "").toLowerCase().includes(needle) ||
          String(r.other_user_id) === needle
      );
      if (found) {
        dispatch(setActiveRoom(found.id));
        dispatch(fetchMessages(found.id));
        initialNavHandledRef.current = true;
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, rooms, dispatch, navigate, location.pathname]);

  // Auto-scroll to latest message
  const activeMessages =
    messages[activeRoomId] || messages[String(activeRoomId)] || [];
  const messageCount = activeMessages?.length || 0;

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messageCount, activeRoomId]);

  const handleRoomClick = useCallback(
    (roomId) => {
      dispatch(setActiveRoom(roomId));
      dispatch(fetchMessages(roomId));
      setTimeout(() => inputRef.current?.focus(), 150);
    },
    [dispatch]
  );

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !activeRoomId) return;
    const content = messageInput.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setMessageInput("");
    dispatch(
      optimisticAddMessage({
        roomId: activeRoomId,
        content,
        senderId: user?.id,
        senderName: user?.full_name || user?.username || "Me",
        tempId,
      })
    );
    dispatch(sendMessage({ roomId: activeRoomId, content, tempId }));
  }, [messageInput, activeRoomId, user, dispatch]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => dispatch(clearActiveRoom());

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const activeRoom = rooms.find(
    (r) => r.id === activeRoomId || String(r.id) === String(activeRoomId)
  );
  const otherName = activeRoom?.other_user_name || "…";

  const filteredRooms = rooms
    .filter((r) =>
      (r.other_user_name || "").toLowerCase().includes(roomSearch.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = new Date(a.last_message?.created_at || a.created_at || 0).getTime();
      const timeB = new Date(b.last_message?.created_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });

  // On mobile: show sidebar when no room is active, chat panel when a room is active
  const showSidebar = !isMobile || !activeRoomId;
  const showChat = !isMobile || !!activeRoomId;

  // ── Sidebar panel ──────────────────────────────────────────────────────────
  const sidebar = (
    <Box
      sx={{
        width: { xs: "100%", md: 310, lg: 330 },
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(20px)",
        borderRight: { xs: "none", md: "1px solid rgba(0,0,0,0.06)" },
        borderRadius: { xs: 0, md: "20px 0 0 20px" },
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <Box sx={{ px: { xs: 2, md: 2.5 }, pt: { xs: 2, md: 3 }, pb: 2 }}>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ color: "#101828", mb: 1.5, fontSize: { xs: "1rem", md: "1.15rem" } }}
        >
          Messages
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Search conversations…"
          value={roomSearch}
          onChange={(e) => setRoomSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: "rgba(241,245,249,0.85)",
              "& fieldset": { border: "none" },
              fontSize: "0.9rem",
            },
          }}
        />
      </Box>

      {/* Rooms list */}
      <List sx={{ flexGrow: 1, overflowY: "auto", py: 0, px: 0 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
            <CircularProgress size={30} thickness={4} />
          </Box>
        ) : filteredRooms.length === 0 ? (
          <Box sx={{ pt: 8, textAlign: "center", color: "text.secondary", px: 3 }}>
            <ForumOutlinedIcon sx={{ fontSize: 44, opacity: 0.28, mb: 1 }} />
            <Typography variant="body2">
              {roomSearch ? "No results found." : "No conversations yet."}
            </Typography>
          </Box>
        ) : (
          filteredRooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
            >
              <RoomItem
                room={room}
                isActive={room.id === activeRoomId}
                onClick={() => handleRoomClick(room.id)}
                currentUserId={user?.id}
                isOnline={onlineUsers.includes(String(room.other_user_id))}
              />
            </motion.div>
          ))
        )}
      </List>
    </Box>
  );

  // ── Chat area ──────────────────────────────────────────────────────────────
  const chatArea = (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(16px)",
        borderRadius: { xs: 0, md: "0 20px 20px 0" },
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {activeRoomId ? (
        <>
          {/* Chat header */}
          <Box
            sx={{
              px: { xs: 1.5, md: 3 },
              py: { xs: 1.2, md: 2 },
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, md: 2 },
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              bgcolor: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(12px)",
              flexShrink: 0,
            }}
          >
            {/* Back button on mobile */}
            <Tooltip title="Back to all conversations">
              <IconButton
                onClick={handleBack}
                size="small"
                sx={{
                  flexShrink: 0,
                  display: { xs: "flex", md: "none" },
                  color: "#475569",
                  mr: -0.5,
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Avatar
              src={activeRoom?.other_user_avatar || undefined}
              sx={{
                bgcolor: activeRoom?.other_user_avatar
                  ? "transparent"
                  : activeRoom?.is_other_user_admin
                  ? "#4f46e5"
                  : "#1976d2",
                fontWeight: 700,
                width: { xs: 36, md: 42 },
                height: { xs: 36, md: 42 },
                flexShrink: 0,
                boxShadow: activeRoom?.is_other_user_admin
                  ? "0 4px 12px rgba(79, 70, 229, 0.3)"
                  : "0 4px 12px rgba(25,118,210,0.25)",
              }}
            >
              {!activeRoom?.other_user_avatar &&
                (activeRoom?.is_other_user_admin ? (
                  <AdminPanelSettings sx={{ fontSize: 20 }} />
                ) : (
                  otherName.charAt(0).toUpperCase()
                ))}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "nowrap" }}>
                <Typography
                  fontWeight={700}
                  noWrap
                  sx={{
                    color: "#101828",
                    lineHeight: 1.3,
                    fontSize: { xs: "0.92rem", md: "1rem" },
                  }}
                >
                  {otherName}
                </Typography>
                {activeRoom?.is_other_user_admin && (
                  <Chip
                    icon={<AdminPanelSettings style={{ fontSize: 12, color: "#4f46e5" }} />}
                    label="ADMIN"
                    size="small"
                    sx={{
                      height: 19,
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      flexShrink: 0,
                      bgcolor: "rgba(79, 70, 229, 0.12)",
                      color: "#4f46e5",
                      border: "1px solid rgba(79, 70, 229, 0.3)",
                      "& .MuiChip-icon": { ml: 0.5, mr: -0.5 },
                    }}
                  />
                )}
              </Box>
              {isTyping ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <TypingDots />
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    typing…
                  </Typography>
                </Box>
              ) : onlineUsers.includes(String(activeRoom?.other_user_id)) ? (
                <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 600, fontSize: "0.72rem" }}>
                  ● Online
                </Typography>
              ) : null}
            </Box>
          </Box>

          {/* Messages area */}
          <Box
            ref={containerRef}
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              px: { xs: 1.5, sm: 2.5, md: 4 },
              py: { xs: 2, md: 3 },
              background:
                "radial-gradient(ellipse at top left, rgba(25,118,210,0.04) 0%, transparent 60%), #f8fafc",
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: 4 },
            }}
          >
            {activeMessages ? (
              <AnimatePresence initial={false}>
                {activeMessages.map((msg, index) => {
                  const senderId = msg?.sender?.id || msg?.sender || msg?.sender_id;
                  const isMe = String(senderId) === String(user?.id);
                  const msgId = msg.tempId || msg.id || `msg-${index}`;

                  const showDateSep =
                    index === 0 ||
                    new Date(activeMessages[index - 1]?.created_at).toDateString() !==
                      new Date(msg.created_at).toDateString();

                  return (
                    <React.Fragment key={msgId}>
                      {showDateSep && msg.created_at && (
                        <Box sx={{ textAlign: "center", my: 2 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              bgcolor: "rgba(0,0,0,0.06)",
                              px: 2,
                              py: 0.5,
                              borderRadius: 5,
                              color: "#64748b",
                              fontSize: "0.7rem",
                            }}
                          >
                            {new Date(msg.created_at).toLocaleDateString([], {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </Typography>
                        </Box>
                      )}
                      <MessageBubble msg={msg} isMe={isMe} formatTime={formatTime} />
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
                <CircularProgress size={30} thickness={4} />
              </Box>
            )}
          </Box>

          {/* Input bar */}
          <Box
            sx={{
              px: { xs: 1.5, md: 3 },
              py: { xs: 1.2, md: 2 },
              bgcolor: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(12px)",
              borderTop: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
              pb: { xs: "max(12px, env(safe-area-inset-bottom))", md: 2 },
              flexShrink: 0,
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              variant="outlined"
              placeholder="Write a message…"
              size="small"
              multiline
              maxRows={4}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 4,
                  bgcolor: "rgba(241,245,249,0.9)",
                  fontSize: { xs: "0.9rem", md: "0.95rem" },
                  "& fieldset": { border: "1px solid rgba(0,0,0,0.08)" },
                  "&:hover fieldset": { border: "1px solid rgba(25,118,210,0.3)" },
                  "&.Mui-focused fieldset": { border: "2px solid #1976d2" },
                },
              }}
            />
            <Tooltip title="Send (Enter)">
              <span>
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  sx={{
                    width: { xs: 40, md: 46 },
                    height: { xs: 40, md: 46 },
                    bgcolor: messageInput.trim() ? "#1976d2" : "#e2e8f0",
                    color: messageInput.trim() ? "#fff" : "#94a3b8",
                    borderRadius: 3,
                    flexShrink: 0,
                    transition: "all 0.2s",
                    boxShadow: messageInput.trim() ? "0 4px 14px rgba(25,118,210,0.35)" : "none",
                    "&:hover": {
                      bgcolor: messageInput.trim() ? "#1565c0" : "#e2e8f0",
                      transform: messageInput.trim() ? "scale(1.08)" : "none",
                    },
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </>
      ) : (
        // Empty state
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            flexDirection: "column",
            gap: 2,
            px: 3,
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <ForumOutlinedIcon sx={{ fontSize: { xs: 56, md: 72 }, color: "#cbd5e1" }} />
          </motion.div>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: "#101828", fontSize: { xs: "1.2rem", md: "1.5rem" } }}
          >
            Home Lift Workspace
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center" }}>
            Select a conversation to start messaging
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        height: { xs: "calc(100dvh - 64px)", md: "calc(100vh - 80px)" },
        p: { xs: 0, md: 3 },
        background: "linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f0f9ff 100%)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          borderRadius: { xs: 0, md: "20px" },
          overflow: "hidden",
          boxShadow: { xs: "none", md: "0 20px 60px rgba(0,0,0,0.08)" },
          border: { xs: "none", md: "1px solid rgba(255,255,255,0.8)" },
        }}
      >
        {/* Sidebar — hidden on mobile when chat is open */}
        {showSidebar && (
          <Box
            sx={{
              display: "flex",
              width: isMobile ? "100%" : undefined,
              height: "100%",
              flexShrink: 0,
            }}
          >
            {sidebar}
          </Box>
        )}

        {/* Chat area — hidden on mobile when no room is selected */}
        {showChat && (
          <Box style={{ display: "flex", flex: 1, minWidth: 0, height: "100%" }}>
            {chatArea}
          </Box>
        )}
      </Box>
    </Box>
  );
}
