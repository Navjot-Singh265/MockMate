#!/bin/bash

echo "🚀 Setting up MockMate RAG Service..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Install from python.org"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies (this takes 2-3 minutes first time)..."
pip install -r requirements.txt

# Copy .env if not exists
if [ ! -f .env ]; then
    cp ../.env.example .env 2>/dev/null || echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env
    echo "⚠️  Add your ANTHROPIC_API_KEY to rag-service/.env"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the RAG service:"
echo "  cd rag-service"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "RAG service runs on http://localhost:8000"
