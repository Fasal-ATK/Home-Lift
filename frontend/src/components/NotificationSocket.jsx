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
        const seenMessages = new Set(); // To prevent duplicate toasts in short window

        const connect = () => {
            console.log(`[${connectionId}] Attempting WebSocket connection...`);
            socket = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/${userId}/`);

            socket.onopen = () => {
                console.log(`[${connectionId}] WebSocket Connected`);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log(`[${connectionId}] Notification received:`, data.message);

                    if (data.message) {
                        // Simple de-duplication: skip if message same as one seen in last 2 seconds
                        if (seenMessages.has(data.message)) {
                            console.log(`[${connectionId}] Skipping duplicate notification`);
                            return;
                        }
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
                console.log(`[${connectionId}] WebSocket Disconnected`, e.code, e.reason);
                if (e.code !== 1000) {
                    // Try to reconnect after 3 seconds if not closed normally
                    reconnectTimeout = setTimeout(connect, 3000);
                }
            };

            socket.onerror = (e) => {
                console.error(`[${connectionId}] WebSocket Error:`, e);
                socket.close();
            };
        };

        connect();

        return () => {
            if (socket) socket.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [userId, dispatch]);

    return null;
};

export default NotificationSocket;
