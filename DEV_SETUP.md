# Development Setup

## Quick Start Commands

### Option 1: Shell Script (Recommended)
```bash
# Make sure you have the virtual environment set up first
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run both servers
./start_dev.sh
```

### Option 2: NPM Scripts
```bash
# Install all dependencies
npm install
npm run install:all

# Run both servers
npm run dev
```

### Option 3: Manual (Separate Terminals)
```bash
# Terminal 1 - Backend
source venv/bin/activate
python run.py

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## What Gets Started

- **Backend (FastAPI)**: http://localhost:8000
  - API Documentation: http://localhost:8000/docs
  - Health Check: http://localhost:8000/

- **Frontend (Next.js)**: http://localhost:3000
  - Main Application: http://localhost:3000

## Stopping the Servers

- **Shell Script**: Press `Ctrl+C` to stop both servers
- **NPM Scripts**: Press `Ctrl+C` to stop both servers  
- **Manual**: Press `Ctrl+C` in each terminal

## Troubleshooting

### Virtual Environment Issues
```bash
# Create new virtual environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Dependencies
```bash
cd frontend
npm install
```

### Port Conflicts
- Backend uses port 8000
- Frontend uses port 3000
- If ports are in use, modify the respective config files
