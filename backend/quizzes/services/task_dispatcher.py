import logging
import threading
from typing import Any, Dict, List

from quizzes.ai_workflow import run_exam_grading
from quizzes.services.ai_parse_service import run_parse_task
from quizzes.tasks import run_ai_parse_task, run_exam_grading_task


logger = logging.getLogger(__name__)


def dispatch_exam_grading(user_id: int, exam_id: int, questions_data: List[Dict[str, Any]]) -> None:
    try:
        run_exam_grading_task.delay(user_id, exam_id, questions_data)
    except Exception as exc:
        logger.exception("Celery dispatch exam grading failed, fallback thread mode: %s", exc)
        thread = threading.Thread(target=run_exam_grading, args=(user_id, exam_id, questions_data), daemon=True)
        thread.start()


def dispatch_ai_parse_task(raw_text: str, task_id: str) -> None:
    try:
        run_ai_parse_task.delay(raw_text, task_id)
    except Exception as exc:
        logger.exception("Celery dispatch AI parse failed, fallback thread mode: %s", exc)
        thread = threading.Thread(target=run_parse_task, args=(raw_text, task_id), daemon=True)
        thread.start()
