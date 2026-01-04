from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.yield_optimizer import YieldOptimizer
from ..services.yield_data_service import YieldDataService
from ..services.analytics_service import AnalyticsService
from ..models import Strategy, UserAnalytics, SystemMetrics, YieldData, UserStrategy, User
from ..config import settings
from ..utils.auth import get_current_active_user as get_current_user
import logging
import time

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/yield", tags=["yield"])


class StrategyWeight(BaseModel):
    strategy_id: int
    weight: float = Field(..., ge=0.0, le=1.0)


class CreateStrategyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., min_length=1)  # compound, uniswap_v3, lending, staking, etc.
    contract_address: str = Field(..., min_length=42, max_length=42)  # Ethereum address
    network: str = Field(..., min_length=1)  # ethereum, polygon, bsc, etc.
    apy: float = Field(..., ge=0.0)
    tvl: int = Field(default=0, ge=0)
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    is_active: bool = True
    meta_data: Dict[str, Any] = {}


class OptimizeRequest(BaseModel):
    total_amount: int = Field(..., gt=0)
    strategies: List[StrategyWeight]
    risk_tolerance: float = Field(0.5, ge=0.0, le=1.0)
    max_slippage: float = Field(0.05, ge=0.0, le=1.0)


class OptimizeResponse(BaseModel):
    optimal_allocations: List[Dict[str, Any]]
    expected_apy: float
    risk_score: float
    total_amount: int
    created_at: datetime


class StrategyResponse(BaseModel):
    id: int
    name: str
    type: str
    contract_address: str
    network: str
    apy: float
    tvl: int
    risk_score: float
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class YieldDataResponse(BaseModel):
    id: int
    strategy_id: int
    apy: float
    tvl: int
    network: str
    timestamp: datetime
    metadata: Dict[str, Any]


class UserAnalyticsResponse(BaseModel):
    total_deposited: int
    total_withdrawn: int
    total_yield_earned: int
    current_tvl: int
    average_apy: float
    last_updated: Optional[datetime] = None


class SystemAnalyticsResponse(BaseModel):
    total_strategies: int
    total_tvl: int
    average_apy: float
    network_breakdown: Dict[str, Dict[str, Any]]
    daily_metrics: List[Dict[str, Any]]


class RebalanceRequest(BaseModel):
    user_id: int
    target_allocations: List[StrategyWeight]


class RebalanceResponse(BaseModel):
    rebalance_actions: List[Dict[str, Any]]
    estimated_gas_cost: int
    estimated_slippage: float


# Initialize services
yield_optimizer = None
yield_data_service = None
analytics_service = None


