"""Infrastructure views: health check and the SPA entry point."""

from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponse, JsonResponse


def healthz(request):
    """Liveness probe.

    Deliberately does NOT touch the database. Render polls this to decide
    whether a new container may take traffic, and the keep-alive pinger hits it
    every 10 minutes. Querying Postgres here would mean a transient Neon
    hiccup could fail an otherwise healthy deploy, and would wake Neon's
    compute on every ping — burning the free tier's compute-hours around the
    clock to answer a question that is not about the database.
    """
    return JsonResponse({"status": "ok"})


def spa(request):
    """Serve the React app's index.html for any client-side route.

    React Router owns paths like /shop or /products/some-slug. Those exist only
    in the browser — Django has no URL pattern for them, so a hard refresh or a
    pasted link would 404 without this catch-all handing back index.html and
    letting the router resolve the path once it boots.

    Registered LAST in core/urls.py so real routes (/api/, /admin/, /static/)
    always win.
    """
    index = Path(settings.FRONTEND_DIST) / "index.html"

    if not index.is_file():
        # Normal in local development: the SPA is served by the Vite dev server
        # on :5173 and Django only answers /api/. Being explicit beats a
        # confusing 404 or an empty response.
        return HttpResponse(
            "Frontend build not found. In development the SPA is served by "
            "Vite on http://localhost:5173. In production it is built into "
            "backend/frontend_dist by the Dockerfile.",
            status=501,
            content_type="text/plain",
        )

    # Must not be cached: index.html is the one file whose name never changes,
    # so a cached copy would keep pointing at asset filenames from an old
    # deploy that no longer exist.
    response = FileResponse(index.open("rb"), content_type="text/html")
    response["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response
