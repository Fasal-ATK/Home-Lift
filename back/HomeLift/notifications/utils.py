from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)


def send_user_notification(user_id, message, title=None, notification_type="system", payload=None):
    """
    Send a real-time WebSocket notification to a specific user.

    Args:
        user_id:           The recipient's user ID.
        message:           The notification body text.
        title:             Optional short title for the notification toast.
        notification_type: One of 'booking', 'payment', 'provider', 'chat', 'system'.
        payload:           Optional extra dict forwarded to the frontend as-is.
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{user_id}",
                {
                    "type": "send_notification",
                    "message": message,
                    "title": title or "",
                    "notification_type": notification_type,
                    "payload": payload or {},
                }
            )
        else:
            logger.warning("Could not send notification: Channel layer not configured.")
    except Exception as e:
        logger.warning("Failed to send real-time notification to user %s: %s", user_id, e)
