#!/bin/bash
# Setup script for AI Wallpaper Generator Backend

echo "🎨 Setting up AI Wallpaper Generator Backend..."

# Navigate to backend directory
cd backend

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Python3 found: $(python3 --version)"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Backend setup complete!"
echo ""
echo "🚀 To start the server:"
echo "1. cd backend"
echo "2. source venv/bin/activate"
echo "3. python start_server.py"
echo ""
echo "📖 API docs will be available at: http://localhost:8000/docs"
echo ""
echo "🧪 To implement your AI code:"
echo "1. Edit backend/ai_generator.py"
echo "2. Replace the _generate_with_ai method with your AI implementation"
echo "3. Add any required AI libraries to requirements.txt"
