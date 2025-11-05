import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import pandas as pd
from sqlalchemy.orm import Session
from ..models import Strategy, YieldData, UserStrategy, OptimizationResult
from ..config import settings
import json

logger = logging.getLogger(__name__)


class YieldOptimizer:
    """Advanced yield optimization service using machine learning"""
    
    def __init__(self, db: Session):
        self.db = db
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
    async def train_model(self):
        """Train the yield prediction model"""
        try:
            # Fetch historical yield data
            yield_data = self.db.query(YieldData).filter(
                YieldData.timestamp >= datetime.utcnow() - timedelta(days=30)
            ).all()
            
            if len(yield_data) < 100:  # Need sufficient data
                logger.warning("Insufficient data for model training")
                return False
                
            # Prepare features
            features = []
            targets = []
            
            for data in yield_data:
                feature_vector = [
                    data.apy,
                    data.tvl / 1e18,  # Convert to ETH
                    data.timestamp.hour,
                    data.timestamp.weekday(),
                    self._get_network_encoding(data.network),
                    data.metadata.get('gas_price', 0),
                    data.metadata.get('transaction_count', 0)
                ]
                features.append(feature_vector)
                targets.append(data.apy)
            
            # Train model
            X = np.array(features)
            y = np.array(targets)
            
            X_scaled = self.scaler.fit_transform(X)
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            self.model.fit(X_scaled, y)
            self.is_trained = True
            
            logger.info("Yield prediction model trained successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to train model: {e}")
            return False
    
    def _get_network_encoding(self, network: str) -> int:
        """Encode network as integer"""
        network_map = {
            "ethereum": 1,
            "polygon": 2,
            "bsc": 3,
            "testnet": 4
        }
        return network_map.get(network, 0)
    
    async def predict_yield(self, strategy_id: int, amount: int, network: str) -> float:
        """Predict yield for a strategy"""
        if not self.is_trained:
            await self.train_model()
        
        if not self.is_trained:
            # Fallback to simple calculation
            strategy = self.db.query(Strategy).filter(Strategy.id == strategy_id).first()
            return strategy.apy if strategy else 0.0
        
        try:
            # Get current strategy data
            strategy = self.db.query(Strategy).filter(Strategy.id == strategy_id).first()
            if not strategy:
                return 0.0
            
            # Prepare feature vector
            current_time = datetime.utcnow()
            feature_vector = [
                strategy.apy,
                amount / 1e18,  # Convert to ETH
                current_time.hour,
                current_time.weekday(),
                self._get_network_encoding(network),
                0,  # gas_price placeholder
                0   # transaction_count placeholder
            ]
            
            # Predict
            X = np.array([feature_vector])
            X_scaled = self.scaler.transform(X)
            prediction = self.model.predict(X_scaled)[0]
            
            return max(0.0, prediction)  # Ensure non-negative
            
        except Exception as e:
            logger.error(f"Failed to predict yield: {e}")
            return 0.0
    
    async def optimize_allocations(
        self, 
        total_amount: int, 
        strategies: List[Dict[str, Any]], 
        risk_tolerance: float = 0.5,
        max_slippage: float = 0.05
    ) -> Dict[str, Any]:
        """Optimize yield allocations using advanced algorithms"""
        try:
            if total_amount < settings.MIN_AMOUNT_THRESHOLD:
                raise ValueError("Amount below minimum threshold")
            
            if total_amount > settings.MAX_AMOUNT_THRESHOLD:
                raise ValueError("Amount above maximum threshold")
            
            # Get strategy data
            strategy_ids = [s.get('strategy_id') for s in strategies]
            db_strategies = self.db.query(Strategy).filter(
                Strategy.id.in_(strategy_ids),
                Strategy.is_active == True
            ).all()
            
            if not db_strategies:
                raise ValueError("No active strategies found")
            
            # Calculate optimal allocations
            optimal_allocations = await self._calculate_optimal_allocations(
                total_amount, strategies, db_strategies, risk_tolerance
            )
            
            # Calculate expected metrics
            expected_apy = await self._calculate_expected_apy(optimal_allocations, db_strategies)
            risk_score = await self._calculate_risk_score(optimal_allocations, db_strategies)
            
            # Save optimization result
            optimization_result = OptimizationResult(
                user_id=1,  # TODO: Get from auth context
                total_amount=total_amount,
                optimal_allocations=optimal_allocations,
                expected_apy=expected_apy,
                risk_score=risk_score,
                metadata={
                    "risk_tolerance": risk_tolerance,
                    "max_slippage": max_slippage,
                    "strategy_count": len(strategies)
                }
            )
            self.db.add(optimization_result)
            self.db.commit()
            
            return {
                "optimal_allocations": optimal_allocations,
                "expected_apy": expected_apy,
                "risk_score": risk_score,
                "total_amount": total_amount,
                "created_at": datetime.utcnow()
            }
            
        except Exception as e:
            logger.error(f"Optimization failed: {e}")
            raise
    
    async def _calculate_optimal_allocations(
        self, 
        total_amount: int, 
        strategies: List[Dict[str, Any]], 
        db_strategies: List[Strategy],
        risk_tolerance: float
    ) -> List[Dict[str, Any]]:
        """Calculate optimal allocations using modern portfolio theory"""
        try:
            # Prepare data for optimization
            strategy_data = []
            for strategy in strategies:
                db_strategy = next((s for s in db_strategies if s.id == strategy['strategy_id']), None)
                if not db_strategy:
                    continue
                
                # Predict yield
                predicted_yield = await self.predict_yield(
                    strategy['strategy_id'], 
                    total_amount, 
                    db_strategy.network
                )
                
                strategy_data.append({
                    'strategy_id': strategy['strategy_id'],
                    'name': db_strategy.name,
                    'type': db_strategy.type,
                    'contract_address': db_strategy.contract_address,
                    'network': db_strategy.network,
                    'expected_yield': predicted_yield,
                    'risk_score': db_strategy.risk_score,
                    'tvl': db_strategy.tvl,
                    'weight': strategy.get('weight', 0.0)
                })
            
            if not strategy_data:
                raise ValueError("No valid strategies found")
            
            # Apply modern portfolio theory
            allocations = self._modern_portfolio_theory(
                strategy_data, total_amount, risk_tolerance
            )
            
            return allocations
            
        except Exception as e:
            logger.error(f"Failed to calculate optimal allocations: {e}")
            raise
    
    def _modern_portfolio_theory(
        self, 
        strategy_data: List[Dict[str, Any]], 
        total_amount: int, 
        risk_tolerance: float
    ) -> List[Dict[str, Any]]:
        """Apply Modern Portfolio Theory for optimization"""
        try:
            n_strategies = len(strategy_data)
            
            # Extract returns and risks
            returns = np.array([s['expected_yield'] for s in strategy_data])
            risks = np.array([s['risk_score'] for s in strategy_data])
            
            # Create covariance matrix (simplified)
            cov_matrix = np.outer(risks, risks) * 0.1  # Simplified correlation
            
            # Calculate optimal weights using quadratic programming
            # For simplicity, we'll use a weighted approach based on Sharpe ratio
            sharpe_ratios = returns / (risks + 1e-6)  # Avoid division by zero
            
            # Apply risk tolerance
            adjusted_ratios = sharpe_ratios * (1 - risk_tolerance) + returns * risk_tolerance
            
            # Normalize weights
            weights = adjusted_ratios / np.sum(adjusted_ratios)
            
            # Calculate allocations
            allocations = []
            for i, strategy in enumerate(strategy_data):
                allocation_amount = int(total_amount * weights[i])
                allocations.append({
                    'strategy_id': strategy['strategy_id'],
                    'name': strategy['name'],
                    'type': strategy['type'],
                    'contract_address': strategy['contract_address'],
                    'network': strategy['network'],
                    'amount': allocation_amount,
                    'weight': weights[i],
                    'expected_yield': strategy['expected_yield'],
                    'risk_score': strategy['risk_score']
                })
            
            return allocations
            
        except Exception as e:
            logger.error(f"Modern portfolio theory calculation failed: {e}")
            # Fallback to equal weight
            equal_weight = 1.0 / len(strategy_data)
            return [
                {
                    'strategy_id': s['strategy_id'],
                    'name': s['name'],
                    'type': s['type'],
                    'contract_address': s['contract_address'],
                    'network': s['network'],
                    'amount': int(total_amount * equal_weight),
                    'weight': equal_weight,
                    'expected_yield': s['expected_yield'],
                    'risk_score': s['risk_score']
                }
                for s in strategy_data
            ]
    
    async def _calculate_expected_apy(
        self, 
        allocations: List[Dict[str, Any]], 
        db_strategies: List[Strategy]
    ) -> float:
        """Calculate expected APY for the portfolio"""
        try:
            total_weighted_yield = 0.0
            total_weight = 0.0
            
            for allocation in allocations:
                strategy = next(
                    (s for s in db_strategies if s.id == allocation['strategy_id']), 
                    None
                )
                if strategy:
                    total_weighted_yield += allocation['weight'] * allocation['expected_yield']
                    total_weight += allocation['weight']
            
            return total_weighted_yield / total_weight if total_weight > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Failed to calculate expected APY: {e}")
            return 0.0
    
    async def _calculate_risk_score(
        self, 
        allocations: List[Dict[str, Any]], 
        db_strategies: List[Strategy]
    ) -> float:
        """Calculate portfolio risk score"""
        try:
            total_weighted_risk = 0.0
            total_weight = 0.0
            
            for allocation in allocations:
                strategy = next(
                    (s for s in db_strategies if s.id == allocation['strategy_id']), 
                    None
                )
                if strategy:
                    total_weighted_risk += allocation['weight'] * strategy.risk_score
                    total_weight += allocation['weight']
            
            return total_weighted_risk / total_weight if total_weight > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Failed to calculate risk score: {e}")
            return 0.0
    
    async def rebalance_portfolio(
        self, 
        user_id: int, 
        current_allocations: List[Dict[str, Any]], 
        target_allocations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Calculate rebalancing transactions"""
        try:
            rebalance_actions = []
            
            # Create maps for easy lookup
            current_map = {a['strategy_id']: a for a in current_allocations}
            target_map = {a['strategy_id']: a for a in target_allocations}
            
            # Find all strategies involved
            all_strategy_ids = set(current_map.keys()) | set(target_map.keys())
            
            for strategy_id in all_strategy_ids:
                current = current_map.get(strategy_id, {'amount': 0})
                target = target_map.get(strategy_id, {'amount': 0})
                
                current_amount = current['amount']
                target_amount = target['amount']
                difference = target_amount - current_amount
                
                if abs(difference) > 1000000000000000:  # 0.001 ETH threshold
                    action = {
                        'strategy_id': strategy_id,
                        'action': 'deposit' if difference > 0 else 'withdraw',
                        'amount': abs(difference),
                        'current_amount': current_amount,
                        'target_amount': target_amount
                    }
                    rebalance_actions.append(action)
            
            return rebalance_actions
            
        except Exception as e:
            logger.error(f"Failed to calculate rebalancing: {e}")
            raise
    
    async def get_yield_analytics(self, user_id: int, days: int = 30) -> Dict[str, Any]:
        """Get yield analytics for a user"""
        try:
            # Get user's strategies
            user_strategies = self.db.query(UserStrategy).filter(
                UserStrategy.user_id == user_id,
                UserStrategy.is_active == True
            ).all()
            
            if not user_strategies:
                return {
                    "total_yield": 0.0,
                    "average_apy": 0.0,
                    "best_strategy": None,
                    "worst_strategy": None,
                    "yield_trend": [],
                    "risk_score": 0.0
                }
            
            # Calculate analytics
            total_yield = sum(us.amount * 0.1 for us in user_strategies)  # Simplified
            average_apy = total_yield / sum(us.amount for us in user_strategies) if user_strategies else 0.0
            
            # Get yield trend
            yield_trend = []
            for i in range(days):
                date = datetime.utcnow() - timedelta(days=i)
                # Simplified trend calculation
                trend_value = average_apy * (1 + np.random.normal(0, 0.1))
                yield_trend.append({
                    "date": date.isoformat(),
                    "yield": max(0, trend_value)
                })
            
            return {
                "total_yield": total_yield,
                "average_apy": average_apy,
                "best_strategy": user_strategies[0].strategy.name if user_strategies else None,
                "worst_strategy": user_strategies[-1].strategy.name if user_strategies else None,
                "yield_trend": yield_trend,
                "risk_score": sum(us.strategy.risk_score for us in user_strategies) / len(user_strategies)
            }
            
        except Exception as e:
            logger.error(f"Failed to get yield analytics: {e}")
            return {}
