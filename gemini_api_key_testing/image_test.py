from google import genai
from google.genai.types import GenerateContentConfig, Modality
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
response = client.models.generate_content(
    model="gemini-2.0-flash-preview-image-generation",
    contents="you're an AI wallpaper generator, which generates wallpaper images based on the values of 2 parameters, and a description field.\n\nthe 2 parameters -\n\nGenre - Nature | Infrastructure | Still life | Sports | Cars\n\nArt style - Comics | Anime | Realistic | Hazy | Pencil\n\nHere is the image you need to generate -\n\nGenre - Infrastructure\nart style - Pencil\nDescription - A pencil sketch of the Eiffel tower if one were to stand very close to its base, looking upwards.",
    config=GenerateContentConfig(response_modalities=[Modality.TEXT, Modality.IMAGE]),
)

for part in response.candidates[0].content.parts:
    if part.text:
        print(part.text)
    elif part.inline_data:
        image = Image.open(BytesIO(part.inline_data.data))
        image.save("images/example-image.png")
