import datetime
from typing import Any, Dict, List, Optional

from django.core.cache import cache

from ai_service import AIService


def build_parse_task_id() -> str:
    return datetime.datetime.now().strftime('%Y%m%d%H%M%S%f')


def init_parse_task(task_id: str) -> None:
    cache.set(f"parse_task_{task_id}", {"status": "processing", "progress": "0%", "data": []}, 3600)


def get_parse_task(task_id: Optional[str]) -> Optional[Dict[str, Any]]:
    if not task_id:
        return None
    return cache.get(f"parse_task_{task_id}")


def extract_raw_text(raw_text: str, file_obj) -> str:
    text = raw_text or ''
    if file_obj:
        if file_obj.name.endswith('.docx'):
            import docx  # type: ignore

            doc = docx.Document(file_obj)
            text = "\n".join([p.text for p in doc.paragraphs])
        else:
            text = file_obj.read().decode('utf-8', errors='ignore')
    return text


def _build_chunks(raw_text: str, chunk_size: int = 2000, overlap: int = 150) -> List[str]:
    chunks = []
    step = max(1, chunk_size - overlap)
    for i in range(0, len(raw_text), step):
        chunks.append(raw_text[i : i + chunk_size])
    return chunks


def run_parse_task(raw_text: str, task_id: str) -> None:
    chunks = _build_chunks(raw_text)
    total_chunks = len(chunks[:25])  # 封顶支持约 5 万字
    all_questions: List[Dict[str, Any]] = []

    for i, chunk in enumerate(chunks[:25]):
        cache.set(
            f"parse_task_{task_id}",
            {"status": "processing", "progress": f"{i + 1}/{total_chunks}", "data": all_questions},
            3600,
        )

        parsed = AIService.parse_questions_from_text(chunk)
        for q in parsed:
            if not any(existing.get('text') == q.get('text') for existing in all_questions):
                all_questions.append(q)

    cache.set(f"parse_task_{task_id}", {"status": "completed", "progress": "100%", "data": all_questions}, 3600)
