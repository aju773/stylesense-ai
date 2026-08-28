from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """Read JWT from HttpOnly cookie instead of Authorization header.

    A missing cookie returns None (DRF's "this authenticator doesn't apply"
    signal), which is what lets AllowAny views work for anonymous visitors.
    A present-but-broken cookie — expired, malformed, or naming a user id
    that no longer exists (e.g. after manual DB cleanup) — must degrade the
    same way, not raise: `authenticate()` runs in `initial()` before
    permission checks, so an uncaught AuthenticationFailed here 401s every
    view, including AllowAny ones, and blocks a stale-cookie browser from
    even reaching login or register to get a fresh one.
    """

    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE"])
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
        except (TokenError, AuthenticationFailed):
            return None

        return (user, validated_token)
