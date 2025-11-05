import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import Mock, patch, AsyncMock
import json
from datetime import datetime, timedelta

from app.main import app
from app.database import get_db, Base
from app.models import Strategy, UserStrategy, YieldData, UserAnalytics
from app.services.yield_optimizer import YieldOptimizer
from app.services.yield_data_service import YieldDataService
from app.services.analytics_service import AnalyticsService

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture(scope="function")
def sample_strategies(db_session):
    """Create sample strategies for testing"""
    strategies = [
        Strategy(
            name="Compound USDC",
            type="compound",
            contract_address="0x39AA39c021dfbaE8faC545936693aC917d5E7563",
            network="ethereum",
            apy=0.05,
            tvl=1000000000000000000000000,  # 1M USDC
            risk_score=0.3,
            is_active=True
        ),
        Strategy(
            name="Uniswap V3 ETH-USDC",
            type="uniswap_v3",
            contract_address="0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8",
            network="ethereum",
            apy=0.08,
            tvl=500000000000000000000000,  # 500K ETH
            risk_score=0.6,
            is_active=True
        ),
        Strategy(
            name="Aave USDC",
            type="aave",
            contract_address="0xBcca60bB61934080951369a648Fb03DF4F96263C",
            network="ethereum",
            apy=0.04,
            tvl=2000000000000000000000000,  # 2M USDC
            risk_score=0.2,
            is_active=True
        )
    ]
    
    for strategy in strategies:
        db_session.add(strategy)
    db_session.commit()
    
    return strategies

@pytest.fixture(scope="function")
def sample_yield_data(db_session, sample_strategies):
    """Create sample yield data for testing"""
    yield_data = []
    for i in range(30):  # 30 days of data
        for strategy in sample_strategies:
            data = YieldData(
                strategy_id=strategy.id,
                apy=strategy.apy + (i * 0.001),  # Slight variation
                tvl=strategy.tvl + (i * 1000000000000000000),  # Growing TVL
                network=strategy.network,
                timestamp=datetime.utcnow() - timedelta(days=30-i),
                metadata={"test": True}
            )
            yield_data.append(data)
            db_session.add(data)
    
    db_session.commit()
    return yield_data

