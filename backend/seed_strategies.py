#!/usr/bin/env python3
"""
Script to seed the database with sample strategies
Run this from the backend directory: python seed_strategies.py
"""

import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Strategy
from app.database import DATABASE_URL
from datetime import datetime

# Sample strategies data
SAMPLE_STRATEGIES = [
    {
        "name": "Aave USDC Lending",
        "type": "lending",
        "contract_address": "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
        "network": "ethereum",
        "apy": 5.2,
        "tvl": 1000000000000000000,
        "risk_score": 0.3,
        "is_active": True,
    },
    {
        "name": "Compound ETH",
        "type": "compound",
        "contract_address": "0x3dB756dd23EF65aF9dFe7e1eac79b1E2d6ff0bF3",
        "network": "ethereum",
        "apy": 3.8,
        "tvl": 500000000000000000,
        "risk_score": 0.2,
        "is_active": True,
    },
    {
        "name": "Uniswap V3 USDC/ETH",
        "type": "uniswap_v3",
        "contract_address": "0xC2e9F6ba3e9755dEf0bC6e37149047aD00d7d6e6",
        "network": "ethereum",
        "apy": 7.5,
        "tvl": 2000000000000000000,
        "risk_score": 0.4,
        "is_active": True,
    },
    {
        "name": "Curve USDC Pool",
        "type": "curve",
        "contract_address": "0xA1F8A6807c402E4A15ef4EBa36528A3DED24E577",
        "network": "ethereum",
        "apy": 4.5,
        "tvl": 1500000000000000000,
        "risk_score": 0.25,
        "is_active": True,
    },
    {
        "name": "Aave USDC Polygon",
        "type": "lending",
        "contract_address": "0x8dFf5E27EA6b7AC08CdbEe4C45ced9Bef3bB399a",
        "network": "polygon",
        "apy": 6.8,
        "tvl": 800000000000000000,
        "risk_score": 0.35,
        "is_active": True,
    },
    {
        "name": "Staking ETH 2.0",
        "type": "staking",
        "contract_address": "0xae7ab96520DE3a18E5e111B5EaAC095312D7fE84",
        "network": "ethereum",
        "apy": 3.2,
        "tvl": 3000000000000000000,
        "risk_score": 0.1,
        "is_active": True,
    },
]


def seed_database():
    """Seed the database with sample strategies"""
    try:
        # Create engine and session
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()

        # Create tables
        Base.metadata.create_all(engine)
        print("✓ Database tables created successfully")

        # Check if strategies already exist
        existing_count = session.query(Strategy).count()
        if existing_count > 0:
            print(f"⚠ Database already has {existing_count} strategies. Skipping seed.")
            session.close()
            return

        # Add sample strategies
        for strategy_data in SAMPLE_STRATEGIES:
            strategy = Strategy(**strategy_data)
            session.add(strategy)
            print(f"✓ Added: {strategy_data['name']}")

        # Commit
        session.commit()
        print(f"\n✓ Successfully seeded {len(SAMPLE_STRATEGIES)} strategies")
        session.close()

    except Exception as e:
        print(f"✗ Error seeding database: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    seed_database()
