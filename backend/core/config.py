from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os
from dotenv import load_dotenv
from typing import Optional

# Explicitly load .env from the backend root
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "Telegram Scraping Platform"
    
    # Database
    DATABASE_URL: str = "sqlite:///./test.db"
    LIBSQL_AUTH_TOKEN: str = ""
    
    # JWT
    JWT_SECRET_KEY: str = "secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Telegram
    TELEGRAM_API_ID: int = 0
    TELEGRAM_API_HASH: str = ""
    
    # AI & Alerts
    OPENAI_API_KEY: str = ""
    XAI_API_KEY: str = ""
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "alerts@teleauto.com"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    def validate_telegram_config(self):
        if self.TELEGRAM_API_ID == 0 or not self.TELEGRAM_API_HASH:
            # We don't raise here to allow the app to start, 
            # but services should check this.
            return False
        return True

@lru_cache()
def get_settings():
    return Settings()
