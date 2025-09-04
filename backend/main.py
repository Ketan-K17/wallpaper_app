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
from database import db_manager

app = FastAPI(title="AI Wallpaper Generator API", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    """Initialize database connection pool on startup"""
    try:
        await db_manager.init_database()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
        raise e

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

# Database storage for generation status
# generation_jobs dictionary removed - now using SQLite database

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
        
        # Store initial status in database
        await db_manager.create_generation_job(
            generation_id=generation_id,
            description=request.description,
            genre=request.genre,
            art_style=request.art_style,
            user_id=request.user_id
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
    job = await db_manager.get_job(generation_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation ID not found")
    
    return GenerationStatus(
        generation_id=job['generation_id'],
        status=job['status'],
        progress=job['progress'],
        image_url=job['image_url'],
        error_message=job['error_message'],
        created_at=job['created_at'] if isinstance(job['created_at'], datetime) else datetime.fromisoformat(job['created_at']),
        completed_at=job['completed_at'] if isinstance(job['completed_at'], datetime) else datetime.fromisoformat(job['completed_at']) if job['completed_at'] else None
    )

@app.get("/download/{generation_id}")
async def download_wallpaper(generation_id: str):
    """
    Download the generated wallpaper
    """
    job = await db_manager.get_job(generation_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation ID not found")
    
    if job['status'] != "completed" or not job['image_url']:
        raise HTTPException(status_code=400, detail="Wallpaper not ready for download")
    
    # Extract filename from URL
    filename = job['image_url'].split("/")[-1]
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
    jobs = await db_manager.get_recent_jobs(limit=limit, status="completed")
    
    # Convert to response format
    recent_jobs = []
    for job in jobs:
        if job['image_url']:  # Only include jobs with images
            recent_jobs.append({
                "generation_id": job['generation_id'],
                "status": job['status'],
                "image_url": job['image_url'],
                "created_at": job['created_at'],
                "completed_at": job['completed_at']
            })
    
    return recent_jobs

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
        await db_manager.update_job_status(generation_id, "processing", progress=10)
        
        # Prepare generation parameters
        generation_params = {
            "description": description,
            "genre": genre,
            "art_style": art_style,
            "user_id": user_id,
            "generation_id": generation_id
        }
        
        # Update progress
        await db_manager.update_job_status(generation_id, "processing", progress=30)
        
        # Create a sync wrapper for the async progress callback
        def progress_callback_sync(progress):
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # If we're in an async context, schedule the coroutine
                    asyncio.create_task(update_progress(generation_id, progress))
                else:
                    # If not, run it directly
                    loop.run_until_complete(update_progress(generation_id, progress))
            except Exception as e:
                print(f"Error updating progress: {e}")
        
        # Call your AI generation function
        # This is where your Python AI code will be executed
        result = await ai_generator.generate_wallpaper(
            generation_params,
            progress_callback=progress_callback_sync
        )
        
        if result["success"]:
            # Save the generated image
            image_filename = f"{generation_id}.png"
            image_path = os.path.join("generated_images", image_filename)
            
            # The AI generator should save the image and return the path
            if "image_path" in result:
                # Update job status to completed
                update_success = await db_manager.update_job_status(
                    generation_id, 
                    "completed", 
                    progress=100, 
                    image_url=f"/images/{image_filename}"
                )
                if update_success:
                    print(f"✅ Generation completed successfully: {generation_id}")
                else:
                    print(f"⚠️ Generation completed but database update failed: {generation_id}")
            else:
                raise Exception("AI generator did not return image path")
        else:
            raise Exception(result.get("error", "Unknown error during generation"))
            
    except Exception as e:
        # Update status to failed
        await db_manager.update_job_status(
            generation_id, 
            "failed", 
            error_message=str(e)
        )
        print(f"Generation failed for {generation_id}: {str(e)}")

async def update_progress(generation_id: str, progress: int):
    """
    Callback function to update generation progress
    """
    # If progress is 100%, mark as completed
    status = "completed" if progress >= 100 else "processing"
    await db_manager.update_job_status(generation_id, status, progress=progress)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
