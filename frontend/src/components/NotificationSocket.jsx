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
            // Using window.location.hostname helps with 127.0.0.1 vs localhost mismatches
            const host = window.location.hostname === 'localhost' ? 'localhost:8000' : '127.0.0.1:8000';
            console.log(`[${connectionId}] Attempting WebSocket connection...`);
            socket = new WebSocket(`ws://${host}/ws/notifications/${userId}/`);

            socket.onopen = () => {
                console.log(`[${connectionId}] WebSocket Connected`);
                reconnectAttempts = 0; // Reset on successful connection
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.message) {
                        if (seenMessages.has(data.message)) return;
                        seenMessages.add(data.message);
                        setTimeout(() => seenMessages.delete(data.message), 2000);

                        toast.info(data.message);
                        dispatch(addNotification({
                            id: Date.now(),
                            message: data.message,
                            created_at: new Date().toISOString(),
                            is_read: false,
                            type: 'system',
                            ...data
                        }));
                    }
                } catch (error) {
                    console.error('Error parsing notification:', error);
                }
            };

            socket.onclose = (e) => {
                // Don't log or reconnect if it was a normal closure (1000) 
                // or if the component is unmounting (handled by cleanup)
                if (e.code === 1000) {
                    console.log(`[${connectionId}] WebSocket Closed Normally`);
                    return;
                }

                console.log(`[${connectionId}] WebSocket Disconnected ${e.code}`);

                // Exponential backoff for reconnection
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
                reconnectAttempts++;
                reconnectTimeout = setTimeout(connect, delay);
            };

            socket.onerror = (e) => {
                // Check if connection was ever established to distinguish between
                // general errors and initial connection failures
                if (socket.readyState === WebSocket.OPEN) {
                    console.error(`[${connectionId}] WebSocket Runtime Error:`, e);
                }
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
