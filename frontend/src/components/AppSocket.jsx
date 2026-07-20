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

            const token = localStorage.getItem("accessToken");

            const wsBase =
                import.meta.env.VITE_WS_URL ||
                (window.location.protocol === "https:"
                    ? "wss://api.home-lift.online"
                    : "ws://localhost:8000");

            const socketPath = `${wsBase}/ws/notifications/${userId}/?token=${token}`;

            const socket = new WebSocket(socketPath);
            socketRef.current = socket;

            socket.onopen = () => {
                reconnectAttemptsRef.current = 0;
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === "notification" || data.message) {
                        const messageText = data.message || data.text;

                        if (seenMessagesRef.current.has(messageText)) return;

                        seenMessagesRef.current.add(messageText);
                        setTimeout(() => seenMessagesRef.current.delete(messageText), 2000);

                        toast.info(messageText);

                        dispatch(
                            addNotification({
                                id: Date.now(),
                                message: messageText,
                                created_at: new Date().toISOString(),
                                is_read: false,
                                type: data.notification_type || "system",
                                ...data,
                            })
                        );
                    }

                    if (data.type === "chat_message") {
                        const payload = data.payload;

                        dispatch(receiveMessage(payload));

                        const isChatPage = location.pathname.includes("/chat");
                        const isMe = String(payload.sender_id) === String(userId);

                        if (!isChatPage && !isMe) {
                            const senderName = payload.sender_name || "New Message";
                            const content = payload.content || "";

                            toast.info(
                                `${senderName}: ${
                                    content.length > 10
                                        ? content.substring(0, 10) + "..."
                                        : content
                                }`,
                                {
                                    onClick: () =>
                                        navigate(
                                            location.pathname.startsWith("/provider")
                                                ? "/provider/chat"
                                                : "/chat",
                                            {
                                                state: {
                                                    roomId:
                                                        payload.room_id || payload.room,
                                                },
                                            }
                                        ),
                                }
                            );
                        }
                    }

                    if (data.type === "read_receipt") {
                        dispatch(markMessagesAsRead(data.payload));
                    }
                } catch {
                    // Ignore malformed socket messages
                }
            };

            socket.onclose = (e) => {
                if (e.code === 1000) return;

                const delay = Math.min(
                    1000 * Math.pow(2, reconnectAttemptsRef.current),
                    10000
                );

                reconnectAttemptsRef.current++;

                reconnectTimeoutRef.current = setTimeout(connect, delay);
            };

            socket.onerror = () => {
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
