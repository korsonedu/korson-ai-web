from typing import Any, Dict, List, Tuple


OBJECTIVE_HINTS = {'objective', '单选', '单选题', '选择题', '单项选择题'}
SUBJECTIVE_HINTS = {'subjective', '主观题', 'noun', 'short', 'essay', 'calculate', '名词解释', '简答题', '论述题', '计算题'}


def validate_question_list_payload(payload: Any, allow_empty: bool = False) -> Tuple[bool, List[str]]:
    errors: List[str] = []
    if not isinstance(payload, list):
        return False, ['payload_not_list']

    if not payload and not allow_empty:
        return False, ['payload_empty']

    for idx, item in enumerate(payload):
        prefix = f'item_{idx}'
        if not isinstance(item, dict):
            errors.append(f'{prefix}_not_object')
            continue

        question_text = str(item.get('question') or item.get('text') or '').strip()
        if not question_text:
            errors.append(f'{prefix}_missing_question')
            continue

        q_type_raw = str(
            item.get('q_type')
            or item.get('question_type')
            or item.get('type')
            or ''
        ).strip().lower()
        subjective_type_raw = str(item.get('subjective_type') or '').strip().lower()
        answer_text = str(item.get('answer') or item.get('correct_answer') or '').strip()

        is_objective = q_type_raw in OBJECTIVE_HINTS or (q_type_raw == '' and isinstance(item.get('options'), (dict, list)))
        is_subjective = q_type_raw in SUBJECTIVE_HINTS or subjective_type_raw in {'noun', 'short', 'essay', 'calculate'}

        if is_objective:
            options = item.get('options')
            if not isinstance(options, (dict, list)):
                errors.append(f'{prefix}_objective_missing_options')
            if not answer_text:
                errors.append(f'{prefix}_objective_missing_answer')

        if is_subjective and not answer_text:
            errors.append(f'{prefix}_subjective_missing_answer')

    return len(errors) == 0, errors


def validate_grading_payload(payload: Any) -> Tuple[bool, List[str]]:
    if not isinstance(payload, dict):
        return False, ['payload_not_object']

    errors: List[str] = []
    required_keys = {'score', 'feedback', 'analysis', 'fsrs_rating'}
    missing = [key for key in required_keys if key not in payload]
    if missing:
        errors.append(f'missing_keys:{",".join(sorted(missing))}')

    try:
        float(payload.get('score', 0))
    except Exception:
        errors.append('score_not_number')

    try:
        int(payload.get('fsrs_rating', 2))
    except Exception:
        errors.append('fsrs_rating_not_int')

    feedback = str(payload.get('feedback', '')).strip()
    if not feedback:
        errors.append('feedback_empty')

    return len(errors) == 0, errors
