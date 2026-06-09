import logging
from functools import lru_cache

from supabase import Client, create_client

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_supabase_client() -> Client | None:
    """
    Returns a singleton Supabase client using the service role key.
    Returns None if credentials are not configured — app continues without DB.
    """
    url = settings.supabase_url
    key = settings.supabase_service_key

    if not url or not key:
        logger.warning(
            "Supabase credentials not configured — DB persistence disabled. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars."
        )
        return None

    try:
        client = create_client(url, key)
        logger.info("Supabase client initialised (url=%s...)", url[:40])
        return client
    except Exception:
        logger.exception("Failed to initialise Supabase client — DB persistence disabled.")
        return None