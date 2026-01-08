import { useEffect } from 'react';
import { toast } from 'react-toastify';

const NotificationSocket = ({ userId }) => {
    useEffect(() => {
        if (!userId) return;

        // Ensure this matches your backend URL. 
        // If you are using a different port or host, update it here.
        const socket = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/${userId}/`);

        socket.onopen = () => {
            console.log('WebSocket Connected');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Notification received:', data.message);

                // Show toast notification
                if (data.message) {
                    toast.info(data.message);
                }
            } catch (error) {
                console.error('Error parsing notification:', error);
            }
        };

        socket.onclose = (e) => {
            console.log('WebSocket Disconnected', e.code, e.reason);
        };

        socket.onerror = (e) => {
            console.error('WebSocket Error:', e);
        };

        return () => {
            socket.close();
        };
    }, [userId]);

    return null;
};

export default NotificationSocket;
