"""Production settings.

base.py already fails closed — DEBUG is off, SECRET_KEY is required from the
environment, ALLOWED_HOSTS is empty unless told otherwise. This file only adds
the hardening that would be actively annoying during local development.

Everything environment-specific arrives as an environment variable set in the
Render dashboard. Nothing secret is ever written to a file in this repo.
"""

from .base import *  # noqa: F403

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

RENDER_EXTERNAL_HOSTNAME = env("RENDER_EXTERNAL_HOSTNAME", default=None)  # noqa: F405
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS = [*ALLOWED_HOSTS, RENDER_EXTERNAL_HOSTNAME]  # noqa: F405
    CSRF_TRUSTED_ORIGINS = [
        *CSRF_TRUSTED_ORIGINS,  # noqa: F405
        f"https://{RENDER_EXTERNAL_HOSTNAME}",
    ]

SECURE_SSL_REDIRECT = True

SECURE_HSTS_SECONDS = env.int("DJANGO_HSTS_SECONDS", default=3600)  # noqa: F405
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": env("DJANGO_LOG_LEVEL", default="INFO"),  # noqa: F405
    },
    "loggers": {
        "django.db.backends": {
            "level": "WARNING",
            "handlers": ["console"],
            "propagate": False,
        },
    },
}
