from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime
from typing import Optional, Dict, Any
import json


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    # Traditional auth fields
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    
    # Optional wallet connection
    wallet_address = Column(String(42), unique=True, index=True, nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # User preferences
    preferences = Column(JSON, default={})
    
    # Relationships
    strategies = relationship("UserStrategy", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    analytics = relationship("UserAnalytics", back_populates="user")



class Strategy(Base):
    __tablename__ = "strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # compound, uniswap_v3, staking, etc.
    contract_address = Column(String(42), unique=True, index=True, nullable=False)
    network = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    apy = Column(Float, default=0.0)
    tvl = Column(BigInteger, default=0)  # Total Value Locked in wei
    risk_score = Column(Float, default=0.0)  # 0-1 scale
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    meta_data = Column(JSON, default={})
    
    # Relationships
    user_strategies = relationship("UserStrategy", back_populates="strategy")
    yield_data = relationship("YieldData", back_populates="strategy")


class UserStrategy(Base):
    __tablename__ = "user_strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    amount = Column(BigInteger, nullable=False)  # Amount in wei
    weight = Column(Float, default=0.0)  # Weight in percentage
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="strategies")
    strategy = relationship("Strategy", back_populates="user_strategies")


class YieldData(Base):
    __tablename__ = "yield_data"
    
    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    apy = Column(Float, nullable=False)
    tvl = Column(BigInteger, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    network = Column(String(20), nullable=False)
    meta_data = Column(JSON, default={})
    
    # Relationships
    strategy = relationship("Strategy", back_populates="yield_data")


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tx_hash = Column(String(66), unique=True, index=True, nullable=False)
    type = Column(String(20), nullable=False)  # deposit, withdraw, rebalance, etc.
    amount = Column(BigInteger, nullable=False)
    token_address = Column(String(42), nullable=False)
    network = Column(String(20), nullable=False)
    status = Column(String(20), default="pending")  # pending, confirmed, failed
    gas_used = Column(BigInteger, nullable=True)
    gas_price = Column(BigInteger, nullable=True)
    block_number = Column(BigInteger, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    meta_data = Column(JSON, default={})
    
    # Relationships
    user = relationship("User", back_populates="transactions")


class OptimizationResult(Base):
    __tablename__ = "optimization_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(BigInteger, nullable=False)
    optimal_allocations = Column(JSON, nullable=False)
    expected_apy = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    meta_data = Column(JSON, default={})


class UserAnalytics(Base):
    __tablename__ = "user_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_deposited = Column(BigInteger, default=0)
    total_withdrawn = Column(BigInteger, default=0)
    total_yield_earned = Column(BigInteger, default=0)
    current_tvl = Column(BigInteger, default=0)
    average_apy = Column(Float, default=0.0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="analytics")


class SystemMetrics(Base):
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(Float, nullable=False)
    network = Column(String(20), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    meta_data = Column(JSON, default={})


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for system alerts
    alert_type = Column(String(50), nullable=False)  # yield_drop, high_risk, etc.
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="info")  # info, warning, error, critical
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    meta_data = Column(JSON, default={})


class CacheEntry(Base):
    __tablename__ = "cache_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Pydantic models for API responses
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class UserBase(BaseModel):
    wallet_address: str
    email: Optional[str] = None
    is_active: bool = True
    preferences: Dict[str, Any] = {}


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class StrategyBase(BaseModel):
    name: str
    type: str
    contract_address: str
    network: str
    is_active: bool = True
    apy: float = 0.0
    tvl: int = 0
    risk_score: float = 0.0
    metadata: Dict[str, Any] = {}


class StrategyCreate(StrategyBase):
    pass


class StrategyResponse(StrategyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class YieldDataBase(BaseModel):
    strategy_id: int
    apy: float
    tvl: int
    network: str
    metadata: Dict[str, Any] = {}


class YieldDataResponse(YieldDataBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True


class OptimizationRequest(BaseModel):
    total_amount: int
    strategies: List[Dict[str, Any]]
    risk_tolerance: float = 0.5
    max_slippage: float = 0.05


class OptimizationResponse(BaseModel):
    optimal_allocations: List[Dict[str, Any]]
    expected_apy: float
    risk_score: float
    total_amount: int
    created_at: datetime
    
    class Config:
        from_attributes = True
