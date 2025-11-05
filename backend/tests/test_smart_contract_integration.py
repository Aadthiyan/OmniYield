import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.main import app
from app.database import get_db, Base
from app.models import Strategy, UserStrategy, Transaction
from app.services.yield_optimizer import YieldOptimizer
from app.services.analytics_service import AnalyticsService

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_contracts.db"
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
def mock_web3():
    """Mock Web3 instance"""
    web3_mock = Mock()
    web3_mock.eth.get_balance.return_value = 1000000000000000000000  # 1000 ETH
    web3_mock.eth.gas_price = 20000000000  # 20 gwei
    web3_mock.eth.estimate_gas.return_value = 100000
    return web3_mock

@pytest.fixture(scope="function")
def mock_contract():
    """Mock smart contract instance"""
    contract_mock = Mock()
    contract_mock.functions.deposit.return_value.transact.return_value = "0x1234567890abcdef"
    contract_mock.functions.withdraw.return_value.transact.return_value = "0xabcdef1234567890"
    contract_mock.functions.getBalance.return_value.call.return_value = 500000000000000000000
    contract_mock.functions.getAPY.return_value.call.return_value = 5000000000000000000  # 5% in wei
    return contract_mock

class TestSmartContractIntegration:
    """Test smart contract integration"""
    
    def test_deposit_to_strategy(self, client, db_session, mock_web3, mock_contract):
        """Test depositing to a strategy"""
        # Create a strategy
        strategy = Strategy(
            name="Test Strategy",
            type="compound",
            contract_address="0x1234567890123456789012345678901234567890",
            network="ethereum",
            apy=0.05,
            tvl=1000000000000000000000000,
            risk_score=0.3,
            is_active=True
        )
        db_session.add(strategy)
        db_session.commit()
        
        # Mock Web3 and contract interactions
        with patch('app.eth.get_w3', return_value=mock_web3):
            with patch('app.eth.get_contract', return_value=mock_contract):
                # Test deposit
                deposit_data = {
                    "strategy_id": strategy.id,
                    "amount": 100000000000000000000,  # 100 ETH
                    "user_address": "0xabcdef1234567890123456789012345678901234"
                }
                
                response = client.post("/api/v1/yield/deposit", json=deposit_data)
                
                # Should return transaction hash
                assert response.status_code == 200
                data = response.json()
                assert "tx_hash" in data
                assert data["tx_hash"] == "0x1234567890abcdef"
    
    def test_withdraw_from_strategy(self, client, db_session, mock_web3, mock_contract):
        """Test withdrawing from a strategy"""
        # Create a strategy and user strategy
        strategy = Strategy(
            name="Test Strategy",
            type="compound",
            contract_address="0x1234567890123456789012345678901234567890",
            network="ethereum",
            apy=0.05,
            tvl=1000000000000000000000000,
            risk_score=0.3,
            is_active=True
        )
        db_session.add(strategy)
        db_session.commit()
        
        user_strategy = UserStrategy(
            user_id=1,
            strategy_id=strategy.id,
            amount=100000000000000000000,  # 100 ETH
            weight=1.0,
            is_active=True
        )
        db_session.add(user_strategy)
        db_session.commit()
        
        # Mock Web3 and contract interactions
        with patch('app.eth.get_w3', return_value=mock_web3):
            with patch('app.eth.get_contract', return_value=mock_contract):
                # Test withdraw
                withdraw_data = {
                    "strategy_id": strategy.id,
                    "amount": 50000000000000000000,  # 50 ETH
                    "user_address": "0xabcdef1234567890123456789012345678901234"
                }
                
                response = client.post("/api/v1/yield/withdraw", json=withdraw_data)
                
                # Should return transaction hash
                assert response.status_code == 200
                data = response.json()
                assert "tx_hash" in data
                assert data["tx_hash"] == "0xabcdef1234567890"
    
    def test_get_strategy_balance(self, client, db_session, mock_web3, mock_contract):
        """Test getting strategy balance"""
        # Create a strategy
        strategy = Strategy(
            name="Test Strategy",
            type="compound",
            contract_address="0x1234567890123456789012345678901234567890",
            network="ethereum",
            apy=0.05,
            tvl=1000000000000000000000000,
            risk_score=0.3,
            is_active=True
        )
        db_session.add(strategy)
        db_session.commit()
        
        # Mock Web3 and contract interactions
        with patch('app.eth.get_w3', return_value=mock_web3):
            with patch('app.eth.get_contract', return_value=mock_contract):
                # Test get balance
                response = client.get(f"/api/v1/yield/strategies/{strategy.id}/balance")
                
                assert response.status_code == 200
                data = response.json()
                assert "balance" in data
                assert data["balance"] == 500000000000000000000  # 500 ETH
    
    def test_get_strategy_apy(self, client, db_session, mock_web3, mock_contract):
        """Test getting strategy APY"""
        # Create a strategy
        strategy = Strategy(
            name="Test Strategy",
            type="compound",
            contract_address="0x1234567890123456789012345678901234567890",
            network="ethereum",
            apy=0.05,
            tvl=1000000000000000000000000,
            risk_score=0.3,
            is_active=True
        )
        db_session.add(strategy)
        db_session.commit()
        
        # Mock Web3 and contract interactions
        with patch('app.eth.get_w3', return_value=mock_web3):
            with patch('app.eth.get_contract', return_value=mock_contract):
                # Test get APY
                response = client.get(f"/api/v1/yield/strategies/{strategy.id}/apy")
                
                assert response.status_code == 200
                data = response.json()
                assert "apy" in data
                assert data["apy"] == 0.05  # 5%
    
    def test_rebalance_strategies(self, client, db_session, mock_web3, mock_contract):
        """Test rebalancing strategies"""
        # Create strategies
        strategy1 = Strategy(
            name="Strategy 1",
            type="compound",
            contract_address="0x1234567890123456789012345678901234567890",
            network="ethereum",
            apy=0.05,
            tvl=1000000000000000000000000,
            risk_score=0.3,
            is_active=True
        )
        strategy2 = Strategy(
            name="Strategy 2",
            type="uniswap_v3",
            contract_address="0xabcdef1234567890123456789012345678901234",
            network="ethereum",
            apy=0.08,
            tvl=500000000000000000000000,
            risk_score=0.6,
            is_active=True
        )
        db_session.add_all([strategy1, strategy2])
        db_session.commit()
        
        # Create user strategies
        user_strategy1 = UserStrategy(
            user_id=1,
            strategy_id=strategy1.id,
            amount=600000000000000000000,  # 600 ETH
            weight=0.6,
            is_active=True
        )
        user_strategy2 = UserStrategy(
            user_id=1,
            strategy_id=strategy2.id,
            amount=400000000000000000000,  # 400 ETH
            weight=0.4,
            is_active=True
        )
        db_session.add_all([user_strategy1, user_strategy2])
        db_session.commit()
        
        # Mock Web3 and contract interactions
        with patch('app.eth.get_w3', return_value=mock_web3):
            with patch('app.eth.get_contract', return_value=mock_contract):
                # Test rebalance
                rebalance_data = {
                    "user_id": 1,
                    "target_allocations": [
                        {"strategy_id": strategy1.id, "weight": 0.5},
                        {"strategy_id": strategy2.id, "weight": 0.5}
                    ]
                }
                
                response = client.post("/api/v1/yield/rebalance", json=rebalance_data)
                
                assert response.status_code == 200
                data = response.json()
                assert "rebalance_actions" in data
                assert "estimated_gas_cost" in data
                assert "estimated_slippage" in data
    
    def test_emergency_withdraw(self, client, db_session, mock_web3, mock_contract):
        """Test emergency withdrawal"""
        # Create a strategy
        strategy = Strategy(
            name="Test Strategy",
            type="compound",
            contract_address="0x1234567890123456789012345678901234567890",
            network="ethereum",
            apy=0.05,
            tvl=1000000000000000000000000,
            risk_score=0.3,
            is_active=True
        )
        db_session.add(strategy)
        db_session.commit()
        
        # Mock Web3 and contract interactions
        with patch('app.eth.get_w3', return_value=mock_web3):
            with patch('app.eth.get_contract', return_value=mock_contract):
                # Test emergency withdraw
                emergency_data = {
                    "strategy_id": strategy.id,
                    "user_address": "0xabcdef1234567890123456789012345678901234"
                }
                
                response = client.post("/api/v1/yield/emergency-withdraw", json=emergency_data)
                
                assert response.status_code == 200
                data = response.json()
                assert "tx_hash" in data
                assert "message" in data
    
    def test_gas_estimation(self, client, db_session, mock_web3, mock_contract):
        """Test gas estimation for transactions"""
        # Create a strategy
        strategy = Strategy(
            name="Test Strategy",
            type="compound",
            contract_address="0x1234567890123456789012345678901234567890",
            network="ethereum",
            apy=0.05,
            tvl=1000000000000000000000000,
            risk_score=0.3,
            is_active=True
        )
        db_session.add(strategy)
        db_session.commit()
        
        # Mock Web3 and contract interactions
        with patch('app.eth.get_w3', return_value=mock_web3):
            with patch('app.eth.get_contract', return_value=mock_contract):
                # Test gas estimation
                response = client.get(f"/api/v1/yield/strategies/{strategy.id}/gas-estimate?amount=100000000000000000000")
                
                assert response.status_code == 200
                data = response.json()
                assert "gas_estimate" in data
                assert "gas_price" in data
                assert "total_cost" in data
                assert data["gas_estimate"] == 100000
                assert data["gas_price"] == 20000000000
    
    def test_transaction_status(self, client, db_session):
        """Test checking transaction status"""
        # Create a transaction record
        transaction = Transaction(
            user_id=1,
            tx_hash="0x1234567890abcdef",
            type="deposit",
            amount=100000000000000000000,
            token_address="0x0000000000000000000000000000000000000000",
            network="ethereum",
            status="pending",
            gas_used=100000,
            gas_price=20000000000,
            block_number=12345678
        )
        db_session.add(transaction)
        db_session.commit()
        
        # Test get transaction status
        response = client.get(f"/api/v1/yield/transactions/{transaction.tx_hash}")
        
        assert response.status_code == 200
        data = response.json()
        assert "tx_hash" in data
        assert "status" in data
        assert "amount" in data
        assert data["tx_hash"] == "0x1234567890abcdef"
        assert data["status"] == "pending"
    
    def test_strategy_health_check(self, client, db_session, mock_web3, mock_contract):
        """Test strategy health check"""
        # Create a strategy
        strategy = Strategy(
            name="Test Strategy",
            type="compound",
            contract_address="0x1234567890123456789012345678901234567890",
            network="ethereum",
            apy=0.05,
            tvl=1000000000000000000000000,
            risk_score=0.3,
            is_active=True
        )
        db_session.add(strategy)
        db_session.commit()
        
        # Mock Web3 and contract interactions
        with patch('app.eth.get_w3', return_value=mock_web3):
            with patch('app.eth.get_contract', return_value=mock_contract):
                # Test health check
                response = client.get(f"/api/v1/yield/strategies/{strategy.id}/health")
                
                assert response.status_code == 200
                data = response.json()
                assert "is_healthy" in data
                assert "apy" in data
                assert "tvl" in data
                assert "last_updated" in data
                assert data["is_healthy"] is True
    
    def test_batch_operations(self, client, db_session, mock_web3, mock_contract):
        """Test batch operations"""
        # Create strategies
        strategies = []
        for i in range(3):
            strategy = Strategy(
                name=f"Strategy {i+1}",
                type="compound",
                contract_address=f"0x{'0' * 40}{i:02x}",
                network="ethereum",
                apy=0.05 + (i * 0.01),
                tvl=1000000000000000000000000,
                risk_score=0.3 + (i * 0.1),
                is_active=True
            )
            strategies.append(strategy)
            db_session.add(strategy)
        db_session.commit()
        
        # Mock Web3 and contract interactions
        with patch('app.eth.get_w3', return_value=mock_web3):
            with patch('app.eth.get_contract', return_value=mock_contract):
                # Test batch deposit
                batch_data = {
                    "operations": [
                        {
                            "strategy_id": strategies[0].id,
                            "amount": 100000000000000000000,
                            "type": "deposit"
                        },
                        {
                            "strategy_id": strategies[1].id,
                            "amount": 200000000000000000000,
                            "type": "deposit"
                        }
                    ],
                    "user_address": "0xabcdef1234567890123456789012345678901234"
                }
                
                response = client.post("/api/v1/yield/batch-operations", json=batch_data)
                
                assert response.status_code == 200
                data = response.json()
                assert "transactions" in data
                assert "total_gas_estimate" in data
                assert len(data["transactions"]) == 2
    
    def test_error_handling(self, client, db_session, mock_web3, mock_contract):
        """Test error handling in smart contract interactions"""
        # Create a strategy
        strategy = Strategy(
            name="Test Strategy",
            type="compound",
            contract_address="0x1234567890123456789012345678901234567890",
            network="ethereum",
            apy=0.05,
            tvl=1000000000000000000000000,
            risk_score=0.3,
            is_active=True
        )
        db_session.add(strategy)
        db_session.commit()
        
        # Mock Web3 to raise an exception
        mock_web3.eth.get_balance.side_effect = Exception("RPC Error")
        
        with patch('app.eth.get_w3', return_value=mock_web3):
            # Test deposit with error
            deposit_data = {
                "strategy_id": strategy.id,
                "amount": 100000000000000000000,
                "user_address": "0xabcdef1234567890123456789012345678901234"
            }
            
            response = client.post("/api/v1/yield/deposit", json=deposit_data)
            
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert "error" in data["detail"].lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
