from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import declarative_base, sessionmaker
import redis.asyncio as redis
from .config import DATABASE_CONFIG, REDIS_CONFIG
import logging

logger = logging.getLogger(__name__)

# Database setup
engine = create_engine(
    DATABASE_CONFIG["url"],
    echo=DATABASE_CONFIG["echo"]
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis setup
redis_client = None

async def get_redis():
    """Get Redis client instance"""
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.from_url(
                REDIS_CONFIG["url"],
                password=REDIS_CONFIG["password"],
                db=REDIS_CONFIG["db"],
                decode_responses=REDIS_CONFIG["decode_responses"]
            )
            # Test connection
            await redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Redis features will be disabled.")
            redis_client = None
    return redis_client

async def close_redis():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def init_db():
    """Initialize database tables"""
    try:
        # Import all models here to ensure they are registered
        from . import models
        # Use checkfirst=True to avoid creating tables that already exist
        Base.metadata.create_all(bind=engine, checkfirst=True)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        # Don't raise - let the app continue even if tables already exist
        logger.warning("Continuing despite database initialization error")

async def check_db_connection():
    """Check database connection health"""
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

async def check_redis_connection():
    """Check Redis connection health"""
    try:
        redis_client = await get_redis()
        if redis_client is None:
            return False
        await redis_client.ping()
        return True
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return False
