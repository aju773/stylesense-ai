"""Development settings.

base.py is secure by default; this file is where those defaults get loosened
so local work over plain http is possible. Nothing here should ever be true
in production.
"""

from .base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

SIMPLE_JWT = {**SIMPLE_JWT, "AUTH_COOKIE_SECURE": False}  # noqa: F405

DATABASES["default"]["CONN_MAX_AGE"] = 0  # noqa: F405
