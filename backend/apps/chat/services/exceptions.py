class AIProviderTransientError(Exception):
    """Recoverable error — orchestrator should try the next provider.

    Examples: rate limits (429), server errors (5xx), timeouts.
    """


class AIProviderPermanentError(Exception):
    """Non-recoverable error — fallback would fail with the same error.

    Examples: invalid API key (401), bad request (400), content blocked.
    """
