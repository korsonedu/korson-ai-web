from celery import shared_task

from quizzes.ai_workflow import run_exam_grading
from quizzes.services.ai_parse_service import run_parse_task


@shared_task(name='quizzes.run_exam_grading_task')
def run_exam_grading_task(user_id: int, exam_id: int, questions_data):
    run_exam_grading(user_id, exam_id, questions_data)


@shared_task(name='quizzes.run_ai_parse_task')
def run_ai_parse_task(raw_text: str, task_id: str):
    run_parse_task(raw_text, task_id)
