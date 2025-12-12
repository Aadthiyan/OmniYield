#!/bin/bash
# Quick Deployment Setup Script
# This script automates the initial setup for Render & Vercel deployment

set -e

echo "========================================="
echo "DeFi Yield Aggregator - Deployment Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git not found. Please install Git${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python 3 found: $(python3 --version)${NC}"
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
echo -e "${GREEN}✓ Git found: $(git --version)${NC}"
echo ""

# Backend setup
echo "========================================="
echo "Setting up BACKEND"
echo "========================================="

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check for Procfile
if [ ! -f "Procfile" ]; then
    echo -e "${YELLOW}⚠ Procfile not found. Creating...${NC}"
    cat > Procfile << 'EOF'
web: gunicorn backend.app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000}
EOF
    echo -e "${GREEN}✓ Procfile created${NC}"
fi

# Check for runtime.txt
if [ ! -f "runtime.txt" ]; then
    echo -e "${YELLOW}⚠ runtime.txt not found. Creating...${NC}"
    echo "python-3.11.7" > runtime.txt
    echo -e "${GREEN}✓ runtime.txt created${NC}"
fi

echo ""

# Frontend setup
echo "========================================="
echo "Setting up FRONTEND"
echo "========================================="

cd ../frontend

echo "Installing Node dependencies..."
npm install --legacy-peer-deps
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Test build
echo "Testing build..."
if npm run build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed. Check errors above.${NC}"
    exit 1
fi

echo ""

# Environment setup
echo "========================================="
echo "Environment Configuration"
echo "========================================="

if [ ! -f "../.env" ]; then
    echo "Creating .env file from template..."
    cp ../.env.example ../.env
    echo -e "${YELLOW}⚠ .env file created. You MUST edit it with your values!${NC}"
    echo ""
    echo "Edit ${PWD}/../.env with:"
    echo "  - DATABASE_URL: Your PostgreSQL connection string"
    echo "  - REDIS_URL: Your Redis connection string"
    echo "  - SECRET_KEY: Generated secret (use secrets.token_urlsafe())"
    echo "  - JWT_SECRET_KEY: Generated JWT secret"
    echo "  - Other configuration values"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo ""

# Display next steps
echo "========================================="
echo "Next Steps"
echo "========================================="
echo ""
echo "1. EDIT THE ENVIRONMENT FILE:"
echo "   - Open .env and fill in all required values"
echo "   - Generate secrets: python3 -c \"import secrets; print(secrets.token_urlsafe(32))\""
echo ""
echo "2. TEST LOCALLY:"
echo "   Backend:  cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo "3. DEPLOY TO RENDER:"
echo "   - Create account at render.com"
echo "   - Create PostgreSQL database"
echo "   - Create Redis cache"
echo "   - Connect GitHub repository and deploy"
echo "   - Set environment variables"
echo ""
echo "4. DEPLOY TO VERCEL:"
echo "   - Create account at vercel.com"
echo "   - Connect GitHub repository"
echo "   - Set NEXT_PUBLIC_API_URL to your Render backend URL"
echo "   - Deploy"
echo ""
echo "5. FULL GUIDE:"
echo "   - Read DEPLOYMENT_GUIDE.md for detailed instructions"
echo "   - Use DEPLOYMENT_CHECKLIST.md to verify setup"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
