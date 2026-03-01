from typing import Dict, Sequence


class AssistantChatService:
    @classmethod
    def chat_with_assistant(
        cls,
        ai,
        bot,
        history_messages: Sequence[Dict[str, str]],
        user_message: str,
        student_context: str = '',
    ):
        system_prompt = ai.get_template('ai_assistant', 'system_prompt.txt') or '你是一位专业助教。'
        assistant_prompt = ai.get_template('ai_assistant', 'base_assistant_prompt.txt') or ''

        prompt_parts = [system_prompt, assistant_prompt]

        if bot and getattr(bot, 'system_prompt', None):
            prompt_parts.append(str(bot.system_prompt))

        if bot and getattr(bot, 'is_exclusive', False):
            exclusive_template = ai.get_template('ai_assistant', 'exclusive_mentor_prompt.txt') or ''
            if exclusive_template:
                prompt_parts.append(ai.format_template(exclusive_template, student_context=student_context or '暂无学业画像。'))

        messages = [{'role': 'system', 'content': '\n\n'.join(part for part in prompt_parts if part)}]

        for msg in history_messages or []:
            role = str(msg.get('role', '')).strip()
            content = str(msg.get('content', '')).strip()
            if role in {'user', 'assistant'} and content:
                messages.append({'role': role, 'content': content})

        messages.append({'role': 'user', 'content': user_message})

        return ai.call_ai(
            messages,
            temperature=0.6,
            max_tokens=2500,
            operation='assistant.chat',
        )
