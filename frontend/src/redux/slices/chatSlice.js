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
                isPending: true,     // flag for optional "sending…" indicator
            });
        },
        receiveMessage: (state, action) => {
            const { room_id, tempId, ...message } = action.payload;
            if (!state.messages[room_id]) {
                state.messages[room_id] = [];
            }

            // Replace the optimistic placeholder if it exists, otherwise append.
            const msgs = state.messages[room_id];
            const pendingIndex = tempId
                ? msgs.findIndex(m => m.tempId === tempId)
                : -1;

            if (pendingIndex !== -1) {
                msgs[pendingIndex] = { ...message, room_id, isPending: false };
            } else {
                // Prevent duplicate if message with same server id already present
                const alreadyExists = msgs.some(m => m.id === message.id);
                if (!alreadyExists) {
                    msgs.push({ ...message, room_id, isPending: false });
                }
            }

            // Update last message in room list
            const room = state.rooms.find(r => r.id === room_id);
            if (room) {
                room.last_message = {
                    content: message.content,
                    created_at: message.created_at
                };
                if (state.activeRoomId !== room_id) {
                    room.unread_count = (room.unread_count || 0) + 1;
                }
            }
        },
        clearActiveRoom: (state) => {
            state.activeRoomId = null;
        },
        markMessagesAsRead: (state, action) => {
            const { room_id } = action.payload;
            if (state.messages[room_id]) {
                state.messages[room_id] = state.messages[room_id].map(msg => ({
                    ...msg,
                    is_read: true
                }));
            }
            const room = state.rooms.find(r => r.id === room_id);
            if (room) {
                room.unread_count = 0;
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
                // Replace optimistic placeholder with the confirmed server message.
                const { tempId, room_id, room, ...message } = action.payload;
                const roomId = room_id || room;
                if (!roomId) return;
                const msgs = state.messages[roomId];
                if (!msgs) return;
                const idx = tempId ? msgs.findIndex(m => m.tempId === tempId) : -1;
                if (idx !== -1) {
                    msgs[idx] = { ...message, room_id: roomId, isPending: false };
                } else {
                    // No placeholder found — only add if not already present
                    const alreadyExists = msgs.some(m => m.id === message.id);
                    if (!alreadyExists) {
                        msgs.push({ ...message, room_id: roomId, isPending: false });
                    }
                }
            })
            .addCase(sendMessage.rejected, (state, action) => {
                // Mark the optimistic message as failed so the UI can react
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
