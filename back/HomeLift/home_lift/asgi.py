import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "home_lift.settings")

from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from core.ws_middleware import JWTAuthMiddleware
import notifications.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            notifications.routing.websocket_urlpatterns
        )
    ),
})