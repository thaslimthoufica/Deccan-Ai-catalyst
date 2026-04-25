from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    openai_api_key: str = ''
    openai_model: str = 'gpt-4.1-mini'
    supabase_url: str = ''
    supabase_service_role_key: str = ''
    supabase_bucket: str = 'resumes'
    cors_origins: str = 'http://localhost:3000'


settings = Settings()
