#!/usr/bin/env python3
"""
Start script for the AI Wallpaper Generator backend server
"""

import uvicorn
import sys
import os
from config import settings

def main():
    """Start the FastAPI server"""
    print("🚀 Starting AI Wallpaper Generator Backend...")
    print(f"📡 Server will be available at: http://{settings.api_host}:{settings.api_port}")
    print(f"📖 API Documentation: http://{settings.api_host}:{settings.api_port}/docs")
    print(f"🔧 Debug mode: {settings.debug}")
    print("-" * 50)
    
    # Ensure required directories exist
    os.makedirs(settings.generated_images_dir, exist_ok=True)
    os.makedirs("generation_status", exist_ok=True)
    os.makedirs("temp_images", exist_ok=True)
    os.makedirs("cropped_images", exist_ok=True)
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info" if settings.debug else "warning"
    )

if __name__ == "__main__":
    main()
