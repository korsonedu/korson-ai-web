import logging
from pathlib import Path
from typing import Optional

from django.conf import settings


logger = logging.getLogger(__name__)


def _base_dir() -> Path:
    return Path(getattr(settings, 'BASE_DIR', Path(__file__).resolve().parent.parent))


def get_bots_prompt_dir() -> Path:
    path = _base_dir() / 'core' / 'prompts' / 'bots'
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_legacy_bots_prompt_dir() -> Path:
    return _base_dir() / 'ai_assistant' / 'templates' / 'bots'


def get_bot_prompt_template_name(bot) -> str:
    return f'bots/bot_{bot.id}_prompt.txt'


def get_bot_prompt_path(bot) -> Path:
    return get_bots_prompt_dir() / f'bot_{bot.id}_prompt.txt'


def _get_legacy_bot_prompt_path(bot) -> Path:
    return get_legacy_bots_prompt_dir() / f'bot_{bot.id}_prompt.txt'


def read_bot_prompt_file(bot) -> Optional[str]:
    path = get_bot_prompt_path(bot)
    if not path.exists():
        return None
    try:
        return path.read_text(encoding='utf-8')
    except Exception:
        logger.exception('读取机器人 Prompt 文件失败: %s', path)
        return None


def write_bot_prompt_file(bot, content: str) -> Path:
    path = get_bot_prompt_path(bot)
    path.write_text(str(content or ''), encoding='utf-8')
    return path


def sync_bot_prompt(bot):
    """
    双向同步规则：
    1) 若新路径存在，文件优先 -> 覆盖数据库。
    2) 若新路径不存在但旧路径存在，迁移旧文件 -> 覆盖数据库。
    3) 若都不存在，按数据库内容创建新文件。
    """
    new_path = get_bot_prompt_path(bot)
    legacy_path = _get_legacy_bot_prompt_path(bot)

    source_text = None
    if new_path.exists():
        source_text = read_bot_prompt_file(bot)
    elif legacy_path.exists():
        try:
            source_text = legacy_path.read_text(encoding='utf-8')
            write_bot_prompt_file(bot, source_text)
            logger.info('已迁移机器人 Prompt 到 core/prompts: bot_id=%s', bot.id)
        except Exception:
            logger.exception('迁移旧机器人 Prompt 失败: %s', legacy_path)

    if source_text is not None:
        if bot.system_prompt != source_text:
            bot.system_prompt = source_text
            bot.save(update_fields=['system_prompt'])
        return

    write_bot_prompt_file(bot, bot.system_prompt or '')


def delete_bot_prompt_file(bot):
    path = get_bot_prompt_path(bot)
    if not path.exists():
        return
    try:
        path.unlink()
    except Exception:
        logger.exception('删除机器人 Prompt 文件失败: %s', path)
