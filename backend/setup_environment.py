#!/usr/bin/env python3
"""
Environment setup script for DeFi Yield Aggregator backend
"""
import os
import sys
import subprocess
import json
from pathlib import Path

def create_env_file():
    """Create .env file with default values"""
    env_content = """# DeFi Yield Aggregator Environment Configuration

# Environment
NODE_ENV=development
DEBUG=true

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/yield_aggregator
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=
REDIS_DB=0

# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_key
TESTNET_RPC_URL=https://goerli.infura.io/v3/your_key
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org

# Contract Addresses (Update after deployment)
YIELD_AGGREGATOR_ADDRESS=
BRIDGE_ADAPTER_ADDRESS=
WRAPPED_TOKEN_ADDRESS=

# QIE SDK
QIE_API_KEY=
QIE_SECRET_KEY=
QIE_NETWORK=testnet

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=DeFi Yield Aggregator
VERSION=1.0.0

# Security
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# Yield Optimization
YIELD_UPDATE_INTERVAL=300
MAX_STRATEGIES_PER_USER=10
MIN_AMOUNT_THRESHOLD=1000000000000000000
MAX_AMOUNT_THRESHOLD=1000000000000000000000

# Analytics
ENABLE_ANALYTICS=true
ANALYTICS_RETENTION_DAYS=90
METRICS_UPDATE_INTERVAL=60

# Caching
CACHE_TTL=300
ENABLE_CACHING=true

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# External APIs
COINGECKO_API_KEY=
DEFI_PULSE_API_KEY=

# Risk Management
MAX_SLIPPAGE=0.05
MAX_GAS_PRICE_GWEI=100
EMERGENCY_PAUSE_THRESHOLD=0.1
"""
    
    env_file = Path(".env")
    if not env_file.exists():
        with open(env_file, "w") as f:
            f.write(env_content)
        print("✅ Created .env file with default values")
    else:
        print("ℹ️  .env file already exists")

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    return True

def setup_database():
    """Set up database tables"""
    print("🗄️  Setting up database...")
    try:
        # Import here to avoid circular imports
        from app.database import init_db
        import asyncio
        
        async def setup():
            await init_db()
        
        asyncio.run(setup())
        print("✅ Database tables created")
    except Exception as e:
        print(f"❌ Failed to setup database: {e}")
        return False
    return True

def create_directories():
    """Create necessary directories"""
    directories = [
        "logs",
        "data",
        "cache",
        "reports"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")

def create_docker_compose():
    """Create Docker Compose file for development"""
    docker_compose_content = """version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: yield_aggregator
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/yield_aggregator
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  postgres_data:
  redis_data:
"""
    
    with open("docker-compose.yml", "w") as f:
        f.write(docker_compose_content)
    print("✅ Created docker-compose.yml")

def create_dockerfile():
    """Create Dockerfile"""
    dockerfile_content = """FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
"""
    
    with open("Dockerfile", "w") as f:
        f.write(dockerfile_content)
    print("✅ Created Dockerfile")

def create_github_workflows():
    """Create GitHub Actions workflows"""
    workflows_dir = Path(".github/workflows")
    workflows_dir.mkdir(parents=True, exist_ok=True)
    
    # CI workflow
    ci_workflow = """name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        python run_tests.py --type all --coverage
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379/0
        TESTING: true
"""
    
    with open(workflows_dir / "ci.yml", "w") as f:
        f.write(ci_workflow)
    print("✅ Created GitHub Actions CI workflow")

def main():
    """Main setup function"""
    print("🚀 Setting up DeFi Yield Aggregator Backend Environment")
    print("=" * 60)
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Setup steps
    steps = [
        ("Creating environment file", create_env_file),
        ("Installing dependencies", install_dependencies),
        ("Creating directories", create_directories),
        ("Setting up database", setup_database),
        ("Creating Docker files", lambda: (create_docker_compose(), create_dockerfile())),
        ("Creating GitHub workflows", create_github_workflows),
    ]
    
    success = True
    for step_name, step_func in steps:
        print(f"\n📋 {step_name}...")
        try:
            if callable(step_func):
                result = step_func()
                if result is False:
                    success = False
            else:
                step_func()
        except Exception as e:
            print(f"❌ Error in {step_name}: {e}")
            success = False
    
    if success:
        print("\n🎉 Environment setup completed successfully!")
        print("\nNext steps:")
        print("1. Update .env file with your actual values")
        print("2. Start PostgreSQL and Redis services")
        print("3. Run tests: python run_tests.py")
        print("4. Start the server: uvicorn app.main:app --reload")
    else:
        print("\n💥 Environment setup completed with errors")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
