from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Renamed the path to represent its broader purpose
    re_path(r'ws/socket/(?P<user_id>\d+)/$', consumers.MainConsumer.as_asgi()),
    
    # Keeping old path temporarily for legacy compatibility (if needed)
    re_path(r'ws/notifications/(?P<user_id>\d+)/$', consumers.MainConsumer.as_asgi()),
]
