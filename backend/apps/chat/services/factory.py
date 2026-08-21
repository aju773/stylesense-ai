from django.conf import settings
from django.utils.module_loading import import_string

from .orchestrator import AIProviderOrchestrator


def get_ai_orchestrator() -> AIProviderOrchestrator:
    """Build orchestrator from settings.AI_PROVIDERS config."""
    providers = []
    for provider_conf in settings.AI_PROVIDERS:
        provider_cls = import_string(provider_conf["class"])
        api_key = getattr(settings, provider_conf["api_key_setting"])
        provider = provider_cls(api_key=api_key)
        providers.append(provider)
    return AIProviderOrchestrator(providers)
