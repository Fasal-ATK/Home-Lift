// src/pages/Chat/ChatPage.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Badge,
  ListItemButton,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import { Done, DoneAll } from "@mui/icons-material";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: isPending ? 0.65 : 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginBottom: 8,
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: "85%", md: "68%" },
          px: 2,
          py: 1.2,
          borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
          bgcolor: isFailed
            ? "#fef2f2"
            : isMe
            ? "linear-gradient(135deg, #1e3a5f 0%, #1976d2 100%)"
            : "rgba(255,255,255,0.9)",
          background: isFailed
            ? "#fef2f2"
            : isMe
            ? "linear-gradient(135deg, #1e3a5f 0%, #1976d2 100%)"
            : "rgba(255,255,255,0.92)",
          color: isFailed ? "#dc2626" : isMe ? "#ffffff" : "#101828",
          boxShadow: isMe
            ? "0 4px 12px rgba(25, 118, 210, 0.25)"
            : "0 2px 8px rgba(0,0,0,0.06)",
          border: isFailed
            ? "1px solid #fca5a5"
            : isMe
            ? "none"
            : "1px solid rgba(0,0,0,0.06)",
          backdropFilter: !isMe ? "blur(8px)" : "none",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            wordBreak: "break-word",
            fontSize: "0.935rem",
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
const RoomItem = ({ room, isActive, onClick, currentUserId, isOnline }) => {
  const otherName = room.other_user_name || "Unknown";
  const lastMsg = room.last_message?.content || "No messages yet";
  const unread = room.unread_count || 0;
  const initial = otherName.charAt(0).toUpperCase();
  const avatar = room.other_user_avatar || null;

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={onClick}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 3,
            mx: 1,
            mb: 0.5,
            bgcolor: isActive ? "rgba(25, 118, 210, 0.1)" : "transparent",
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: isActive
                ? "rgba(25, 118, 210, 0.15)"
                : "rgba(0,0,0,0.04)",
            },
          }}
        >
          <Badge
            badgeContent={unread}
            color="primary"
            overlap="circular"
            sx={{ mr: 2 }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={avatar}
                sx={{
                  width: 46,
                  height: 46,
                  bgcolor: avatar ? "transparent" : (isActive ? "#1976d2" : "#e2e8f0"),
                  color: isActive ? "#fff" : "#475569",
                  fontWeight: 700,
                  fontSize: "1rem",
                  boxShadow: isActive ? "0 4px 12px rgba(25,118,210,0.3)" : "none",
                  transition: "all 0.25s",
                }}
              >
                {!avatar && initial}
              </Avatar>
              {isOnline && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 1,
                    right: 1,
                    width: 11,
                    height: 11,
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
              <Typography
                fontWeight={unread > 0 ? 700 : 500}
                sx={{ color: "#101828", fontSize: "0.95rem" }}
                noWrap
              >
                {otherName}
              </Typography>
            }
            secondary={
              <Typography
                variant="body2"
                noWrap
                sx={{
                  color: unread > 0 ? "#1976d2" : "#94a3b8",
                  fontWeight: unread > 0 ? 600 : 400,
                  fontSize: "0.82rem",
                }}
              >
                {lastMsg}
              </Typography>
            }
          />
        </ListItemButton>
      </ListItem>
    </>
  );
};

