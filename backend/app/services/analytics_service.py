import asyncio
import logging
import structlog
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
from sqlalchemy.orm import Session
from ..models import UserAnalytics, SystemMetrics, Alert, Transaction
from ..config import settings
import redis.asyncio as redis
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Prometheus metrics
yield_optimization_requests = Counter(
    'yield_optimization_requests_total',
    'Total number of yield optimization requests',
    ['protocol', 'network']
)

yield_optimization_duration = Histogram(
    'yield_optimization_duration_seconds',
    'Time spent on yield optimization',
    ['protocol']
)

active_strategies = Gauge(
    'active_strategies_total',
    'Total number of active strategies',
    ['network']
)

total_tvl = Gauge(
    'total_tvl_wei',
    'Total value locked across all strategies',
    ['network']
)

average_apy = Gauge(
    'average_apy_ratio',
    'Average APY across all strategies',
    ['network']
)

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


class AnalyticsService:
    """Comprehensive analytics and logging service"""
    
    def __init__(self, db: Session):
        self.db = db
        self.redis_client = None
        self.metrics_started = False
        
    async def initialize(self):
        """Initialize the analytics service"""
        try:
            # Initialize Redis client
            self.redis_client = redis.from_url(settings.REDIS_URL)
            
            # Start Prometheus metrics server
            if not self.metrics_started:
                start_http_server(8000)
                self.metrics_started = True
                logger.info("Prometheus metrics server started on port 8000")
            
            logger.info("Analytics service initialized")
            
        except Exception as e:
            logger.error("Failed to initialize analytics service", error=str(e))
            raise
    
    async def close(self):
        """Close connections"""
        if self.redis_client:
            await self.redis_client.close()
    
    async def log_yield_optimization(
        self, 
        user_id: int, 
        protocol: str, 
        network: str, 
        duration: float,
        success: bool,
        metadata: Dict[str, Any] = None
    ):
        """Log yield optimization event"""
        try:
            # Update Prometheus metrics
            yield_optimization_requests.labels(
                protocol=protocol, 
                network=network
            ).inc()
            
            yield_optimization_duration.labels(protocol=protocol).observe(duration)
            
            # Log to structured logger
            logger.info(
                "yield_optimization_completed",
                user_id=user_id,
                protocol=protocol,
                network=network,
                duration=duration,
                success=success,
                metadata=metadata or {}
            )
            
            # Store in database
            await self._store_optimization_metric(
                user_id, protocol, network, duration, success, metadata
            )
            
        except Exception as e:
            logger.error("Failed to log yield optimization", error=str(e))
    
    async def log_transaction(
        self, 
        user_id: int, 
        tx_hash: str, 
        tx_type: str, 
        amount: int,
        network: str,
        status: str,
        gas_used: int = None,
        gas_price: int = None
    ):
        """Log transaction event"""
        try:
            # Log to structured logger
            logger.info(
                "transaction_processed",
                user_id=user_id,
                tx_hash=tx_hash,
                tx_type=tx_type,
                amount=amount,
                network=network,
                status=status,
                gas_used=gas_used,
                gas_price=gas_price
            )
            
            # Store in database
            transaction = Transaction(
                user_id=user_id,
                tx_hash=tx_hash,
                type=tx_type,
                amount=amount,
                token_address="0x0000000000000000000000000000000000000000",  # ETH
                network=network,
                status=status,
                gas_used=gas_used,
                gas_price=gas_price,
                metadata={}
            )
            self.db.add(transaction)
            self.db.commit()
            
        except Exception as e:
            logger.error("Failed to log transaction", error=str(e))
            self.db.rollback()
    
    async def update_user_analytics(self, user_id: int):
        """Update user analytics"""
        try:
            # Get user's current strategies
            user_strategies = self.db.query(UserStrategy).filter(
                UserStrategy.user_id == user_id,
                UserStrategy.is_active == True
            ).all()
            
            if not user_strategies:
                return
            
            # Calculate analytics
            total_deposited = sum(us.amount for us in user_strategies)
            total_yield_earned = sum(us.amount * 0.1 for us in user_strategies)  # Simplified
            current_tvl = total_deposited + total_yield_earned
            average_apy = sum(us.strategy.apy for us in user_strategies) / len(user_strategies)
            
            # Update or create analytics record
            analytics = self.db.query(UserAnalytics).filter(
                UserAnalytics.user_id == user_id
            ).first()
            
            if not analytics:
                analytics = UserAnalytics(user_id=user_id)
                self.db.add(analytics)
            
            analytics.total_deposited = total_deposited
            analytics.total_yield_earned = total_yield_earned
            analytics.current_tvl = current_tvl
            analytics.average_apy = average_apy
            analytics.last_updated = datetime.utcnow()
            
            self.db.commit()
            
            # Log analytics update
            logger.info(
                "user_analytics_updated",
                user_id=user_id,
                total_deposited=total_deposited,
                total_yield_earned=total_yield_earned,
                current_tvl=current_tvl,
                average_apy=average_apy
            )
            
        except Exception as e:
            logger.error("Failed to update user analytics", error=str(e))
            self.db.rollback()
    
    async def update_system_metrics(self):
        """Update system-wide metrics"""
        try:
            # Get all active strategies
            strategies = self.db.query(Strategy).filter(
                Strategy.is_active == True
            ).all()
            
            # Group by network
            network_stats = {}
            for strategy in strategies:
                network = strategy.network
                if network not in network_stats:
                    network_stats[network] = {
                        'count': 0,
                        'total_tvl': 0,
                        'total_apy': 0
                    }
                
                network_stats[network]['count'] += 1
                network_stats[network]['total_tvl'] += strategy.tvl
                network_stats[network]['total_apy'] += strategy.apy
            
            # Update Prometheus metrics
            for network, stats in network_stats.items():
                active_strategies.labels(network=network).set(stats['count'])
                total_tvl.labels(network=network).set(stats['total_tvl'])
                
                if stats['count'] > 0:
                    avg_apy = stats['total_apy'] / stats['count']
                    average_apy.labels(network=network).set(avg_apy)
            
            # Store in database
            for network, stats in network_stats.items():
                metrics = [
                    SystemMetrics(
                        metric_name='active_strategies',
                        metric_value=stats['count'],
                        network=network
                    ),
                    SystemMetrics(
                        metric_name='total_tvl',
                        metric_value=stats['total_tvl'],
                        network=network
                    )
                ]
                
                if stats['count'] > 0:
                    metrics.append(SystemMetrics(
                        metric_name='average_apy',
                        metric_value=stats['total_apy'] / stats['count'],
                        network=network
                    ))
                
                for metric in metrics:
                    self.db.add(metric)
            
            self.db.commit()
            
            logger.info(
                "system_metrics_updated",
                network_stats=network_stats
            )
            
        except Exception as e:
            logger.error("Failed to update system metrics", error=str(e))
            self.db.rollback()
    
    async def create_alert(
        self, 
        user_id: int, 
        alert_type: str, 
        title: str, 
        message: str,
        severity: str = "info",
        metadata: Dict[str, Any] = None
    ):
        """Create an alert"""
        try:
            alert = Alert(
                user_id=user_id,
                alert_type=alert_type,
                title=title,
                message=message,
                severity=severity,
                metadata=metadata or {}
            )
            self.db.add(alert)
            self.db.commit()
            
            # Log alert creation
            logger.info(
                "alert_created",
                user_id=user_id,
                alert_type=alert_type,
                title=title,
                severity=severity
            )
            
        except Exception as e:
            logger.error("Failed to create alert", error=str(e))
            self.db.rollback()
    
    async def get_user_analytics(self, user_id: int) -> Dict[str, Any]:
        """Get user analytics"""
        try:
            analytics = self.db.query(UserAnalytics).filter(
                UserAnalytics.user_id == user_id
            ).first()
            
            if not analytics:
                return {
                    "total_deposited": 0,
                    "total_withdrawn": 0,
                    "total_yield_earned": 0,
                    "current_tvl": 0,
                    "average_apy": 0.0,
                    "last_updated": None
                }
            
            return {
                "total_deposited": analytics.total_deposited,
                "total_withdrawn": analytics.total_withdrawn,
                "total_yield_earned": analytics.total_yield_earned,
                "current_tvl": analytics.current_tvl,
                "average_apy": analytics.average_apy,
                "last_updated": analytics.last_updated.isoformat() if analytics.last_updated else None
            }
            
        except Exception as e:
            logger.error("Failed to get user analytics", error=str(e))
            return {}
    
    async def get_system_analytics(self, days: int = 7) -> Dict[str, Any]:
        """Get system analytics"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get metrics from database
            metrics = self.db.query(SystemMetrics).filter(
                SystemMetrics.timestamp >= start_date
            ).all()
            
            # Process metrics
            analytics = {
                "total_strategies": 0,
                "total_tvl": 0,
                "average_apy": 0.0,
                "network_breakdown": {},
                "daily_metrics": []
            }
            
            for metric in metrics:
                if metric.metric_name == 'active_strategies':
                    analytics["total_strategies"] += int(metric.metric_value)
                elif metric.metric_name == 'total_tvl':
                    analytics["total_tvl"] += int(metric.metric_value)
                elif metric.metric_name == 'average_apy':
                    analytics["average_apy"] = max(analytics["average_apy"], metric.metric_value)
            
            # Get network breakdown
            strategies = self.db.query(Strategy).filter(
                Strategy.is_active == True
            ).all()
            
            for strategy in strategies:
                network = strategy.network
                if network not in analytics["network_breakdown"]:
                    analytics["network_breakdown"][network] = {
                        "count": 0,
                        "tvl": 0,
                        "average_apy": 0.0
                    }
                
                analytics["network_breakdown"][network]["count"] += 1
                analytics["network_breakdown"][network]["tvl"] += strategy.tvl
                analytics["network_breakdown"][network]["average_apy"] += strategy.apy
            
            # Calculate averages
            for network_data in analytics["network_breakdown"].values():
                if network_data["count"] > 0:
                    network_data["average_apy"] /= network_data["count"]
            
            return analytics
            
        except Exception as e:
            logger.error("Failed to get system analytics", error=str(e))
            return {}
    
    async def get_yield_trends(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get yield trends over time"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get yield data
            yield_data = self.db.query(YieldData).filter(
                YieldData.timestamp >= start_date
            ).order_by(YieldData.timestamp.asc()).all()
            
            # Group by date
            daily_trends = {}
            for data in yield_data:
                date_key = data.timestamp.date().isoformat()
                if date_key not in daily_trends:
                    daily_trends[date_key] = {
                        "date": date_key,
                        "total_apy": 0.0,
                        "count": 0,
                        "total_tvl": 0
                    }
                
                daily_trends[date_key]["total_apy"] += data.apy
                daily_trends[date_key]["count"] += 1
                daily_trends[date_key]["total_tvl"] += data.tvl
            
            # Calculate averages
            trends = []
            for date_key, data in daily_trends.items():
                if data["count"] > 0:
                    trends.append({
                        "date": data["date"],
                        "average_apy": data["total_apy"] / data["count"],
                        "total_tvl": data["total_tvl"]
                    })
            
            return sorted(trends, key=lambda x: x["date"])
            
        except Exception as e:
            logger.error("Failed to get yield trends", error=str(e))
            return []
    
    async def check_risk_alerts(self):
        """Check for risk-related alerts"""
        try:
            # Get strategies with high risk
            high_risk_strategies = self.db.query(Strategy).filter(
                Strategy.risk_score > 0.8,
                Strategy.is_active == True
            ).all()
            
            for strategy in high_risk_strategies:
                await self.create_alert(
                    user_id=None,  # System alert
                    alert_type="high_risk",
                    title=f"High Risk Strategy: {strategy.name}",
                    message=f"Strategy {strategy.name} has a risk score of {strategy.risk_score:.2f}",
                    severity="warning",
                    metadata={"strategy_id": strategy.id, "risk_score": strategy.risk_score}
                )
            
            # Check for yield drops
            recent_yields = self.db.query(YieldData).filter(
                YieldData.timestamp >= datetime.utcnow() - timedelta(hours=1)
            ).all()
            
            for yield_data in recent_yields:
                if yield_data.apy < 0.01:  # Less than 1% APY
                    await self.create_alert(
                        user_id=None,
                        alert_type="yield_drop",
                        title=f"Low Yield Alert: {yield_data.strategy.name}",
                        message=f"Strategy {yield_data.strategy.name} has dropped to {yield_data.apy:.2%} APY",
                        severity="info",
                        metadata={"strategy_id": yield_data.strategy_id, "apy": yield_data.apy}
                    )
            
        except Exception as e:
            logger.error("Failed to check risk alerts", error=str(e))
    
    async def _store_optimization_metric(
        self, 
        user_id: int, 
        protocol: str, 
        network: str, 
        duration: float,
        success: bool,
        metadata: Dict[str, Any]
    ):
        """Store optimization metric in database"""
        try:
            metric = SystemMetrics(
                metric_name='optimization_duration',
                metric_value=duration,
                network=network,
                metadata={
                    'user_id': user_id,
                    'protocol': protocol,
                    'success': success,
                    **metadata
                }
            )
            self.db.add(metric)
            self.db.commit()
            
        except Exception as e:
            logger.error("Failed to store optimization metric", error=str(e))
            self.db.rollback()
