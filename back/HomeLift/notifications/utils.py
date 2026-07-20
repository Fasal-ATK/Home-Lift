from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

def send_user_notification(user_id, message):
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{user_id}",
                {
                    "type": "send_notification",
                    "message": message,
                }
            )
        else:
            logger.warning(f"Could not send notification: Channel layer not configured.")
    except Exception as e:
        logger.warning(f"Failed to send real-time notification to user {user_id}: {e}")