// ─── Main ChatPage ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { rooms, messages, activeRoomId, loading, onlineUsers = [] } = useSelector(
    (state) => state.chat
  );

  const [messageInput, setMessageInput] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [isTyping, setIsTyping] = useState(false); // remote typing indicator (future WS event)
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const navRoomId = location.state?.roomId;

  useEffect(() => {
    dispatch(fetchChatRooms());
    if (navRoomId) {
      dispatch(setActiveRoom(navRoomId));
      dispatch(fetchMessages(navRoomId));
    }
  }, [dispatch, navRoomId]);

  // Auto-scroll to latest message
  const activeMessages = messages[activeRoomId];
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
      setTimeout(() => inputRef.current?.focus(), 100);
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
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId);
  const otherName = activeRoom?.other_user_name || "…";

  const filteredRooms = rooms.filter((r) =>
    (r.other_user_name || "")
      .toLowerCase()
      .includes(roomSearch.toLowerCase())
  );

  // ── sidebar ──
  const sidebar = (
    <Box
      sx={{
        width: { xs: "100%", md: 320 },
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px)",
        borderRight: "1px solid rgba(0,0,0,0.06)",
        borderRadius: { xs: 0, md: "20px 0 0 20px" },
        overflow: "hidden",
      }}
    >
      {/* Sidebar header */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>
        <Typography variant="h6" fontWeight={800} sx={{ color: "#101828", mb: 2 }}>
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
              bgcolor: "rgba(241,245,249,0.8)",
              "& fieldset": { border: "none" },
            },
          }}
        />
      </Box>

      {/* Rooms list */}
      <List sx={{ flexGrow: 1, overflowY: "auto", py: 0, px: 0.5 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
            <CircularProgress size={32} thickness={4} />
          </Box>
        ) : filteredRooms.length === 0 ? (
          <Box
            sx={{
              pt: 8,
              textAlign: "center",
              color: "text.secondary",
              px: 3,
            }}
          >
            <ForumOutlinedIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
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
              transition={{ duration: 0.2 }}
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

  // ── chat area ──
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
      }}
    >
      {activeRoomId ? (
        <>
          {/* Chat header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              bgcolor: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Mobile back button */}
            <IconButton
              onClick={handleBack}
              sx={{ display: { xs: "flex", md: "none" }, mr: -1 }}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>

            <Avatar
              src={activeRoom?.other_user_avatar || undefined}
              sx={{
                bgcolor: activeRoom?.other_user_avatar ? "transparent" : "#1976d2",
                fontWeight: 700,
                width: 42,
                height: 42,
                boxShadow: "0 4px 12px rgba(25,118,210,0.25)",
              }}
            >
              {!activeRoom?.other_user_avatar && otherName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={700} sx={{ color: "#101828", lineHeight: 1.3 }}>
                {otherName}
              </Typography>
              {isTyping ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <TypingDots />
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    typing…
                  </Typography>
                </Box>
              ) : onlineUsers.includes(String(activeRoom?.other_user_id)) ? (
                <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 600 }}>
                  ● Online
                </Typography>
              ) : null}
            </Box>
          </Box>

          {/* Messages */}
          <Box
            ref={containerRef}
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              px: { xs: 2, md: 4 },
              py: 3,
              background:
                "radial-gradient(ellipse at top left, rgba(25,118,210,0.04) 0%, transparent 60%), #f8fafc",
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                background: "#cbd5e1",
                borderRadius: 4,
              },
            }}
          >
            {activeMessages ? (
              <AnimatePresence initial={false}>
                {activeMessages.map((msg, index) => {
                  const senderId =
                    msg?.sender?.id || msg?.sender || msg?.sender_id;
                  const isMe = String(senderId) === String(user?.id);
                  const msgId = msg.tempId || msg.id || `msg-${index}`;

                  // Date separator
                  const showDateSep =
                    index === 0 ||
                    new Date(activeMessages[index - 1]?.created_at).toDateString() !==
                      new Date(msg.created_at).toDateString();

                  return (
                    <React.Fragment key={msgId}>
                      {showDateSep && msg.created_at && (
                        <Box
                          sx={{
                            textAlign: "center",
                            my: 2,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              bgcolor: "rgba(0,0,0,0.06)",
                              px: 2,
                              py: 0.5,
                              borderRadius: 5,
                              color: "#64748b",
                              fontSize: "0.72rem",
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
                      <MessageBubble
                        msg={msg}
                        isMe={isMe}
                        formatTime={formatTime}
                      />
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            ) : (
              <Box
                sx={{ display: "flex", justifyContent: "center", mt: 8 }}
              >
                <CircularProgress size={30} thickness={4} />
              </Box>
            )}
          </Box>

          {/* Input bar */}
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: 2,
              bgcolor: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(12px)",
              borderTop: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "flex-end",
              gap: 1.5,
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              variant="outlined"
              placeholder="Write a message…"
              size="small"
              multiline
              maxRows={5}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 4,
                  bgcolor: "rgba(241,245,249,0.9)",
                  fontSize: "0.95rem",
                  "& fieldset": { border: "1px solid rgba(0,0,0,0.08)" },
                  "&:hover fieldset": {
                    border: "1px solid rgba(25,118,210,0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    border: "2px solid #1976d2",
                  },
                },
              }}
            />
            <Tooltip title="Send (Enter)">
              <span>
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  sx={{
                    width: 46,
                    height: 46,
                    bgcolor: messageInput.trim() ? "#1976d2" : "#e2e8f0",
                    color: messageInput.trim() ? "#fff" : "#94a3b8",
                    borderRadius: 3,
                    flexShrink: 0,
                    transition: "all 0.2s",
                    boxShadow: messageInput.trim()
                      ? "0 4px 14px rgba(25,118,210,0.35)"
                      : "none",
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
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <ForumOutlinedIcon
              sx={{ fontSize: 72, color: "#cbd5e1" }}
            />
          </motion.div>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: "#101828" }}
          >
            Home Lift Workspace
          </Typography>
          <Typography variant="body1" sx={{ color: "#94a3b8" }}>
            Select a conversation to start messaging
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        height: "calc(100vh - 80px)",
        p: { xs: 0, md: 3 },
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f0f9ff 100%)",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          display: "flex",
          height: "100%",
          borderRadius: { xs: 0, md: "20px" },
          overflow: "hidden",
          boxShadow: { xs: "none", md: "0 20px 60px rgba(0,0,0,0.08)" },
          border: { xs: "none", md: "1px solid rgba(255,255,255,0.8)" },
        }}
      >
        {/* On mobile: show either sidebar OR chat, not both */}
        <Box
          sx={{
            display: { xs: activeRoomId ? "none" : "flex", md: "flex" },
            width: { xs: "100%", md: 320 },
            flexShrink: 0,
            height: "100%",
          }}
        >
          {sidebar}
        </Box>

        <Box
          sx={{
            display: { xs: activeRoomId ? "flex" : "none", md: "flex" },
            flex: 1,
            height: "100%",
          }}
        >
          {chatArea}
        </Box>
      </Box>
    </Box>
  );
}
