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
from google.genai.types import GenerateContentConfig, Modality
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

class AIWallpaperGenerator:
    def __init__(self):
        """
        Initialize the AI generator with Google Gemini API.
        """
        self.model_loaded = False
        print("🤖 AI Wallpaper Generator initialized")
        
        # Initialize Google Gemini client
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set")
            
            self.client = genai.Client(api_key=api_key)
            self.model_name = "gemini-2.0-flash-preview-image-generation"
            self.model_loaded = True
            print("✅ Google Gemini API client initialized successfully")
            
        except Exception as e:
            print(f"❌ Failed to initialize Gemini API: {str(e)}")
            print("💡 Make sure to set GEMINI_API_KEY in your .env file")
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
        Generate wallpaper using Google Gemini API with parameters from frontend.
        """
        
        # Check if Gemini API is properly initialized
        if not self.model_loaded:
            raise Exception("Gemini API not initialized. Please check your GEMINI_API_KEY.")
        
        try:
            # Update progress - preparing request
            if progress_callback:
                progress_callback(50)
            
            # Build the content prompt using frontend parameters
            content_prompt = self._build_gemini_prompt(description, genre, art_style)
            
            print(f"🎨 Sending request to Gemini API...")
            print(f"📝 Prompt: {content_prompt}")
            
            # Update progress - sending to API
            if progress_callback:
                progress_callback(60)
            
            # Generate image using Gemini API
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=content_prompt,
                config=GenerateContentConfig(response_modalities=[Modality.TEXT, Modality.IMAGE]),
            )
            
            # Update progress - processing response
            if progress_callback:
                progress_callback(80)
            
            # Extract image from response
            image = None
            generated_text = None
            
            for part in response.candidates[0].content.parts:
                if part.text:
                    generated_text = part.text
                    print(f"💬 Gemini response: {generated_text}")
                elif part.inline_data:
                    # Convert the binary data to PIL Image
                    image = Image.open(BytesIO(part.inline_data.data))
                    print("🖼️ Image generated successfully!")
            
            if not image:
                raise Exception("No image was generated by Gemini API")
            
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
                    "art_style": art_style,
                    "gemini_response": generated_text
                }
            }
            
        except Exception as e:
            print(f"❌ Gemini API generation failed: {str(e)}")
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
    
    def _build_gemini_prompt(self, description: str, genre: Optional[str], art_style: Optional[str]) -> str:
        """
        Build the Gemini-specific prompt using frontend parameters.
        This formats the prompt exactly as needed for the Gemini API.
        """
        base_prompt = (
            "You're an AI wallpaper generator, which generates wallpaper images based on the values of 2 parameters, and a description field.\n\n"
            "The 2 parameters -\n\n"
            "Genre - Nature | Infrastructure | Still life | Sports | Cars\n\n" 
            "Art style - Comics | Anime | Realistic | Hazy | Pencil\n\n"
            "You MUST follow these guidelines while creating the image. 1. Note that you must ALWAYS be in 9:16 aspect ratio, because it is to be used as a smartphone wallpaper. 2. Never include text in your image."
            "Here is the image you need to generate -\n\n"
        )
        
        # Format the parameters from frontend
        genre_str = genre if genre else "Any"
        art_style_str = art_style if art_style else "Realistic"
        
        generation_request = (f"Genre - {genre_str}\n"
                             f"Art style - {art_style_str}\n"
                             f"Description - {description}")
        
        full_prompt = base_prompt + generation_request
        
        return full_prompt
    

    
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
        image.save(file_path, "PNG", quality=95)
        
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
