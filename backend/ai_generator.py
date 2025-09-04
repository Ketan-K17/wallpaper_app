"""
AI Wallpaper Generator Module

This is where you'll implement your Python AI generation logic.
The module provides a clean interface for the FastAPI backend to call.
"""

import asyncio
import os
import time
from typing import Dict, Any, Optional, Callable
from datetime import datetime
import uuid
from PIL import Image, ImageDraw, ImageFont
import random

from google import genai
from google.genai.types import GenerateImagesConfig
from google.oauth2 import service_account
from io import BytesIO
import json
from dotenv import load_dotenv

load_dotenv()

class AIWallpaperGenerator:
    def __init__(self):
        """
        Initialize the AI generator with Vertex AI Imagen.
        """
        self.model_loaded = False
        print("🤖 AI Wallpaper Generator initialized")
        
        # Initialize Vertex AI Imagen client
        try:
            project_id = os.getenv("VERTEX_PROJECT_ID", "ai-wallpaper-lava")
            location = os.getenv("VERTEX_LOCATION", "us-central1")
            
            # Get credentials from environment variable
            credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
            if credentials_json and credentials_json.startswith('{'): # Check if it's a JSON string
                # Parse JSON string directly
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
            else:
                # Fallback to file-based credentials if not JSON string
                credentials = service_account.Credentials.from_service_account_file(credentials_json)
                
            self.client = genai.Client(
                credentials=credentials,
                project=project_id,
                location=location
            )
            self.model_name = "imagen-4.0-generate-001"
            self.model_loaded = True
            print("✅ Vertex AI Imagen client initialized successfully")
            
        except Exception as e:
            print(f"❌ Failed to initialize Vertex AI Imagen: {str(e)}")
            print("💡 Make sure your Google Cloud credentials are configured")
            self.model_loaded = False
        
    async def generate_wallpaper(
        self, 
        params: Dict[str, Any], 
        progress_callback: Optional[Callable[[int], None]] = None
    ) -> Dict[str, Any]:
        """
        Main method to generate wallpaper based on parameters.
        
        Args:
            params: Dictionary containing:
                - description (str): User's text description
                - genre (str, optional): Nature, Infrastructure, Still life, Sports, Cars
                - art_style (str, optional): Comics, Anime, Realistic, Hazy, Pencil
                - user_id (str, optional): User identifier
                - generation_id (str): Unique generation ID
            progress_callback: Function to call with progress updates (0-100)
        
        Returns:
            Dict with 'success' (bool), 'image_path' (str), and optionally 'error' (str)
        """
        try:
            generation_id = params["generation_id"]
            description = params["description"]
            genre = params.get("genre")
            art_style = params.get("art_style")
            
            print(f"🎨 Starting generation for: {description}")
            print(f"📝 Parameters: Genre={genre}, Art Style={art_style}")
            
            # Update progress
            if progress_callback:
                progress_callback(40)
            
            # TODO: Replace this placeholder with your actual AI generation code
            result = await self._generate_with_ai(
                description=description,
                genre=genre,
                art_style=art_style,
                generation_id=generation_id,
                progress_callback=progress_callback
            )
            
            return result
            
        except Exception as e:
            print(f"❌ Error during generation: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _generate_with_ai(
        self,
        description: str,
        genre: Optional[str],
        art_style: Optional[str],
        generation_id: str,
        progress_callback: Optional[Callable[[int], None]] = None
    ) -> Dict[str, Any]:
        """
        Generate wallpaper using Vertex AI Imagen with parameters from frontend.
        """
        
        # Check if Vertex AI Imagen is properly initialized
        if not self.model_loaded:
            raise Exception("Vertex AI Imagen not initialized. Please check your Google Cloud credentials.")
        
        try:
            # Update progress - preparing request
            if progress_callback:
                progress_callback(50)
            
            # Build the content prompt using frontend parameters
            content_prompt = self._build_imagen_prompt(description, genre, art_style)
            
            print(f"🎨 Sending request to Vertex AI Imagen...")
            print(f"📝 Prompt: {content_prompt}")
            
            # Update progress - sending to API
            if progress_callback:
                progress_callback(60)
            
            # Generate image using Vertex AI Imagen
            response = self.client.models.generate_images(
                model=self.model_name,
                prompt=content_prompt,
                config=GenerateImagesConfig(
                    aspect_ratio="9:16",  # Portrait mode for mobile wallpapers
                ),
            )
            
            # Update progress - processing response
            if progress_callback:
                progress_callback(80)
            
            # Extract image from response
            if not response.generated_images or len(response.generated_images) == 0:
                raise Exception("No image was generated by Vertex AI Imagen")
            
            image = response.generated_images[0].image
            print("🖼️ Image generated successfully!")
            
            # Update progress - saving image
            if progress_callback:
                progress_callback(90)
            
            # Save the generated image
            image_path = await self._save_image(image, generation_id)
            
            if progress_callback:
                progress_callback(100)
            
            return {
                "success": True,
                "image_path": image_path,
                "generation_params": {
                    "description": description,
                    "genre": genre,
                    "art_style": art_style
                }
            }
            
        except Exception as e:
            print(f"❌ Vertex AI Imagen generation failed: {str(e)}")
            raise Exception(f"AI generation failed: {str(e)}")
    
    def _build_prompt(self, description: str, genre: Optional[str], art_style: Optional[str]) -> str:
        """
        Build the AI prompt from user inputs.
        Customize this based on your AI model's prompt requirements.
        """
        prompt_parts = [description]
        
        # Add genre context
        if genre:
            genre_prompts = {
                "Nature": "natural landscape, outdoor scenery, organic elements",
                "Infrastructure": "architectural, urban environment, buildings and structures", 
                "Still life": "still life composition, objects arrangement, indoor setting",
                "Sports": "dynamic sports scene, athletic activity, motion and energy",
                "Cars": "automotive, vehicles, transportation, sleek design"
            }
            if genre in genre_prompts:
                prompt_parts.append(genre_prompts[genre])
        
        # Add art style context
        if art_style:
            style_prompts = {
                "Comics": "comic book style, bold lines, vibrant colors, graphic novel aesthetic",
                "Anime": "anime art style, manga influence, cel-shading, Japanese animation",
                "Realistic": "photorealistic, high detail, natural lighting, lifelike",
                "Hazy": "soft focus, dreamy atmosphere, muted colors, ethereal mood",
                "Pencil": "pencil drawing, sketch style, grayscale, hand-drawn aesthetic"
            }
            if art_style in style_prompts:
                prompt_parts.append(style_prompts[art_style])
        
        # Add technical specifications for wallpapers
        prompt_parts.append("high resolution, wallpaper quality, mobile phone aspect ratio")
        
        return ", ".join(prompt_parts)
    
    def _build_imagen_prompt(self, description: str, genre: Optional[str], art_style: Optional[str]) -> str:
        """
        Build the Imagen-specific prompt using frontend parameters.
        Imagen uses simpler prompts compared to Gemini.
        """
        prompt_parts = [description]
        
        # Add genre context
        if genre:
            genre_prompts = {
                "Nature": "natural landscape, outdoor scenery, organic elements",
                "Infrastructure": "architectural, urban environment, buildings and structures", 
                "Still life": "still life composition, objects arrangement, indoor setting",
                "Sports": "dynamic sports scene, athletic activity, motion and energy",
                "Cars": "automotive, vehicles, transportation, sleek design"
            }
            if genre in genre_prompts:
                prompt_parts.append(genre_prompts[genre])
        
        # Add art style context
        if art_style:
            style_prompts = {
                "Comics": "comic book style, bold lines, vibrant colors, graphic novel aesthetic",
                "Anime": "anime art style, manga influence, cel-shading, Japanese animation",
                "Realistic": "photorealistic, high detail, natural lighting, lifelike",
                "Hazy": "soft focus, dreamy atmosphere, muted colors, ethereal mood",
                "Pencil": "pencil drawing, sketch style, grayscale, hand-drawn aesthetic"
            }
            if art_style in style_prompts:
                prompt_parts.append(style_prompts[art_style])
        
        # Add technical specifications for wallpapers
        prompt_parts.append("high resolution, mobile wallpaper, vertical orientation, no text")
        
        return ", ".join(prompt_parts)
    

    
    async def _save_image(self, image: Image.Image, generation_id: str) -> str:
        """
        Save the generated image to disk.
        """
        # Ensure the directory exists
        os.makedirs("generated_images", exist_ok=True)
        
        # Create filename
        filename = f"{generation_id}.png"
        file_path = os.path.join("generated_images", filename)
        
        # Save image
        # Convert to PIL Image if needed
        if hasattr(image, 'image_bytes'):
            # Handle Vertex AI image format
            with open(file_path, 'wb') as f:
                f.write(image.image_bytes)
        else:
            # Handle PIL Image format
            image.save(file_path, "PNG")
        
        print(f"💾 Image saved: {file_path}")
        return file_path
    
    def cleanup_old_images(self, max_age_hours: int = 24):
        """
        Clean up old generated images to save disk space.
        Call this periodically or implement as a background task.
        """
        images_dir = "generated_images"
        if not os.path.exists(images_dir):
            return
        
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for filename in os.listdir(images_dir):
            file_path = os.path.join(images_dir, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getctime(file_path)
                if file_age > max_age_seconds:
                    os.remove(file_path)
                    print(f"🗑️  Removed old image: {filename}")




def validate_generation_params(params: Dict[str, Any]) -> bool:
    """
    Validate generation parameters before processing.
    """
    required_fields = ["description", "generation_id"]
    
    for field in required_fields:
        if field not in params or not params[field]:
            return False
    
    # Validate genre options
    valid_genres = ["Nature", "Infrastructure", "Still life", "Sports", "Cars"]
    if params.get("genre") and params["genre"] not in valid_genres:
        return False
    
    # Validate art style options
    valid_styles = ["Comics", "Anime", "Realistic", "Hazy", "Pencil"]
    if params.get("art_style") and params["art_style"] not in valid_styles:
        return False
    
    return True
