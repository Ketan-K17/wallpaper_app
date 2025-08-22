import os
from dotenv import load_dotenv
from google import genai

# Load environment variables from .env
load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')

# Initialize Gemini client with API key
client = genai.Client(api_key=api_key)

# Make an API call
response = client.models.generate_content(
    model='gemini-2.5-pro',  # or 'gemini-2.5-flash'
    contents='Hello from Gemini API!'
)

print(response)
