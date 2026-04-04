import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { addNotification } from '../redux/slices/notificationSlice';
import { receiveMessage, markMessagesAsRead } from '../redux/slices/chatSlice';

const AppSocket = ({ userId }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    
    const socketRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const seenMessagesRef = useRef(new Set());

    useEffect(() => {
        const connect = () => {
            if (!userId) return;

            if (socketRef.current) {
                socketRef.current.close(1000);
            }

            const host = window.location.hostname === 'localhost' ? 'localhost:8000' : '127.0.0.1:8000';
            const token = localStorage.getItem('accessToken');
            const socketPath = `ws://${host}/ws/notifications/${userId}/?token=${token}`;
            
            console.log(`[Socket] Connecting to ${socketPath}`);
            const socket = new WebSocket(socketPath);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log(`[Socket] Global WebSocket Connected for User ${userId}`);
                reconnectAttemptsRef.current = 0;
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('[Socket] Message received:', data);

                    // Handle Notification
                    if (data.type === 'notification' || data.message) {
                        const messageText = data.message || data.text;
                        if (seenMessagesRef.current.has(messageText)) return;
                        seenMessagesRef.current.add(messageText);
                        setTimeout(() => seenMessagesRef.current.delete(messageText), 2000);

                        toast.info(messageText);
                        dispatch(addNotification({
                            id: Date.now(),
                            message: messageText,
                            created_at: new Date().toISOString(),
                            is_read: false,
                            type: data.notification_type || 'system',
                            ...data
                        }));
                    }

                    // Handle Chat Message
                    if (data.type === 'chat_message') {
                        const payload = data.payload;
                        dispatch(receiveMessage(payload));

                        // Show Popup if not on chat page AND not the sender
                        const isChatPage = location.pathname.includes('/chat');
                        const isMe = String(payload.sender_id) === String(userId);
                        
                        if (!isChatPage && !isMe) {
                            const senderName = payload.sender_name || 'New Message';
                            const content = payload.content || '';
                            const truncatedContent = content.length > 10 ? content.substring(0, 10) + '...' : content;
                            
                            const chatPath = location.pathname.startsWith('/provider') ? '/provider/chat' : '/chat';
                            
                            toast.info(`${senderName}: ${truncatedContent}`, {
                                onClick: () => navigate(chatPath, { state: { roomId: payload.room_id || payload.room } }),
                                position: "top-right",
                                autoClose: 5000,
                                pauseOnHover: true,
                                draggable: true,
                            });
                        }
                    }

                    // Handle Read Receipt
                    if (data.type === 'read_receipt') {
                        dispatch(markMessagesAsRead(data.payload));
                    }

                } catch (error) {
                    console.error('[Socket] Error routing event:', error);
                }
            };

            socket.onclose = (e) => {
                if (e.code === 1000) return;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
                reconnectAttemptsRef.current++;
                reconnectTimeoutRef.current = setTimeout(connect, delay);
            };

            socket.onerror = (err) => {
                console.error('[Socket] WebSocket Error:', err);
                socket.close();
            };
        };

        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.onclose = null;
                socketRef.current.close(1000);
            }
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [userId, dispatch, location.pathname, navigate]);

    return null;
};

export default AppSocket;
