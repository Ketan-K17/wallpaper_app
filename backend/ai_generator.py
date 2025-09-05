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
from database import db_manager

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
            
            # Setup credentials - handle both Railway and local environments
            credentials = self._setup_credentials()
                
            self.client = genai.Client(
                vertexai=True,  # Add this for Vertex AI
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
    
    def _setup_credentials(self):
        """
        Setup Google Cloud credentials for both Railway and local environments.
        """
        # Method 1: Check for Railway JSON environment variable
        credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if credentials_json:
            print("📝 Using GOOGLE_APPLICATION_CREDENTIALS_JSON from environment")
            try:
                credentials_info = json.loads(credentials_json)
                scopes = [
                    "https://www.googleapis.com/auth/generative-language",
                    "https://www.googleapis.com/auth/cloud-platform",
                ]
                return service_account.Credentials.from_service_account_info(credentials_info, scopes=scopes)
            except json.JSONDecodeError as e:
                print(f"❌ Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON: {e}")
                raise
        
        # Method 2: Check for file path (local development)
        credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_file and os.path.exists(credentials_file):
            print(f"📁 Using credentials file: {credentials_file}")
            scopes = [
                "https://www.googleapis.com/auth/generative-language",
                "https://www.googleapis.com/auth/cloud-platform",
            ]
            return service_account.Credentials.from_service_account_file(credentials_file, scopes=scopes)
        
        # Method 3: Try to create file from JSON for Railway compatibility
        if credentials_json:
            print("🔧 Creating temporary credentials file for Railway")
            credentials_file = "/tmp/google-credentials.json"
            with open(credentials_file, 'w') as f:
                f.write(credentials_json)
            # Set the environment variable for other libraries that might need it
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_file
            scopes = [
                "https://www.googleapis.com/auth/generative-language",
                "https://www.googleapis.com/auth/cloud-platform",
            ]
            return service_account.Credentials.from_service_account_file(credentials_file, scopes=scopes)
        
        # If nothing works, let Google libraries try default authentication
        print("⚠️ No explicit credentials found, trying default authentication")
        return None
        
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
            if not response or not response.images:
                raise Exception("No image was generated by Vertex AI Imagen")

            print("🖼️ Image generated successfully!")
            
            # Get the first image from the response
            image = response.images[0]
            
            # Convert to bytes - the image object should have a 'pil_image' attribute
            # or we might need to access the raw data differently
            image_data = None
            if hasattr(image, 'pil_image'):
                # Convert PIL Image to bytes
                img_buffer = BytesIO()
                image.pil_image.save(img_buffer, format='PNG')
                image_data = img_buffer.getvalue()
            elif hasattr(image, '_image_bytes'):
                image_data = image._image_bytes
            else:
                # Try to get the bytes directly
                image_data = bytes(image)
            
            if not image_data:
                raise Exception("Could not extract image data from Vertex AI response")
            
            # Update progress - saving image to database
            if progress_callback:
                progress_callback(90)
            
            # Save image data to database and set image_url to serve from database
            image_url = f"/image/{generation_id}"
            await db_manager.update_job_status(
                generation_id,
                "completed",
                image_url=image_url,
                image_data=image_data
            )
            
            # Update progress - completed
            if progress_callback:
                progress_callback(100)
            
            return {
                "success": True,
                "image_url": image_url,
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