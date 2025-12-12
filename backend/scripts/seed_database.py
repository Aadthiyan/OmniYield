"""
Database seeding script to populate the database with test data
Run this with: python -m scripts.seed_database
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal, engine, Base
from app.models import User, Strategy
from app.utils.auth import get_password_hash
from datetime import datetime

def seed_database():
    """Seed the database with test data"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_strategies = db.query(Strategy).count()
        if existing_strategies > 0:
            print(f"Database already has {existing_strategies} strategies. Skipping seed.")
            return
        
        print("Seeding database with test data...")
        
        # Create test user
        test_user = User(
            name="Test User",
            email="user@example.com",
            password_hash=get_password_hash("password123"),
            wallet_address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow()
        )
        db.add(test_user)
        db.flush()  # Get the user ID
        
        # Create test strategies (using reasonable TVL values)
        strategies = [
            Strategy(
                name="Aave USDC Lending",
                type="lending",
                network="ethereum",
                apy=0.045,
                tvl=5000000,  # Represents TVL in a simplified format
                risk_score=0.15,
                contract_address="0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
                is_active=True,
                meta_data={"protocol": "aave", "description": "Lend USDC on Aave"}
            ),
            Strategy(
                name="Compound ETH Supply",
                type="lending",
                network="ethereum",
                apy=0.038,
                tvl=3000000,
                risk_score=0.18,
                contract_address="0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
                is_active=True,
                meta_data={"protocol": "compound", "description": "Supply ETH to Compound"}
            ),
            Strategy(
                name="Uniswap V3 ETH/USDC LP",
                type="liquidity",
                network="ethereum",
                apy=0.125,
                tvl=8000000,
                risk_score=0.45,
                contract_address="0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8",
                is_active=True,
                meta_data={"protocol": "uniswap-v3", "description": "Provide liquidity on Uniswap V3"}
            ),
            Strategy(
                name="Curve 3pool",
                type="liquidity",
                network="ethereum",
                apy=0.065,
                tvl=12000000,
                risk_score=0.25,
                contract_address="0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
                is_active=True,
                meta_data={"protocol": "curve", "description": "Provide liquidity to Curve 3pool"}
            ),
            Strategy(
                name="Aave Polygon MATIC",
                type="lending",
                network="polygon",
                apy=0.055,
                tvl=2000000,
                risk_score=0.22,
                contract_address="0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf",
                is_active=True,
                meta_data={"protocol": "aave", "description": "Lend MATIC on Aave Polygon"}
            ),
            Strategy(
                name="PancakeSwap BNB/BUSD",
                type="liquidity",
                network="bsc",
                apy=0.185,
                tvl=1500000,
                risk_score=0.55,
                contract_address="0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16",
                is_active=True,
                meta_data={"protocol": "pancakeswap", "description": "Provide liquidity on PancakeSwap"}
            ),
            Strategy(
                name="GMX Arbitrum Staking",
                type="staking",
                network="arbitrum",
                apy=0.095,
                tvl=4000000,
                risk_score=0.35,
                contract_address="0x908C4D94D34924765f1eDc22A1DD098397c59dD4",
                is_active=True,
                meta_data={"protocol": "gmx", "description": "Stake GMX tokens"}
            ),
            Strategy(
                name="Lido Staked ETH",
                type="staking",
                network="ethereum",
                apy=0.042,
                tvl=25000000,
                risk_score=0.12,
                contract_address="0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
                is_active=True,
                meta_data={"protocol": "lido", "description": "Stake ETH with Lido"}
            ),
        ]
        
        for strategy in strategies:
            db.add(strategy)
        
        db.commit()
        print(f"✅ Created {len(strategies)} strategies")
        print(f"✅ Created test user: {test_user.wallet_address}")
        print("\n🎉 Database seeded successfully!")
        print("\nYou can now:")
        print("1. Refresh your browser at http://localhost:3000")
        print("2. Browse strategies on the Strategies page")
        print("3. See real data in the application")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
