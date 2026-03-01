import logging
from typing import Any, Dict, Optional

from django.core.cache import cache
from django.utils import timezone


logger = logging.getLogger(__name__)


def _safe_incr(key: str, timeout_seconds: int = 48 * 3600) -> None:
    try:
        cache.incr(key)
    except Exception:
        try:
            cache.set(key, 1, timeout_seconds)
        except Exception:
            # 观测不能影响业务链路
            return


def _as_text_dict(payload: Optional[Dict[str, Any]]) -> Dict[str, str]:
    if not isinstance(payload, dict):
        return {}
    normalized: Dict[str, str] = {}
    for key, value in payload.items():
        if value is None:
            continue
        normalized[str(key)] = str(value)
    return normalized


def record_ai_operation(
    operation: str,
    success: bool,
    duration_ms: int,
    error_category: str = 'none',
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    op = str(operation or 'unknown').strip() or 'unknown'
    err = str(error_category or 'none').strip() or 'none'
    now = timezone.now()
    bucket = now.strftime('%Y%m%d%H')

    base = f'ai:ops:{op}:{bucket}'
    _safe_incr(f'{base}:total')
    _safe_incr(f'{base}:success' if success else f'{base}:fail')
    if not success:
        _safe_incr(f'{base}:err:{err}')

    meta = _as_text_dict(metadata)
    logger.info(
        "ai.obs operation=%s success=%s duration_ms=%s error=%s meta=%s",
        op,
        success,
        max(0, int(duration_ms or 0)),
        err,
        meta,
    )


def record_schema_event(
    operation: str,
    stage: str,
    success: bool,
    detail: str = '',
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    op = str(operation or 'unknown').strip() or 'unknown'
    stg = str(stage or 'validate').strip() or 'validate'
    bucket = timezone.now().strftime('%Y%m%d%H')

    base = f'ai:schema:{op}:{bucket}:{stg}'
    _safe_incr(f'{base}:total')
    _safe_incr(f'{base}:success' if success else f'{base}:fail')

    meta = _as_text_dict(metadata)
    if detail:
        meta['detail'] = str(detail)

    logger.info(
        "ai.schema operation=%s stage=%s success=%s meta=%s",
        op,
        stg,
        success,
        meta,
    )