async def get_services(db: Session = Depends(get_db)):
    """Get service instances"""
    global yield_optimizer, yield_data_service, analytics_service
    
    if yield_optimizer is None:
        yield_optimizer = YieldOptimizer(db)
        await yield_optimizer.train_model()
    
    if yield_data_service is None:
        yield_data_service = YieldDataService(db)
        await yield_data_service.initialize()
    
    if analytics_service is None:
        analytics_service = AnalyticsService(db)
        await analytics_service.initialize()
    
    return yield_optimizer, yield_data_service, analytics_service


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_yield(
    request: OptimizeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Optimize yield allocation across strategies"""
    try:
        start_time = time.time()
        
        # Get services
        optimizer, _, analytics = await get_services(db)
        
        # Validate request
        if len(request.strategies) == 0:
            raise HTTPException(status_code=400, detail="At least one strategy required")
        
        if sum(s.weight for s in request.strategies) > 1.0:
            raise HTTPException(status_code=400, detail="Total weight cannot exceed 1.0")
        
        # Convert to internal format
        strategies = [
            {
                "strategy_id": s.strategy_id,
                "weight": s.weight
            }
            for s in request.strategies
        ]
        
        # Optimize
        result = await optimizer.optimize_allocations(
            user_id=current_user.id,
            total_amount=request.total_amount,
            strategies=strategies,
            risk_tolerance=request.risk_tolerance,
            max_slippage=request.max_slippage
        )
        
        # Log analytics
        duration = time.time() - start_time
        background_tasks.add_task(
            analytics.log_yield_optimization,
            user_id=current_user.id,
            protocol="yield_optimizer",
            network="ethereum",
            duration=duration,
            success=True,
            metadata={"total_amount": request.total_amount, "strategy_count": len(strategies)}
        )
        
        return OptimizeResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Yield optimization failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/strategies", response_model=List[StrategyResponse])
async def get_strategies(
    network: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get available strategies"""
    try:
        query = db.query(Strategy)
        
        if network:
            query = query.filter(Strategy.network == network)
        
        if active_only:
            query = query.filter(Strategy.is_active == True)
        
        strategies = query.order_by(Strategy.apy.desc()).all()
        
        response_strategies = []
        for strategy in strategies:
            try:
                response_strategies.append(
                    StrategyResponse(
                        id=strategy.id,
                        name=strategy.name,
                        type=strategy.type,
                        contract_address=strategy.contract_address,
                        network=strategy.network,
                        apy=float(strategy.apy),
                        tvl=int(strategy.tvl),
                        risk_score=float(strategy.risk_score),
                        is_active=strategy.is_active,
                        created_at=strategy.created_at,
                        updated_at=strategy.updated_at
                    )
                )
            except Exception as strategy_error:
                logger.error(f"Error converting strategy {strategy.id}: {strategy_error}")
                raise
        
        return response_strategies
        
    except Exception as e:
        logger.error(f"Failed to get strategies: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get strategies: {str(e)}")


@router.get("/user-strategies", response_model=List[StrategyResponse])
async def get_user_strategies(
    network: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get strategies for the authenticated user"""
    try:
        # Query user's strategies by joining UserStrategy and Strategy tables
        query = db.query(Strategy).join(
            UserStrategy, 
            Strategy.id == UserStrategy.strategy_id
        ).filter(
            UserStrategy.user_id == current_user.id
        )
        
        if network:
            query = query.filter(Strategy.network == network)
        
        if active_only:
            query = query.filter(
                Strategy.is_active == True,
                UserStrategy.is_active == True
            )
        
        strategies = query.order_by(Strategy.apy.desc()).all()
        
        response_strategies = []
        for strategy in strategies:
            try:
                response_strategies.append(
                    StrategyResponse(
                        id=strategy.id,
                        name=strategy.name,
                        type=strategy.type,
                        contract_address=strategy.contract_address,
                        network=strategy.network,
                        apy=float(strategy.apy),
                        tvl=int(strategy.tvl),
                        risk_score=float(strategy.risk_score),
                        is_active=strategy.is_active,
                        created_at=strategy.created_at,
                        updated_at=strategy.updated_at
                    )
                )
            except Exception as strategy_error:
                logger.error(f"Error converting strategy {strategy.id}: {strategy_error}")
                raise
        
        logger.info(f"Retrieved {len(response_strategies)} strategies for user {current_user.id}")
        return response_strategies
        
    except Exception as e:
        logger.error(f"Failed to get user strategies: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get user strategies: {str(e)}")


@router.post("/strategies", response_model=StrategyResponse)
async def create_strategy(
    request: CreateStrategyRequest,
    db: Session = Depends(get_db)
):
    """Create a new strategy (admin only)"""
    try:
        # Check if strategy already exists
        existing = db.query(Strategy).filter(
            Strategy.contract_address == request.contract_address
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Strategy with this contract address already exists")
        
        # Create new strategy
        new_strategy = Strategy(
            name=request.name,
            type=request.type,
            contract_address=request.contract_address,
            network=request.network,
            apy=request.apy,
            tvl=request.tvl,
            risk_score=request.risk_score,
            is_active=request.is_active,
            meta_data=request.meta_data
        )
        
        db.add(new_strategy)
        db.commit()
        db.refresh(new_strategy)
        
        logger.info(f"Created new strategy: {new_strategy.name} ({new_strategy.id})")
        
        return StrategyResponse(
            id=new_strategy.id,
            name=new_strategy.name,
            type=new_strategy.type,
            contract_address=new_strategy.contract_address,
            network=new_strategy.network,
            apy=new_strategy.apy,
            tvl=new_strategy.tvl,
            risk_score=new_strategy.risk_score,
            is_active=new_strategy.is_active,
            created_at=new_strategy.created_at,
            updated_at=new_strategy.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create strategy: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/strategies/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(strategy_id: int, db: Session = Depends(get_db)):
    """Get specific strategy details"""
    try:
        strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        return StrategyResponse(
            id=strategy.id,
            name=strategy.name,
            type=strategy.type,
            contract_address=strategy.contract_address,
            network=strategy.network,
            apy=strategy.apy,
            tvl=strategy.tvl,
            risk_score=strategy.risk_score,
            is_active=strategy.is_active,
            created_at=strategy.created_at,
            updated_at=strategy.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get strategy: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/strategies/{strategy_id}", response_model=StrategyResponse)
async def update_strategy(
    strategy_id: int,
    request: CreateStrategyRequest,
    db: Session = Depends(get_db)
):
    """Update an existing strategy"""
    try:
        strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        # Update fields
        strategy.name = request.name
        strategy.type = request.type
        strategy.apy = request.apy
        strategy.tvl = request.tvl
        strategy.risk_score = request.risk_score
        strategy.is_active = request.is_active
        strategy.meta_data = request.meta_data
        
        db.commit()
        db.refresh(strategy)
        
        logger.info(f"Updated strategy: {strategy.name} ({strategy.id})")
        
        return StrategyResponse(
            id=strategy.id,
            name=strategy.name,
            type=strategy.type,
            contract_address=strategy.contract_address,
            network=strategy.network,
            apy=strategy.apy,
            tvl=strategy.tvl,
            risk_score=strategy.risk_score,
            is_active=strategy.is_active,
            created_at=strategy.created_at,
            updated_at=strategy.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update strategy: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/yield-data", response_model=List[YieldDataResponse])
async def get_yield_data(
    strategy_id: Optional[int] = None,
    network: Optional[str] = None,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get yield data"""
    try:
        _, yield_service, _ = await get_services(db)
        
        if strategy_id:
            yield_data = await yield_service.get_yield_history(strategy_id, days)
        else:
            # Get all yield data
            start_date = datetime.utcnow() - timedelta(days=days)
            yield_data = db.query(YieldData).filter(
                YieldData.timestamp >= start_date
            ).order_by(YieldData.timestamp.desc()).all()
            
            yield_data = [
                YieldDataResponse(
                    id=data.id,
                    strategy_id=data.strategy_id,
                    apy=data.apy,
                    tvl=data.tvl,
                    network=data.network,
                    timestamp=data.timestamp,
                    metadata=data.metadata
                )
                for data in yield_data
            ]
        
        return yield_data
        
    except Exception as e:
        logger.error(f"Failed to get yield data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/top-yields", response_model=List[Dict[str, Any]])
async def get_top_yields(
    limit: int = 10,
    network: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get top yielding strategies"""
    try:
        _, yield_service, _ = await get_services(db)
        
        top_yields = await yield_service.get_top_yields(limit)
        
        if network:
            top_yields = [y for y in top_yields if y['network'] == network]
        
        return top_yields[:limit]
        
    except Exception as e:
        logger.error(f"Failed to get top yields: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/analytics/user/{user_id}", response_model=UserAnalyticsResponse)
async def get_user_analytics(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get user analytics"""
    try:
        _, _, analytics = await get_services(db)
        
        user_analytics = await analytics.get_user_analytics(user_id)
        
        return UserAnalyticsResponse(**user_analytics)
        
    except Exception as e:
        logger.error(f"Failed to get user analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/analytics/system", response_model=SystemAnalyticsResponse)
async def get_system_analytics(
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get system analytics"""
    try:
        _, _, analytics = await get_services(db)
        
        system_analytics = await analytics.get_system_analytics(days)
        
        return SystemAnalyticsResponse(**system_analytics)
        
    except Exception as e:
        logger.error(f"Failed to get system analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/trends", response_model=List[Dict[str, Any]])
async def get_yield_trends(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get yield trends over time"""
    try:
        _, _, analytics = await get_services(db)
        
        trends = await analytics.get_yield_trends(days)
        
        return trends
        
    except Exception as e:
        logger.error(f"Failed to get yield trends: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/rebalance", response_model=RebalanceResponse)
async def rebalance_portfolio(
    request: RebalanceRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rebalance user portfolio"""
    try:
        optimizer, _, analytics = await get_services(db)
        
        # Get current allocations
        current_allocations = db.query(UserStrategy).filter(
            UserStrategy.user_id == current_user.id,
            UserStrategy.is_active == True
        ).all()
        
        current = [
            {
                "strategy_id": us.strategy_id,
                "amount": us.amount
            }
            for us in current_allocations
        ]
        
        target = [
            {
                "strategy_id": s.strategy_id,
                "amount": 0  # Will be calculated
            }
            for s in request.target_allocations
        ]
        
        # Calculate rebalancing actions
        rebalance_actions = await optimizer.rebalance_portfolio(
            user_id=current_user.id,
            current_allocations=current,
            target_allocations=target
        )
        
        # Estimate gas cost and slippage
        estimated_gas_cost = len(rebalance_actions) * 100000  # 100k gas per action
        estimated_slippage = 0.01  # 1% estimated slippage
        
        return RebalanceResponse(
            rebalance_actions=rebalance_actions,
            estimated_gas_cost=estimated_gas_cost,
            estimated_slippage=estimated_slippage
        )
        
    except Exception as e:
        logger.error(f"Failed to rebalance portfolio: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/refresh-data")
async def refresh_yield_data(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Refresh yield data from external sources"""
    try:
        _, yield_service, _ = await get_services(db)
        
        # Run in background
        background_tasks.add_task(yield_service.fetch_all_yield_data)
        
        return {"message": "Yield data refresh initiated"}
        
    except Exception as e:
        logger.error(f"Failed to refresh yield data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION
    }





