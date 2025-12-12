"""
Script to reset the database (Drop all tables and Re-seed)
Run with: python -m scripts.reset_db
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, Base
from scripts.seed_database import seed_database
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    """Drop all tables and re-seed"""
    print("⚠️  WARNING: This will DELETE ALL DATA in the database!")
    print("Dropping all tables...")
    
    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        print("✅  All tables dropped.")
        
        # Re-create tables and seed
        print("Re-seeding database...")
        seed_database()
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reset_database()
