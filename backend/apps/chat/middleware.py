from http.cookies import SimpleCookie

from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

from apps.users.models import User


@database_sync_to_async
def get_user_from_token(token_str):
    """Validate JWT and return the user, or AnonymousUser on failure."""
    try:
        token = AccessToken(token_str)
        return User.objects.get(id=token["user_id"])
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware:
    """Read access_token cookie from WebSocket handshake headers."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        raw_cookie = headers.get(b"cookie", b"").decode()
        cookie = SimpleCookie()
        cookie.load(raw_cookie)
        cookie_name = settings.SIMPLE_JWT["AUTH_COOKIE"]
        token_morsel = cookie.get(cookie_name)
        if token_morsel:
            scope["user"] = await get_user_from_token(token_morsel.value)
        else:
            scope["user"] = AnonymousUser()
        return await self.app(scope, receive, send)
