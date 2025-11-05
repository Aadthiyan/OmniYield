from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    # Environment
    NODE_ENV: str = "development"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/yield_aggregator"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    
    # Blockchain RPC URLs
    ETHEREUM_RPC_URL: str = "https://mainnet.infura.io/v3/your_key"
    TESTNET_RPC_URL: str = "https://goerli.infura.io/v3/your_key"
    MUMBAI_RPC_URL: str = "https://rpc-mumbai.maticvigil.com"
    POLYGON_RPC_URL: str = "https://polygon-rpc.com"
    BSC_RPC_URL: str = "https://bsc-dataseed.binance.org"
    
    # Contract Addresses
    YIELD_AGGREGATOR_ADDRESS: Optional[str] = None
    BRIDGE_ADAPTER_ADDRESS: Optional[str] = None
    WRAPPED_TOKEN_ADDRESS: Optional[str] = None
    
    # QIE SDK
    QIE_API_KEY: Optional[str] = None
    QIE_SECRET_KEY: Optional[str] = None
    QIE_NETWORK: str = "testnet"
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "DeFi Yield Aggregator"
    VERSION: str = "1.0.0"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # Yield Optimization
    YIELD_UPDATE_INTERVAL: int = 300  # 5 minutes
    MAX_STRATEGIES_PER_USER: int = 10
    MIN_AMOUNT_THRESHOLD: int = 1000000000000000000  # 1 ETH in wei
    MAX_AMOUNT_THRESHOLD: int = 1000000000000000000000  # 1000 ETH in wei
    
    # Analytics
    ENABLE_ANALYTICS: bool = True
    ANALYTICS_RETENTION_DAYS: int = 90
    METRICS_UPDATE_INTERVAL: int = 60  # 1 minute
    
    # Caching
    CACHE_TTL: int = 300  # 5 minutes
    ENABLE_CACHING: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # External APIs
    COINGECKO_API_KEY: Optional[str] = None
    DEFI_PULSE_API_KEY: Optional[str] = None
    
    # Supported Networks
    SUPPORTED_NETWORKS: List[str] = ["ethereum", "polygon", "bsc", "testnet"]
    
    # Yield Strategy Configuration
    DEFAULT_STRATEGY_WEIGHTS: dict = {
        "compound": 0.3,
        "uniswap_v3": 0.4,
        "staking": 0.3
    }
    
    # Risk Management
    MAX_SLIPPAGE: float = 0.05  # 5%
    MAX_GAS_PRICE_GWEI: int = 100
    EMERGENCY_PAUSE_THRESHOLD: float = 0.1  # 10% loss threshold

    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


# Global settings instance
settings = Settings()

# Database configuration
DATABASE_CONFIG = {
    "url": settings.DATABASE_URL,
    "pool_size": settings.DATABASE_POOL_SIZE,
    "max_overflow": settings.DATABASE_MAX_OVERFLOW,
    "echo": settings.DEBUG,
}

# Redis configuration
REDIS_CONFIG = {
    "url": settings.REDIS_URL,
    "password": settings.REDIS_PASSWORD,
    "db": settings.REDIS_DB,
    "decode_responses": True,
}

# Blockchain network configuration
NETWORK_CONFIG = {
    "ethereum": {
        "rpc_url": settings.ETHEREUM_RPC_URL,
        "chain_id": 1,
        "name": "Ethereum Mainnet",
        "symbol": "ETH"
    },
    "polygon": {
        "rpc_url": settings.POLYGON_RPC_URL,
        "chain_id": 137,
        "name": "Polygon",
        "symbol": "MATIC"
    },
    "bsc": {
        "rpc_url": settings.BSC_RPC_URL,
        "chain_id": 56,
        "name": "Binance Smart Chain",
        "symbol": "BNB"
    },
    "testnet": {
        "rpc_url": settings.TESTNET_RPC_URL,
        "chain_id": 5,
        "name": "Goerli Testnet",
        "symbol": "ETH"
    }
}





