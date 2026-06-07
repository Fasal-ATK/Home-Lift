import os

# ⚠️  MUST be set before any Django/Channels/app imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'home_lift.settings')

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
import notifications.routing
from core.ws_middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(
            notifications.routing.websocket_urlpatterns
        )
    ),
})
