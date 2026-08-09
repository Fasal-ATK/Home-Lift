import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../API/apiConfig';

export const fetchChatRooms = createAsyncThunk(
    'chat/fetchRooms',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/chat/rooms/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch chat rooms');
        }
    }
);

export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async (roomId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/chat/rooms/${roomId}/messages/`);
            return { roomId, data: response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch messages');
        }
    }
);

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async ({ roomId, content, tempId }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/chat/rooms/${roomId}/messages/`, { content });
            // Return tempId alongside server data so the fulfilled handler can
            // replace the optimistic placeholder instead of appending a duplicate.
            return { ...response.data, tempId };
        } catch (error) {
            return rejectWithValue({ ...(error.response?.data || {}), tempId, error: 'Failed to send message' });
        }
    }
);

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        rooms: [],
        messages: {}, // { [roomId]: [messages] }
        activeRoomId: null,
        loading: false,
        error: null,
    },
    reducers: {
        setActiveRoom: (state, action) => {
            state.activeRoomId = action.payload;
        },
        // Instantly add a message to the UI before server confirms (optimistic update).
        // Pass { roomId, content, senderId, senderName, tempId } in the payload.
        optimisticAddMessage: (state, action) => {
            const { roomId, content, senderId, senderName, tempId } = action.payload;
            if (!state.messages[roomId]) {
                state.messages[roomId] = [];
            }
            state.messages[roomId].push({
                id: tempId,          // replaced once server echoes back
                tempId,
                room_id: roomId,
                sender_id: senderId,
                sender_name: senderName,
                content,
                created_at: new Date().toISOString(),
                is_read: false,
                isPending: true,     // flag for "sending…" indicator
            });

            // Update last_message in room list immediately for snappy feel
            const room = state.rooms.find(r => r.id === roomId);
            if (room) {
                room.last_message = {
                    content,
                    created_at: new Date().toISOString(),
                };
            }
        },
        receiveMessage: (state, action) => {
            const payload = action.payload || {};
            const roomId = payload.room_id || payload.room;
            if (!roomId) return;

            const { tempId, ...message } = payload;
            if (!state.messages[roomId]) {
                state.messages[roomId] = [];
            }

            const msgs = state.messages[roomId];
            const senderId = message.sender_id || message.sender?.id || message.sender;

            // 1. Check if this exact server message ID is already in state
            const existingIdx = message.id ? msgs.findIndex(m => m.id === message.id) : -1;

            if (existingIdx !== -1) {
                // Update existing message in place
                msgs[existingIdx] = { ...msgs[existingIdx], ...message, room_id: roomId, isPending: false };
            } else {
                // 2. Check if there's a pending optimistic message matching tempId OR matching (isPending && sender && content)
                const pendingIdx = msgs.findIndex(m => {
                    if (!m.isPending) return false;
                    if (tempId && m.tempId === tempId) return true;
                    const mSenderId = m.sender_id || m.sender?.id || m.sender;
                    return String(mSenderId) === String(senderId) && m.content === message.content;
                });

                if (pendingIdx !== -1) {
                    // Replace pending message with confirmed message
                    msgs[pendingIdx] = { ...message, room_id: roomId, isPending: false };
                } else {
                    // New incoming message from another user or another tab
                    msgs.push({ ...message, room_id: roomId, isPending: false });
                }
            }

            // Update last message & unread count in rooms list
            const room = state.rooms.find(r => r.id === roomId);
            if (room) {
                room.last_message = {
                    content: message.content,
                    created_at: message.created_at || new Date().toISOString()
                };
                if (state.activeRoomId !== roomId) {
                    room.unread_count = (room.unread_count || 0) + 1;
                }
            }
        },
        clearActiveRoom: (state) => {
            state.activeRoomId = null;
        },
        markMessagesAsRead: (state, action) => {
            const { room_id, room } = action.payload || {};
            const roomId = room_id || room;
            if (!roomId) return;
            if (state.messages[roomId]) {
                state.messages[roomId] = state.messages[roomId].map(msg => ({
                    ...msg,
                    is_read: true
                }));
            }
            const roomObj = state.rooms.find(r => r.id === roomId);
            if (roomObj) {
                roomObj.unread_count = 0;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchChatRooms.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchChatRooms.fulfilled, (state, action) => {
                state.loading = false;
                state.rooms = action.payload;
            })
            .addCase(fetchChatRooms.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                const { roomId, data } = action.payload;
                state.messages[roomId] = data;
                // Since fetching messages marks them as read on backend, we update local too
                const room = state.rooms.find(r => r.id === roomId);
                if (room) room.unread_count = 0;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                const { tempId, room_id, room, ...message } = action.payload || {};
                const roomId = room_id || room;
                if (!roomId) return;
                const msgs = state.messages[roomId];
                if (!msgs) return;

                const existingIdx = message.id ? msgs.findIndex(m => m.id === message.id) : -1;
                const tempIdx = tempId ? msgs.findIndex(m => m.tempId === tempId) : -1;

                if (existingIdx !== -1 && tempIdx !== -1 && existingIdx !== tempIdx) {
                    // WS message arrived first and inserted at existingIdx. Remove the temporary placeholder.
                    msgs.splice(tempIdx, 1);
                    const freshExistingIdx = msgs.findIndex(m => m.id === message.id);
                    if (freshExistingIdx !== -1) {
                        msgs[freshExistingIdx] = { ...message, room_id: roomId, isPending: false };
                    }
                } else if (tempIdx !== -1) {
                    msgs[tempIdx] = { ...message, room_id: roomId, isPending: false };
                } else if (existingIdx !== -1) {
                    msgs[existingIdx] = { ...message, room_id: roomId, isPending: false };
                } else {
                    msgs.push({ ...message, room_id: roomId, isPending: false });
                }

                // Update last message in room list
                const roomObj = state.rooms.find(r => r.id === roomId);
                if (roomObj) {
                    roomObj.last_message = {
                        content: message.content,
                        created_at: message.created_at || new Date().toISOString()
                    };
                }
            })
            .addCase(sendMessage.rejected, (state, action) => {
                const { tempId } = action.payload || {};
                if (!tempId) return;
                for (const msgs of Object.values(state.messages)) {
                    const idx = msgs.findIndex(m => m.tempId === tempId);
                    if (idx !== -1) {
                        msgs[idx] = { ...msgs[idx], isPending: false, isFailed: true };
                        break;
                    }
                }
            });
    }
});

export const { setActiveRoom, optimisticAddMessage, receiveMessage, clearActiveRoom, markMessagesAsRead } = chatSlice.actions;
export default chatSlice.reducer;
