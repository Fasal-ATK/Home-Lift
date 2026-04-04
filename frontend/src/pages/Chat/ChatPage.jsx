import React, { useEffect, useState, useRef } from "react";
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
  ListItemAvatar,
  ListItemText,
  Paper,
  Divider,
  CircularProgress,
  Badge,
  ListItemButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import {
  fetchChatRooms,
  fetchMessages,
  sendMessage,
  setActiveRoom,
} from "../../redux/slices/chatSlice";
import { Done, DoneAll } from "@mui/icons-material";

export default function ChatPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { rooms, messages, activeRoomId, loading } = useSelector((state) => state.chat);

  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);

  // Focus effect for initial navigation from other pages
  useEffect(() => {
    dispatch(fetchChatRooms());
    if (location.state?.roomId) {
      dispatch(setActiveRoom(location.state.roomId));
      dispatch(fetchMessages(location.state.roomId));
    }
  }, [dispatch, location.state]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeRoomId]);

  const handleRoomClick = (roomId) => {
    dispatch(setActiveRoom(roomId));
    dispatch(fetchMessages(roomId));
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeRoomId) return;
    dispatch(sendMessage({ roomId: activeRoomId, content: messageInput }));
    setMessageInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 100px)", bgcolor: "#f4f6f8", p: { xs: 1, md: 3 }, gap: 2 }}>
      {/* Left Sidebar - Chat Rooms List */}
      <Paper elevation={3} sx={{ width: { xs: '100%', md: 350 }, display: activeRoomId ? { xs: "none", md: "flex" } : "flex", flexDirection: "column", borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ p: 2, bgcolor: "#fff", borderBottom: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight="bold">Chats</Typography>
        </Box>
        <List sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
          ) : rooms.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>No conversations yet.</Box>
          ) : (
            rooms.map((room) => {
              // Determine other user details
              const otherName = room.other_user_name || "Unknown";
              const isActive = room.id === activeRoomId;

              return (
                <React.Fragment key={room.id}>
                  <ListItem
                    disablePadding
                    sx={{
                      bgcolor: isActive ? "#e3f2fd" : "inherit",
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleRoomClick(room.id)}
                      sx={{
                        "&:hover": { bgcolor: isActive ? "#e3f2fd" : "#f5f8fa" },
                        py: 1,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: isActive ? "primary.main" : "grey.400" }}>
                          {otherName.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography fontWeight={isActive ? "bold" : "regular"} noWrap>
                            {otherName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {room.last_message ? room.last_message.content : "No messages yet"}
                          </Typography>
                        }
                      />
                      {room.unread_count > 0 && (
                        <Badge badgeContent={room.unread_count} color="primary" sx={{ ml: 2 }} />
                      )}
                    </ListItemButton>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              );
            })
          )}
        </List>
      </Paper>

      {/* Right Area - Active Chat Messages */}
      <Paper elevation={3} sx={{ flexGrow: 1, display: activeRoomId ? "flex" : { xs: "none", md: "flex" }, flexDirection: "column", borderRadius: 3, bgcolor: "#fff", overflow: "hidden" }}>
        {activeRoomId ? (
          <>
            {/* Chat Header */}
            <Box sx={{ p: 2, bgcolor: "#fff", display: "flex", alignItems: "center", borderBottom: "1px solid #e0e0e0" }}>
              <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                {(rooms.find(r => r.id === activeRoomId)?.other_user_name || '?').charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle1" fontWeight="bold">
                {rooms.find(r => r.id === activeRoomId)?.other_user_name || 'Loading...'}
              </Typography>
            </Box>

            {/* Messages Box */}
            <Box sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 2, md: 3 }, bgcolor: "#f8f9fa" }}>
              {messages[activeRoomId] ? (
                messages[activeRoomId].map((msg, index) => {
                  const senderId = msg?.sender?.id || msg?.sender || msg?.sender_id;
                  const isMe = String(senderId) === String(user?.id);
                  const msgId = msg.id || `msg-${index}`;
                  
                  return (
                    <Box
                      key={msgId}
                      sx={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: "75%",
                          p: 1.5,
                          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          bgcolor: isMe ? "primary.main" : "#ffffff",
                          color: isMe ? "#ffffff" : "text.primary",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          border: isMe ? "none" : "1px solid #e0e0e0",
                        }}
                      >
                        <Typography variant="body2" sx={{ wordBreak: "break-word", fontSize: "0.95rem" }}>
                          {msg.content}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mt: 0.5, gap: 0.4 }}>
                          <Typography variant="caption" sx={{ fontSize: "0.7rem", color: isMe ? "rgba(255,255,255,0.7)" : "text.secondary" }}>
                            {formatTime(msg.created_at)}
                          </Typography>
                          {isMe && (
                            msg.is_read ? (
                              <DoneAll sx={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }} />
                            ) : (
                              <Done sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }} />
                            )
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}><CircularProgress size={30} /></Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input Area */}
            <Box sx={{ p: 2, bgcolor: "#fff", display: "flex", alignItems: "center", borderTop: "1px solid #e0e0e0" }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message"
                size="small"
                multiline
                maxRows={4}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={{
                  bgcolor: "#fff",
                  borderRadius: 4,
                  "& fieldset": { border: "none" },
                  mr: 2,
                }}
              />
              <IconButton 
                color="primary" 
                onClick={handleSendMessage} 
                disabled={!messageInput.trim()}
                sx={{ 
                  bgcolor: messageInput.trim() ? "primary.main" : "grey.200", 
                  color: messageInput.trim() ? "#fff" : "grey.500", 
                  "&:hover": { bgcolor: messageInput.trim() ? "primary.dark" : "grey.200" },
                  ml: 2,
                  p: 1.2
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", color: "text.secondary", bgcolor: "#f8f9fa" }}>
            <Typography variant="h5" sx={{ mt: 2, fontWeight: "bold", color: "primary.main" }}>Home Lift Workspace</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>Select a conversation to start messaging</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
