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
import base64

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
            self.model_name = "gemini-2.5-flash-image-preview"
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
        Generate wallpaper using two-step Google Gemini API process:
        1. Generate initial image from prompt
        2. Crop to 9:16 aspect ratio and refine with second API call
        """
        
        # Check if Gemini API is properly initialized
        if not self.model_loaded:
            raise Exception("Gemini API not initialized. Please check your GEMINI_API_KEY.")
        
        try:
            # STEP 1: Generate initial temp image
            if progress_callback:
                progress_callback(30)
            
            # Build the content prompt using frontend parameters
            content_prompt = self._build_gemini_prompt(description, genre, art_style)
            
            print(f"🎨 Step 1: Sending initial request to Gemini API...")
            print(f"📝 Prompt: {content_prompt}")
            
            if progress_callback:
                progress_callback(40)
            
            # Generate initial image using Gemini API
            response1 = self.client.models.generate_content(
                model=self.model_name,
                contents=content_prompt,
                config=GenerateContentConfig(response_modalities=[Modality.TEXT, Modality.IMAGE]),
            )
            
            if progress_callback:
                progress_callback(50)
            
            # Extract temp image from response
            temp_image = None
            initial_response_text = None
            
            for part in response1.candidates[0].content.parts:
                if part.text:
                    initial_response_text = part.text
                    print(f"💬 Initial Gemini response: {initial_response_text}")
                elif part.inline_data:
                    # Convert the binary data to PIL Image
                    temp_image = Image.open(BytesIO(part.inline_data.data))
                    print("🖼️ Initial temp image generated successfully!")
            
            if not temp_image:
                raise Exception("No initial image was generated by Gemini API")
            
            # Save temp image
            temp_image_path = await self._save_temp_image(temp_image, generation_id)
            
            if progress_callback:
                progress_callback(60)
            
            # STEP 2: Crop to 9:16 and refine
            print(f"🔄 Step 2: Cropping to 9:16 aspect ratio...")
            cropped_image = self._crop_to_smartphone_portrait(temp_image)
            
            # Save cropped image before second LLM call
            cropped_image_path = await self._save_cropped_image(cropped_image, generation_id)
            
            if progress_callback:
                progress_callback(70)
            
            # Prepare refinement prompt and image for second API call
            refinement_prompt = "Edit this image such that it perfectly fits the aspect ratio it came in. Make sure to not tamper with the aspect ratio. if there is a subject in the image, make sure that the entire subject fits perfectly inside the image. Keep in mind that you're creating a smartphone wallpaper."
            
            # Convert cropped image to format suitable for Gemini API
            image_buffer = BytesIO()
            cropped_image.save(image_buffer, format='PNG')
            image_data = image_buffer.getvalue()
            
            print(f"🎨 Step 2: Sending refinement request to Gemini API...")
            print(f"📝 Refinement prompt: {refinement_prompt}")
            
            if progress_callback:
                progress_callback(80)
            
            # Second Gemini API call with the cropped image
            response2 = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    refinement_prompt,
                    {"inline_data": {"mime_type": "image/png", "data": image_data}}
                ],
                config=GenerateContentConfig(response_modalities=[Modality.TEXT, Modality.IMAGE]),
            )
            
            if progress_callback:
                progress_callback(85)
            
            # Extract refined image from response
            refined_image = None
            refined_response_text = None
            
            for part in response2.candidates[0].content.parts:
                if part.text:
                    refined_response_text = part.text
                    print(f"💬 Refined Gemini response: {refined_response_text}")
                elif part.inline_data:
                    # Convert the binary data to PIL Image
                    refined_image = Image.open(BytesIO(part.inline_data.data))
                    print("🖼️ Refined image generated successfully!")
            
            if not refined_image:
                raise Exception("No refined image was generated by Gemini API")
            
            if progress_callback:
                progress_callback(90)
            
            # Save the final refined image
            image_path = await self._save_image(refined_image, generation_id)
            
            if progress_callback:
                progress_callback(100)
            
            return {
                "success": True,
                "image_path": image_path,
                "generation_params": {
                    "description": description,
                    "genre": genre,
                    "art_style": art_style,
                    "initial_response": initial_response_text,
                    "refined_response": refined_response_text,
                    "temp_image_path": temp_image_path,
                    "cropped_image_path": cropped_image_path
                }
            }
            
        except Exception as e:
            print(f"❌ Two-step AI generation failed: {str(e)}")
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
            "Persona: You are an AI smartphone wallpaper generator, which generates smartphone wallpapers based on the values of 2 parameters, and a description field.\n\nThe 2 parameters -\nGenre - Nature | Infrastructure | Still life | Sports | Cars\nArt style - Comics | Anime | Realistic | Hazy | Pencil\n\n\nImage creation payload: \naspect_ratio: 9:16\ntext: None (never include text in image)\n"
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
    
    async def _save_temp_image(self, image: Image.Image, generation_id: str) -> str:
        """
        Save the temporary image to temp_images directory.
        """
        # Ensure the directory exists
        os.makedirs("temp_images", exist_ok=True)
        
        # Create filename
        filename = f"{generation_id}_temp.png"
        file_path = os.path.join("temp_images", filename)
        
        # Save image
        image.save(file_path, "PNG", quality=95)
        
        print(f"💾 Temp image saved: {file_path}")
        return file_path
    
    async def _save_cropped_image(self, image: Image.Image, generation_id: str) -> str:
        """
        Save the cropped image to cropped_images directory.
        """
        # Ensure the directory exists
        os.makedirs("cropped_images", exist_ok=True)
        
        # Create filename
        filename = f"{generation_id}_cropped.png"
        file_path = os.path.join("cropped_images", filename)
        
        # Save image
        image.save(file_path, "PNG", quality=95)
        
        print(f"💾 Cropped image saved: {file_path}")
        return file_path
    
    def _crop_to_smartphone_portrait(self, image: Image.Image) -> Image.Image:
        """
        Crop image to 9:16 aspect ratio from the center.
        The 9:16 portion occupies the full height and takes the center horizontally.
        """
        width, height = image.size
        
        # Calculate the target width for 9:16 aspect ratio based on current height
        target_width = int(height * 9 / 16)
        
        # If the image is already narrower than the target, we'll use the full width
        if width <= target_width:
            return image
        
        # Calculate the left and right bounds for cropping (center the crop)
        left = (width - target_width) // 2
        right = left + target_width
        
        # Crop the image (left, top, right, bottom)
        cropped = image.crop((left, 0, right, height))
        
        print(f"🔄 Cropped image from {width}x{height} to {cropped.size[0]}x{cropped.size[1]} (9:16 ratio)")
        return cropped
    
    def _image_to_base64(self, image: Image.Image) -> str:
        """
        Convert PIL Image to base64 string for Gemini API.
        """
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)
        return base64.b64encode(buffer.getvalue()).decode()
    
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
