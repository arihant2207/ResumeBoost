import logging
import os
import re
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# apps/api/.env — always relative to this package root, not process CWD
API_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = API_ROOT / ".env"

logger = logging.getLogger(__name__)


def _mask_secret(value: str | None) -> str:
    """Safe repr for logs — never prints secret content."""
    if value is None:
        return "None"
    if value == "":
        return "''"
    return f"'<{len(value)} chars>'"


def _decode_env_bytes(raw: bytes) -> str:
    if raw.startswith(b"\xff\xfe"):
        return raw.decode("utf-16-le")
    if raw.startswith(b"\xfe\xff"):
        return raw.decode("utf-16-be")
    if raw.startswith(b"\xef\xbb\xbf"):
        return raw.decode("utf-8-sig")
    return raw.decode("utf-8")


def _parse_env_file(path: Path) -> dict[str, str]:
    """
    Parse .env manually so we can skip empty values and detect encoding issues.
    Empty assignments (KEY=) do not overwrite os.environ.
    """
    raw = path.read_bytes()
    text = _decode_env_bytes(raw)
    result: dict[str, str] = {}

    for line_no, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" not in stripped:
            logger.debug("Skipping non-assignment line %d in %s", line_no, path)
            continue

        key, sep, value = stripped.partition("=")
        key = key.strip()
        if not key:
            continue

        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]

        # Strip invisible / zero-width characters sometimes introduced by editors
        value = re.sub(r"[\u200b-\u200d\ufeff]", "", value)

        result[key] = value

    return result


def _bootstrap_env_file() -> dict[str, str]:
    """Load apps/api/.env into os.environ (non-empty values only)."""
    if not ENV_FILE.is_file():
        logger.warning("ENV file not found: %s", ENV_FILE)
        return {}

    parsed = _parse_env_file(ENV_FILE)

    for key, value in parsed.items():
        if value:
            os.environ[key] = value
        else:
            # Skip empty lines like ANTHROPIC_API_KEY= (do not poison os.environ)
            os.environ.pop(key, None)

    return parsed


_PARSED_ENV = _bootstrap_env_file()


class Settings(BaseSettings):
    # Read from os.environ only (populated by _bootstrap_env_file).
    # Do not set env_file here — pydantic would re-read empty KEY= lines from disk.
    model_config = SettingsConfigDict(
        env_ignore_empty=True,
        extra="ignore",
    )

    cors_origins: str = "http://localhost:3000"
    max_upload_bytes: int = 10 * 1024 * 1024  # 10 MB

    # Env var ANTHROPIC_API_KEY maps automatically (no validation_alias needed)
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"
    anthropic_max_tokens: int = 4096

    @field_validator("anthropic_api_key", mode="before")
    @classmethod
    def strip_api_key(cls, value: object) -> str:
        if value is None:
            return ""
        return str(value).strip()

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()


def _log_env_diagnostics() -> None:
    """Startup diagnostics — lengths only, never secret values."""
    from_env = os.getenv("ANTHROPIC_API_KEY")

    logger.info("ENV file path: %s", ENV_FILE)
    logger.info("ENV file exists: %s", ENV_FILE.is_file())
    if ENV_FILE.is_file():
        logger.info("ENV file size (bytes): %d", ENV_FILE.stat().st_size)

    logger.info("settings.anthropic_api_key: %s", _mask_secret(settings.anthropic_api_key))
    logger.info("os.getenv('ANTHROPIC_API_KEY'): %s", _mask_secret(from_env))

    # Variables parsed directly from disk (independent of pydantic)
    anthropic_from_file = {
        k: v for k, v in _PARSED_ENV.items() if k.startswith("ANTHROPIC")
    }
    if anthropic_from_file:
        for key in sorted(anthropic_from_file):
            logger.info("parsed from .env - %s length: %d", key, len(anthropic_from_file[key]))
    else:
        logger.info("parsed from .env - no ANTHROPIC_* keys found")

    key_line = _PARSED_ENV.get("ANTHROPIC_API_KEY")
    if key_line is not None and len(key_line) == 0:
        logger.warning(
            "On disk, ANTHROPIC_API_KEY= has an empty value (line is 'KEY=' only). "
            "Save apps/api/.env in your editor so the key is on the same line, then restart."
        )


def log_settings_summary() -> None:
    """Log non-secret config diagnostics at startup."""
    _log_env_diagnostics()
    logger.info("ANTHROPIC_API_KEY effective length: %d", len(settings.anthropic_api_key))
