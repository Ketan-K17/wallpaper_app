from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import asyncio
from datetime import datetime
import json

from ai_generator import AIWallpaperGenerator

app = FastAPI(title="AI Wallpaper Generator API", version="1.0.0")

# Configure CORS for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for storing generated images and metadata
os.makedirs("generated_images", exist_ok=True)
os.makedirs("generation_status", exist_ok=True)

# Mount static files for serving generated images
app.mount("/images", StaticFiles(directory="generated_images"), name="images")

# Initialize AI generator
ai_generator = AIWallpaperGenerator()

class GenerationRequest(BaseModel):
    description: str
    genre: Optional[str] = None
    art_style: Optional[str] = None
    user_id: Optional[str] = None

class GenerationResponse(BaseModel):
    generation_id: str
    status: str
    message: str

class GenerationStatus(BaseModel):
    generation_id: str
    status: str  # "pending", "processing", "completed", "failed"
    progress: int  # 0-100
    image_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

# In-memory storage for generation status (in production, use Redis or database)
generation_jobs = {}

@app.get("/")
async def root():
    return {"message": "AI Wallpaper Generator API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/generate", response_model=GenerationResponse)
async def generate_wallpaper(request: GenerationRequest, background_tasks: BackgroundTasks):
    """
    Start AI wallpaper generation process
    """
    try:
        # Generate unique ID for this generation request
        generation_id = str(uuid.uuid4())
        
        # Store initial status
        generation_jobs[generation_id] = GenerationStatus(
            generation_id=generation_id,
            status="pending",
            progress=0,
            created_at=datetime.now()
        )
        
        # Start background generation task
        background_tasks.add_task(
            generate_wallpaper_task,
            generation_id,
            request.description,
            request.genre,
            request.art_style,
            request.user_id
        )
        
        return GenerationResponse(
            generation_id=generation_id,
            status="pending",
            message="Wallpaper generation started"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start generation: {str(e)}")

@app.get("/status/{generation_id}", response_model=GenerationStatus)
async def get_generation_status(generation_id: str):
    """
    Get the status of a wallpaper generation request
    """
    if generation_id not in generation_jobs:
        raise HTTPException(status_code=404, detail="Generation ID not found")
    
    return generation_jobs[generation_id]

@app.get("/download/{generation_id}")
async def download_wallpaper(generation_id: str):
    """
    Download the generated wallpaper
    """
    if generation_id not in generation_jobs:
        raise HTTPException(status_code=404, detail="Generation ID not found")
    
    job = generation_jobs[generation_id]
    
    if job.status != "completed" or not job.image_url:
        raise HTTPException(status_code=400, detail="Wallpaper not ready for download")
    
    # Extract filename from URL
    filename = job.image_url.split("/")[-1]
    file_path = os.path.join("generated_images", filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Generated image file not found")
    
    return FileResponse(
        file_path,
        media_type="image/png",
        filename=f"wallpaper_{generation_id}.png"
    )

@app.get("/recent")
async def get_recent_generations(limit: int = 10):
    """
    Get recent completed generations for showcase
    """
    completed_jobs = [
        job for job in generation_jobs.values() 
        if job.status == "completed" and job.image_url
    ]
    
    # Sort by completion time, most recent first
    completed_jobs.sort(key=lambda x: x.completed_at or x.created_at, reverse=True)
    
    return completed_jobs[:limit]

async def generate_wallpaper_task(
    generation_id: str,
    description: str,
    genre: Optional[str],
    art_style: Optional[str],
    user_id: Optional[str]
):
    """
    Background task to generate wallpaper using AI
    """
    try:
        # Update status to processing
        generation_jobs[generation_id].status = "processing"
        generation_jobs[generation_id].progress = 10
        
        # Prepare generation parameters
        generation_params = {
            "description": description,
            "genre": genre,
            "art_style": art_style,
            "user_id": user_id,
            "generation_id": generation_id
        }
        
        # Update progress
        generation_jobs[generation_id].progress = 30
        
        # Call your AI generation function
        # This is where your Python AI code will be executed
        result = await ai_generator.generate_wallpaper(
            generation_params,
            progress_callback=lambda p: update_progress(generation_id, p)
        )
        
        if result["success"]:
            # Save the generated image
            image_filename = f"{generation_id}.png"
            image_path = os.path.join("generated_images", image_filename)
            
            # The AI generator should save the image and return the path
            if "image_path" in result:
                # Update job status
                generation_jobs[generation_id].status = "completed"
                generation_jobs[generation_id].progress = 100
                generation_jobs[generation_id].image_url = f"/images/{image_filename}"
                generation_jobs[generation_id].completed_at = datetime.now()
            else:
                raise Exception("AI generator did not return image path")
        else:
            raise Exception(result.get("error", "Unknown error during generation"))
            
    except Exception as e:
        # Update status to failed
        generation_jobs[generation_id].status = "failed"
        generation_jobs[generation_id].error_message = str(e)
        generation_jobs[generation_id].completed_at = datetime.now()
        print(f"Generation failed for {generation_id}: {str(e)}")

def update_progress(generation_id: str, progress: int):
    """
    Callback function to update generation progress
    """
    if generation_id in generation_jobs:
        generation_jobs[generation_id].progress = min(progress, 99)  # Keep 100 for completion

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
