from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel
import os
import logging
from contextlib import asynccontextmanager
from .routers.yield_routes import router as yield_router
from .routers.bridge_routes import router as bridge_router
from .routers.user_routes import router as user_router
from .routers.auth_routes import router as auth_router
from .database import init_db, check_db_connection, check_redis_connection
from .config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting DeFi Yield Aggregator API")
    
    # Initialize database
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    # Check connections
    db_healthy = await check_db_connection()
    redis_healthy = await check_redis_connection()
    
    if not db_healthy:
        logger.warning("Database connection unhealthy")
    if not redis_healthy:
        logger.warning("Redis connection unhealthy")
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down DeFi Yield Aggregator API")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Advanced DeFi Yield Aggregator with Cross-Chain Bridge Integration",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
)

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str
    redis: str

@app.get("/health", response_model=HealthResponse)
async def health():
    """Comprehensive health check"""
    db_healthy = await check_db_connection()
    redis_healthy = await check_redis_connection()
    
    status = "healthy" if db_healthy and redis_healthy else "unhealthy"
    
    return HealthResponse(
        status=status, 
        version=settings.VERSION, 
        environment=os.getenv("NODE_ENV", "development"),
        database="healthy" if db_healthy else "unhealthy",
        redis="healthy" if redis_healthy else "unhealthy"
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "DeFi Yield Aggregator API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }

# Include routers
app.include_router(auth_router)  # No prefix, auth routes have their own
app.include_router(yield_router, prefix=settings.API_V1_STR)
app.include_router(bridge_router, prefix=settings.API_V1_STR)
app.include_router(user_router, prefix=settings.API_V1_STR)



