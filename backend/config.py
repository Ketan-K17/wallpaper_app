"""
Configuration settings for the AI Wallpaper Generator backend
"""

import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    
    # AI Model Configuration
    model_cache_dir: str = "./models"
    max_generation_time: int = 300  # seconds
    default_image_width: int = 1080
    default_image_height: int = 1920
    
    # OpenAI Configuration (if using DALL-E)
    openai_api_key: str = ""
    
    # Hugging Face Configuration
    huggingface_token: str = ""
    
    # Storage Configuration
    max_stored_images: int = 1000
    cleanup_interval_hours: int = 24
    generated_images_dir: str = "generated_images"
    
    # Security
    allowed_origins: List[str] = [
        "http://localhost:8081",
        "exp://192.168.1.100:8081",
        "*"  # Remove this in production
    ]
    
    # Rate Limiting
    rate_limit_per_minute: int = 10
    rate_limit_per_hour: int = 50
    
    class Config:
        env_file = ".env"

# Global settings instance
settings = Settings()

# Create required directories
os.makedirs(settings.model_cache_dir, exist_ok=True)
os.makedirs(settings.generated_images_dir, exist_ok=True)
