#!/bin/bash

# Portfolio Volatility MVP - Development Startup Script
# This script starts both the Next.js frontend and FastAPI backend concurrently

echo "🚀 Starting Portfolio Volatility MVP Development Environment..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if virtual environment exists and activate it
if [ -d "venv" ]; then
    echo "🐍 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Please run: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use. Next.js will automatically use the next available port."
fi

echo ""
echo "🔧 Starting backend server (FastAPI) on http://localhost:8000..."
echo "🔧 Starting frontend server (Next.js) on http://localhost:3000..."
echo ""
echo "📊 Backend API docs: http://localhost:8000/docs"
echo "🌐 Frontend app: http://localhost:3000 (or next available port)"
echo ""
echo "⚡ Press CTRL+C to stop both servers"
echo ""

# Start backend in background
python run.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait
