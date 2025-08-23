# AI Wallpaper Generator Backend

This is the Python backend for the AI Wallpaper Generator app. It provides RESTful API endpoints for generating custom wallpapers using AI.

## Quick Start

### 1. Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

Create your environment file and configure your settings:
```bash
cp env_example.txt .env
```

Edit `.env` with your Google Gemini API key:
```bash
# Required: Get your API key from https://ai.google.dev/
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**🔑 Getting your Gemini API Key:**
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and paste it in your `.env` file

### 3. Run the Server

```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Interactive API docs**: `http://localhost:8000/docs`
- **Alternative docs**: `http://localhost:8000/redoc`

## API Endpoints

### POST `/generate`
Start a new wallpaper generation

**Request Body:**
```json
{
  "description": "A serene mountain landscape at sunset",
  "genre": "Nature",
  "art_style": "Realistic",
  "user_id": "optional_user_id"
}
```

**Response:**
```json
{
  "generation_id": "uuid-string",
  "status": "pending",
  "message": "Wallpaper generation started"
}
```

### GET `/status/{generation_id}`
Check generation progress

**Response:**
```json
{
  "generation_id": "uuid-string",
  "status": "completed",
  "progress": 100,
  "image_url": "/images/uuid-string.png",
  "created_at": "2024-01-01T12:00:00",
  "completed_at": "2024-01-01T12:02:30"
}
```

### GET `/download/{generation_id}`
Download the generated wallpaper

Returns the image file directly.

### GET `/recent`
Get recent completed generations

## AI Implementation - Google Gemini

### ✅ AI Integration Complete!

The backend is now fully integrated with **Google Gemini API** for AI wallpaper generation! 

**How it works:**
1. **Frontend sends parameters**: Genre, Art Style, Description
2. **Backend formats prompt**: Uses your exact prompt format from the test
3. **Gemini generates image**: High-quality wallpaper based on parameters
4. **Real-time progress**: Frontend shows generation progress
5. **Image saved & served**: Ready for download/display

### Current Implementation

The `_generate_with_ai` method now:
- ✅ Uses Google Gemini 2.0 Flash Preview (Image Generation)
- ✅ Formats prompts with frontend parameters  
- ✅ Handles image generation and saving
- ✅ Provides real-time progress updates
- ✅ Error handling and logging

### Prompt Format

Your frontend parameters are automatically formatted like this:
```
you're an AI wallpaper generator, which generates wallpaper images based on the values of 2 parameters, and a description field.

the 2 parameters -

Genre - Nature | Infrastructure | Still life | Sports | Cars

Art style - Comics | Anime | Realistic | Hazy | Pencil

Here is the image you need to generate -

Genre - [FROM_FRONTEND]
Art style - [FROM_FRONTEND]  
Description - [FROM_FRONTEND]
```

### Common AI Integration Examples

#### 1. Stable Diffusion (Hugging Face Diffusers)

```bash
pip install diffusers transformers accelerate torch torchvision
```

```python
from diffusers import StableDiffusionPipeline
import torch

# In __init__:
self.pipeline = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
)
self.pipeline = self.pipeline.to("cuda")

# In _generate_with_ai:
image = self.pipeline(
    prompt=prompt,
    width=1080,
    height=1920,
    num_inference_steps=50,
    guidance_scale=7.5
).images[0]
```

#### 2. OpenAI DALL-E

```bash
pip install openai
```

```python
import openai
from PIL import Image
import requests
from io import BytesIO

# Set your API key in config.py or .env
openai.api_key = settings.openai_api_key

# In _generate_with_ai:
response = openai.Image.create(
    prompt=prompt,
    n=1,
    size="1024x1024"
)
image_url = response['data'][0]['url']

# Download and convert to PIL Image
response = requests.get(image_url)
image = Image.open(BytesIO(response.content))
```

#### 3. Custom Model Integration

```python
# Load your custom model in __init__:
self.model = load_your_custom_model()

# Use in _generate_with_ai:
image = self.model.generate(
    text=prompt,
    style=art_style,
    category=genre,
    width=1080,
    height=1920
)
```

## Project Structure

```
backend/
├── main.py              # FastAPI application and routes
├── ai_generator.py      # AI generation logic (YOUR CODE HERE)
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
├── generated_images/    # Generated wallpapers storage
├── models/             # AI model cache directory
└── README.md           # This file
```

## Development Tips

1. **Progress Updates**: Use the `progress_callback` function to update generation progress
2. **Error Handling**: Wrap your AI code in try-catch blocks
3. **Performance**: Consider using async/await for I/O operations
4. **Memory Management**: Clear GPU memory between generations if needed
5. **Logging**: Add logging to debug generation issues

## Testing

Test the API using curl or the interactive docs:

```bash
# Start generation
curl -X POST "http://localhost:8000/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A beautiful sunset over mountains",
    "genre": "Nature",
    "art_style": "Realistic"
  }'

# Check status
curl "http://localhost:8000/status/YOUR_GENERATION_ID"

# Download result
curl "http://localhost:8000/download/YOUR_GENERATION_ID" -o wallpaper.png
```

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in your environment
2. Use a production ASGI server like Gunicorn
3. Set up proper CORS origins
4. Implement rate limiting
5. Use a database for job persistence
6. Set up file storage (AWS S3, etc.)
7. Implement authentication if needed

```bash
# Production server example
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
