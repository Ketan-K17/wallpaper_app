from google import genai
from google.genai.types import GenerateImagesConfig

client = genai.Client(
    vertexai=True,
    project="ai-wallpaper-lava",
    location="us-central1"
)

image = client.models.generate_images(
    model="imagen-4.0-generate-001",
    prompt="a front-facing image of a porsche 911 turbo.",
    config=GenerateImagesConfig(
        image_size="2K",
        aspect_ratio="9:16",  # This enforces portrait mode
    ),
)

output_file = "output-image.png"
image.generated_images[0].image.save(output_file)
print(f"Created output image using {len(image.generated_images[0].image.image_bytes)} bytes")