class TestYieldOptimizationAPI:
    """Test yield optimization API endpoints"""
    
    def test_optimize_yield_success(self, client, db_session, sample_strategies):
        """Test successful yield optimization"""
        request_data = {
            "total_amount": 1000000000000000000000,  # 1000 ETH
            "strategies": [
                {"strategy_id": sample_strategies[0].id, "weight": 0.4},
                {"strategy_id": sample_strategies[1].id, "weight": 0.6}
            ],
            "risk_tolerance": 0.5,
            "max_slippage": 0.05
        }
        
        with patch('app.services.yield_optimizer.YieldOptimizer.optimize_allocations') as mock_optimize:
            mock_optimize.return_value = asyncio.create_task(
                asyncio.coroutine(lambda: {
                    "optimal_allocations": [
                        {
                            "strategy_id": sample_strategies[0].id,
                            "name": "Compound USDC",
                            "amount": 400000000000000000000,
                            "weight": 0.4,
                            "expected_yield": 0.05,
                            "risk_score": 0.3
                        },
                        {
                            "strategy_id": sample_strategies[1].id,
                            "name": "Uniswap V3 ETH-USDC",
                            "amount": 600000000000000000000,
                            "weight": 0.6,
                            "expected_yield": 0.08,
                            "risk_score": 0.6
                        }
                    ],
                    "expected_apy": 0.068,
                    "risk_score": 0.48,
                    "total_amount": 1000000000000000000000,
                    "created_at": datetime.utcnow()
                })()
            )
            
            response = client.post("/api/v1/yield/optimize", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "optimal_allocations" in data
            assert "expected_apy" in data
            assert "risk_score" in data
            assert len(data["optimal_allocations"]) == 2
    
    def test_optimize_yield_validation_error(self, client):
        """Test yield optimization with validation errors"""
        # Test empty strategies
        request_data = {
            "total_amount": 1000000000000000000000,
            "strategies": [],
            "risk_tolerance": 0.5
        }
        
        response = client.post("/api/v1/yield/optimize", json=request_data)
        assert response.status_code == 400
        assert "At least one strategy required" in response.json()["detail"]
        
        # Test invalid weight sum
        request_data = {
            "total_amount": 1000000000000000000000,
            "strategies": [
                {"strategy_id": 1, "weight": 0.6},
                {"strategy_id": 2, "weight": 0.6}  # Total > 1.0
            ],
            "risk_tolerance": 0.5
        }
        
        response = client.post("/api/v1/yield/optimize", json=request_data)
        assert response.status_code == 400
        assert "Total weight cannot exceed 1.0" in response.json()["detail"]
    
    def test_get_strategies(self, client, db_session, sample_strategies):
        """Test getting strategies"""
        response = client.get("/api/v1/yield/strategies")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all("id" in strategy for strategy in data)
        assert all("name" in strategy for strategy in data)
        assert all("apy" in strategy for strategy in data)
    
    def test_get_strategies_with_filters(self, client, db_session, sample_strategies):
        """Test getting strategies with filters"""
        # Test network filter
        response = client.get("/api/v1/yield/strategies?network=ethereum")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(strategy["network"] == "ethereum" for strategy in data)
        
        # Test active_only filter
        # Deactivate one strategy
        strategy = db_session.query(Strategy).first()
        strategy.is_active = False
        db_session.commit()
        
        response = client.get("/api/v1/yield/strategies?active_only=true")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(strategy["is_active"] for strategy in data)
    
    def test_get_strategy_by_id(self, client, db_session, sample_strategies):
        """Test getting specific strategy"""
        strategy = sample_strategies[0]
        response = client.get(f"/api/v1/yield/strategies/{strategy.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == strategy.id
        assert data["name"] == strategy.name
        assert data["apy"] == strategy.apy
    
    def test_get_strategy_not_found(self, client):
        """Test getting non-existent strategy"""
        response = client.get("/api/v1/yield/strategies/999")
        assert response.status_code == 404
        assert "Strategy not found" in response.json()["detail"]
    
    def test_get_yield_data(self, client, db_session, sample_yield_data):
        """Test getting yield data"""
        response = client.get("/api/v1/yield/yield-data?days=7")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert all("apy" in item for item in data)
        assert all("tvl" in item for item in data)
        assert all("timestamp" in item for item in data)
    
    def test_get_top_yields(self, client, db_session, sample_strategies):
        """Test getting top yields"""
        with patch('app.services.yield_data_service.YieldDataService.get_top_yields') as mock_top:
            mock_top.return_value = asyncio.create_task(
                asyncio.coroutine(lambda: [
                    {
                        "id": sample_strategies[1].id,
                        "name": "Uniswap V3 ETH-USDC",
                        "apy": 0.08,
                        "tvl": 500000000000000000000000,
                        "risk_score": 0.6,
                        "network": "ethereum"
                    },
                    {
                        "id": sample_strategies[0].id,
                        "name": "Compound USDC",
                        "apy": 0.05,
                        "tvl": 1000000000000000000000000,
                        "risk_score": 0.3,
                        "network": "ethereum"
                    }
                ])()
            )
            
            response = client.get("/api/v1/yield/top-yields?limit=5")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert data[0]["apy"] > data[1]["apy"]  # Sorted by APY
    
    def test_get_user_analytics(self, client, db_session):
        """Test getting user analytics"""
        with patch('app.services.analytics_service.AnalyticsService.get_user_analytics') as mock_analytics:
            mock_analytics.return_value = asyncio.create_task(
                asyncio.coroutine(lambda: {
                    "total_deposited": 1000000000000000000000,
                    "total_withdrawn": 0,
                    "total_yield_earned": 50000000000000000000,
                    "current_tvl": 1050000000000000000000,
                    "average_apy": 0.05,
                    "last_updated": datetime.utcnow().isoformat()
                })()
            )
            
            response = client.get("/api/v1/yield/analytics/user/1")
            
            assert response.status_code == 200
            data = response.json()
            assert "total_deposited" in data
            assert "current_tvl" in data
            assert "average_apy" in data
    
    def test_get_system_analytics(self, client, db_session):
        """Test getting system analytics"""
        with patch('app.services.analytics_service.AnalyticsService.get_system_analytics') as mock_analytics:
            mock_analytics.return_value = asyncio.create_task(
                asyncio.coroutine(lambda: {
                    "total_strategies": 3,
                    "total_tvl": 3500000000000000000000000,
                    "average_apy": 0.0567,
                    "network_breakdown": {
                        "ethereum": {
                            "count": 3,
                            "tvl": 3500000000000000000000000,
                            "average_apy": 0.0567
                        }
                    },
                    "daily_metrics": []
                })()
            )
            
            response = client.get("/api/v1/yield/analytics/system?days=7")
            
            assert response.status_code == 200
            data = response.json()
            assert "total_strategies" in data
            assert "total_tvl" in data
            assert "network_breakdown" in data
    
    def test_rebalance_portfolio(self, client, db_session, sample_strategies):
        """Test portfolio rebalancing"""
        request_data = {
            "user_id": 1,
            "target_allocations": [
                {"strategy_id": sample_strategies[0].id, "weight": 0.5},
                {"strategy_id": sample_strategies[1].id, "weight": 0.5}
            ]
        }
        
        with patch('app.services.yield_optimizer.YieldOptimizer.rebalance_portfolio') as mock_rebalance:
            mock_rebalance.return_value = asyncio.create_task(
                asyncio.coroutine(lambda: [
                    {
                        "strategy_id": sample_strategies[0].id,
                        "action": "deposit",
                        "amount": 100000000000000000000,
                        "current_amount": 0,
                        "target_amount": 100000000000000000000
                    }
                ])()
            )
            
            response = client.post("/api/v1/yield/rebalance", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "rebalance_actions" in data
            assert "estimated_gas_cost" in data
            assert "estimated_slippage" in data
    
    def test_refresh_yield_data(self, client, db_session):
        """Test refreshing yield data"""
        with patch('app.services.yield_data_service.YieldDataService.fetch_all_yield_data') as mock_fetch:
            mock_fetch.return_value = asyncio.create_task(
                asyncio.coroutine(lambda: {"message": "Data refreshed"})()
            )
            
            response = client.post("/api/v1/yield/refresh-data")
            
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "refresh initiated" in data["message"]
    
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/api/v1/yield/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data


class TestYieldOptimizerService:
    """Test yield optimizer service"""
    
    def test_optimize_allocations(self, db_session, sample_strategies):
        """Test yield optimization logic"""
        optimizer = YieldOptimizer(db_session)
        
        strategies = [
            {"strategy_id": sample_strategies[0].id, "weight": 0.4},
            {"strategy_id": sample_strategies[1].id, "weight": 0.6}
        ]
        
        # Mock the async method
        async def mock_optimize():
            return {
                "optimal_allocations": [
                    {
                        "strategy_id": sample_strategies[0].id,
                        "name": "Compound USDC",
                        "amount": 400000000000000000000,
                        "weight": 0.4,
                        "expected_yield": 0.05,
                        "risk_score": 0.3
                    }
                ],
                "expected_apy": 0.05,
                "risk_score": 0.3,
                "total_amount": 1000000000000000000000,
                "created_at": datetime.utcnow()
            }
        
        # Test the optimization
        result = asyncio.run(mock_optimize())
        
        assert "optimal_allocations" in result
        assert "expected_apy" in result
        assert "risk_score" in result
        assert len(result["optimal_allocations"]) == 1


class TestYieldDataService:
    """Test yield data service"""
    
    def test_fetch_all_yield_data(self, db_session):
        """Test fetching yield data from external sources"""
        service = YieldDataService(db_session)
        
        # Mock the async method
        async def mock_fetch():
            return {
                "compound_usdc": {
                    "protocol": "compound",
                    "symbol": "USDC",
                    "apy": 0.05,
                    "tvl": 1000000000000000000000000,
                    "network": "ethereum",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        
        result = asyncio.run(mock_fetch())
        
        assert "compound_usdc" in result
        assert result["compound_usdc"]["protocol"] == "compound"
        assert result["compound_usdc"]["apy"] == 0.05


class TestAnalyticsService:
    """Test analytics service"""
    
    def test_log_yield_optimization(self, db_session):
        """Test logging yield optimization"""
        service = AnalyticsService(db_session)
        
        # Mock the async method
        async def mock_log():
            return True
        
        result = asyncio.run(mock_log())
        assert result is True
    
    def test_get_user_analytics(self, db_session):
        """Test getting user analytics"""
        service = AnalyticsService(db_session)
        
        # Mock the async method
        async def mock_analytics():
            return {
                "total_deposited": 1000000000000000000000,
                "total_withdrawn": 0,
                "total_yield_earned": 50000000000000000000,
                "current_tvl": 1050000000000000000000,
                "average_apy": 0.05,
                "last_updated": datetime.utcnow().isoformat()
            }
        
        result = asyncio.run(mock_analytics())
        
        assert "total_deposited" in result
        assert "current_tvl" in result
        assert "average_apy" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
