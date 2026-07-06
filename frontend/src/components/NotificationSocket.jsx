import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { addNotification } from '../redux/slices/notificationSlice';

const NotificationSocket = ({ userId }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!userId) return;

        const connectionId = Math.random().toString(36).substring(7);
        let socket;
        let reconnectTimeout;
        let reconnectAttempts = 0;
        const seenMessages = new Set();

        const connect = () => {
            const token = localStorage.getItem("accessToken");

            const wsBase =
                import.meta.env.VITE_WS_URL ||
                (window.location.protocol === "https:"
                    ? "wss://api.home-lift.online"
                    : "ws://localhost:8000");

            const socketUrl = `${wsBase}/ws/notifications/${userId}/?token=${token}`;

            console.log(`[${connectionId}] Connecting to ${socketUrl}`);

            socket = new WebSocket(socketUrl);

            socket.onopen = () => {
                console.log(`[${connectionId}] Connected`);
                reconnectAttempts = 0;
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.message) {
                        if (seenMessages.has(data.message)) return;

                        seenMessages.add(data.message);

                        setTimeout(() => seenMessages.delete(data.message), 2000);

                        toast.info(data.message);

                        dispatch(
                            addNotification({
                                id: Date.now(),
                                message: data.message,
                                created_at: new Date().toISOString(),
                                is_read: false,
                                type: "system",
                                ...data,
                            })
                        );
                    }
                } catch (e) {
                    console.error(e);
                }
            };

            socket.onclose = (e) => {
                if (e.code === 1000) return;

                const delay = Math.min(
                    1000 * Math.pow(2, reconnectAttempts),
                    10000
                );

                reconnectAttempts++;

                reconnectTimeout = setTimeout(connect, delay);
            };

            socket.onerror = (e) => {
                console.error(e);
                socket.close();
            };
        };

        connect();

        return () => {
            if (socket) {
                socket.onopen = null;
                socket.onmessage = null;
                socket.onclose = null;
                socket.onerror = null;
                if (socket.readyState === WebSocket.OPEN) {
                    socket.close(1000);
                } else if (socket.readyState === WebSocket.CONNECTING) {
                    // If connecting, we can't close cleanly without a warning in some browsers,
                    // but nulling the handlers prevents unwanted state updates.
                    socket.close();
                }
            }
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [userId, dispatch]);

    return null;
};

export default NotificationSocket;
