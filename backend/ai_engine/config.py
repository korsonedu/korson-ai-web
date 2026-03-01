import os
from django.conf import settings

# 基础模型配置：修正为 V3.2 模型
DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V3.2'
DEFAULT_BASE_URL = 'https://api.siliconflow.cn/v1/chat/completions'

def get_llm_config():
    """集中获取 AI 服务的配置，支持环境变量和 settings 配置"""
    return {
        "api_key": getattr(settings, 'LLM_API_KEY', os.getenv('LLM_API_KEY', '')),
        "base_url": getattr(settings, 'LLM_BASE_URL', os.getenv('LLM_BASE_URL', DEFAULT_BASE_URL)),
        "model": getattr(settings, 'LLM_MODEL', os.getenv('LLM_MODEL', DEFAULT_MODEL)),
    }
