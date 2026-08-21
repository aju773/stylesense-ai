import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.local")

# Initialize Django FIRST. Everything below imports models, either directly or
# transitively, and touching the app registry before this call raises
# AppRegistryNotReady.
#
# The imports are deliberately placed after this line rather than at the top of
# the file, which is why they carry noqa: E402. Do not let a formatter or a
# tidy-up move them back up.
#
# Note this failure mode is invisible under `manage.py runserver`, which sets
# Django up itself before loading the ASGI application. It appears only when a
# server such as Daphne imports core.asgi directly — i.e. in production.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

from apps.chat.middleware import JWTAuthMiddleware  # noqa: E402
from apps.chat.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
    }
)
