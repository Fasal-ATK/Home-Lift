import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import apiEndpoints from '../API/apiEndpoints';
import { performLogout, redirectAfterLogout } from '../utils/logoutHelper';
import { addNotification } from '../redux/slices/notificationSlice';
import { receiveMessage, markMessagesAsRead } from '../redux/slices/chatSlice';

// Shared promise to avoid duplicate token refresh requests
let tokenRefreshPromise = null;

// Local utility to check if token is expired or close to expiring (within 10s buffer)
const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        // base64url decode the payload
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        const payload = JSON.parse(jsonPayload);
        if (!payload.exp) return true;
        
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now + 10; // 10 second buffer
    } catch {
        return true;
    }
};

// Fetches or refreshes access token, handling concurrency & logouts
const getOrRefreshAccessToken = async () => {
    const token = localStorage.getItem('accessToken');
    if (token && !isTokenExpired(token)) {
        return token;
    }

    if (tokenRefreshPromise) {
        return tokenRefreshPromise;
    }

    tokenRefreshPromise = (async () => {
        try {
            const refreshResponse = await axios.post(
                `${import.meta.env.VITE_API_URL}${apiEndpoints.auth.refreshAccessToken}`,
                {},
                { withCredentials: true }
            );

            const newToken = refreshResponse.data.access;
            localStorage.setItem('accessToken', newToken);
            return newToken;
        } catch (error) {
            // Handle refresh token failure (logout)
            const userData = localStorage.getItem('user');
            const isAdmin = userData ? JSON.parse(userData).is_staff : false;
            await performLogout(false);
            redirectAfterLogout(isAdmin);
            throw error;
        } finally {
            tokenRefreshPromise = null;
        }
    })();

    return tokenRefreshPromise;
};

const AppSocket = ({ userId }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { activeRoomId } = useSelector((state) => state.chat);
    
    const socketRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const seenMessagesRef = useRef(new Set());
    const activeConnectIdRef = useRef(0);
    const activeRoomIdRef = useRef(activeRoomId);

    useEffect(() => {
        activeRoomIdRef.current = activeRoomId;
    }, [activeRoomId]);

    useEffect(() => {
        let isComponentMounted = true;
        const connect = async () => {
            if (!userId || !isComponentMounted) return;

            // Close existing socket before opening a new one
            if (socketRef.current) {
                socketRef.current.onclose = null;
                socketRef.current.close(1000);
                socketRef.current = null;
            }

            const connectId = ++activeConnectIdRef.current;

            try {
                // Get valid access token (refreshed if expired)
                const token = await getOrRefreshAccessToken();

                // If component unmounted or a newer connection attempt started, stop.
                if (!isComponentMounted || connectId !== activeConnectIdRef.current) {
                    return;
                }

                const wsBase =
                    import.meta.env.VITE_WS_URL ||
                    (window.location.protocol === "https:"
                        ? "wss://api.home-lift.online"
                        : "ws://localhost:8000");

                const socketPath = `${wsBase}/ws/notifications/${userId}/?token=${token}`;

                const socket = new WebSocket(socketPath);
                socketRef.current = socket;

                socket.onopen = () => {
                    if (connectId !== activeConnectIdRef.current) {
                        socket.close(1000);
                        return;
                    }
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
                            const msgRoomId = payload.room_id || payload.room;

                            // If recipient is currently active in this chat room, send read receipt back immediately
                            if (!isMe && isChatPage && String(activeRoomIdRef.current) === String(msgRoomId)) {
                                if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                                    socketRef.current.send(JSON.stringify({ type: "read", room_id: msgRoomId }));
                                }
                            }

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
                    if (connectId !== activeConnectIdRef.current) return;

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

            } catch (err) {
                
                // If it is not a cancellation and component is still mounted, schedule a retry.
                // Note: performLogout will trigger a redirect, but we schedule a retry in case of transient network errors.
                if (isComponentMounted && connectId === activeConnectIdRef.current) {
                    const delay = Math.min(
                        1000 * Math.pow(2, reconnectAttemptsRef.current),
                        10000
                    );
                    reconnectAttemptsRef.current++;
                    reconnectTimeoutRef.current = setTimeout(connect, delay);
                }
            }
        };

        connect();

        return () => {
            isComponentMounted = false;
            if (socketRef.current) {
                socketRef.current.onclose = null;
                socketRef.current.close(1000);
                socketRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [userId, dispatch, location.pathname, navigate]);

    return null;
};

export default AppSocket;
