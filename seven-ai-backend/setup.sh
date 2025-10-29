#!/bin/bash
# Seven AI Backend Setup Script

echo "╔══════════════════════════════════════════════╗"
echo "║     🤖 SEVEN AI BACKEND SETUP 🤖            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment
echo ""
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate
echo "✓ Virtual environment created"

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  Please edit .env and add your API keys!"
fi

# Create data directory
mkdir -p data
echo "✓ Data directory created"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          🎉 SETUP COMPLETE! 🎉              ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Next steps:                                 ║"
echo "║  1. Edit .env file with your API keys        ║"
echo "║  2. Run: source venv/bin/activate            ║"
echo "║  3. Run: python main.py                      ║"
echo "║  4. Optional: ngrok http 5000                ║"
echo "╚══════════════════════════════════════════════╝"







