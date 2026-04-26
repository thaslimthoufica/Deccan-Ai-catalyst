import json
from typing import Any

from openai import OpenAI

from app.core.config import settings


class LLMService:
    def __init__(self) -> None:
        self.provider = settings.llm_provider.lower().strip()
        self.openai_model = settings.openai_model
        self.hf_model = settings.hf_model
        self.openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.hf_client = (
            OpenAI(base_url=settings.hf_base_url, api_key=settings.hf_token)
            if settings.hf_token
            else None
        )

    def json_completion(self, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        if self.provider == 'huggingface':
            return self._huggingface_json_completion(system_prompt, user_prompt)
        return self._openai_json_completion(system_prompt, user_prompt)

    def _huggingface_json_completion(self, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        if not self.hf_client:
            raise RuntimeError('HF_TOKEN is missing.')

        response = self.hf_client.chat.completions.create(
            model=self.hf_model,
            messages=[
                {'role': 'system', 'content': f'{system_prompt}\nReturn only valid JSON.'},
                {'role': 'user', 'content': user_prompt},
            ],
            temperature=0.2,
            max_tokens=1200,
        )
        return self._parse_json(response.choices[0].message.content or '{}')

    def _openai_json_completion(self, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        if not self.openai_client:
            raise RuntimeError('OPENAI_API_KEY is missing.')

        response = self.openai_client.chat.completions.create(
            model=self.openai_model,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt},
            ],
            response_format={'type': 'json_object'},
        )
        return self._parse_json(response.choices[0].message.content or '{}')

    def _parse_json(self, text: str) -> dict[str, Any]:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1 and end > start:
                return json.loads(text[start : end + 1])
            raise
