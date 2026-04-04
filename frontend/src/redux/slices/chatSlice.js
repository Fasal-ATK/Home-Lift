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
    async ({ roomId, content }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/chat/rooms/${roomId}/messages/`, { content });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to send message');
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
        receiveMessage: (state, action) => {
            const { room_id, ...message } = action.payload;
            if (!state.messages[room_id]) {
                state.messages[room_id] = [];
            }
            state.messages[room_id].push(message);
            
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
            });
    }
});

export const { setActiveRoom, receiveMessage, clearActiveRoom, markMessagesAsRead } = chatSlice.actions;
export default chatSlice.reducer;
