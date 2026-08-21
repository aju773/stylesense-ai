"""Production settings.

base.py already fails closed — DEBUG is off, SECRET_KEY is required from the
environment, ALLOWED_HOSTS is empty unless told otherwise. This file only adds
the hardening that would be actively annoying during local development.

Everything environment-specific arrives as an environment variable set in the
Render dashboard. Nothing secret is ever written to a file in this repo.
"""

from .base import *  # noqa: F403

# Render terminates TLS at its edge and forwards over http, so Django sees an
# insecure request unless it is told to trust this header. Without it,
# SECURE_SSL_REDIRECT below would see http, redirect to https, and the edge
# would forward http again — an infinite redirect loop.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# Render injects RENDER_EXTERNAL_HOSTNAME with the service's public hostname.
# Trusting it automatically means the very first deploy works before anyone
# knows what the URL will be — otherwise the service boots fine and then
# answers every request with DisallowedHost, which reads like a crash but is
# only a configuration gap. DJANGO_ALLOWED_HOSTS still works for custom domains.
RENDER_EXTERNAL_HOSTNAME = env("RENDER_EXTERNAL_HOSTNAME", default=None)  # noqa: F405
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS = [*ALLOWED_HOSTS, RENDER_EXTERNAL_HOSTNAME]  # noqa: F405
    CSRF_TRUSTED_ORIGINS = [
        *CSRF_TRUSTED_ORIGINS,  # noqa: F405
        f"https://{RENDER_EXTERNAL_HOSTNAME}",
    ]

SECURE_SSL_REDIRECT = True

# Start the HSTS window short. Browsers cache this and REFUSE plain http for
# the full duration, so a mistake at a large value is not something you can
# undo by shipping a fix. Raise it deliberately once the domain is settled.
SECURE_HSTS_SECONDS = env.int("DJANGO_HSTS_SECONDS", default=3600)  # noqa: F405
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

# Logging to stdout is what makes anything visible in Render's log stream;
# there is no writable log file worth keeping on an ephemeral container.
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
            # Query logging at DEBUG is extremely noisy and can leak data into
            # logs. Pinned regardless of root level.
            "level": "WARNING",
            "handlers": ["console"],
            "propagate": False,
        },
    },
}
