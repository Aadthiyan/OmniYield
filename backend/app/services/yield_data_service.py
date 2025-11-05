import asyncio
import aiohttp
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
from sqlalchemy.orm import Session
from ..models import Strategy, YieldData, SystemMetrics
from ..config import settings
import redis.asyncio as redis

logger = logging.getLogger(__name__)


class YieldDataService:
    """Service for fetching and managing real-time yield data"""
    
    def __init__(self, db: Session):
        self.db = db
        self.redis_client = None
        self.session = None
        
    async def initialize(self):
        """Initialize the service"""
        try:
            # Initialize Redis client
            self.redis_client = redis.from_url(settings.REDIS_URL)
            
            # Initialize HTTP session
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={
                    'User-Agent': 'DeFi-Yield-Aggregator/1.0',
                    'Accept': 'application/json'
                }
            )
            
            logger.info("Yield data service initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize yield data service: {e}")
            raise
    
    async def close(self):
        """Close connections"""
        if self.session:
            await self.session.close()
        if self.redis_client:
            await self.redis_client.close()
    
    async def fetch_all_yield_data(self) -> Dict[str, Any]:
        """Fetch yield data from all sources"""
        try:
            tasks = [
                self._fetch_compound_yields(),
                self._fetch_uniswap_v3_yields(),
                self._fetch_staking_yields(),
                self._fetch_aave_yields(),
                self._fetch_curve_yields()
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            all_yields = {}
            for result in results:
                if isinstance(result, dict):
                    all_yields.update(result)
                elif isinstance(result, Exception):
                    logger.error(f"Failed to fetch yield data: {result}")
            
            # Cache results
            await self._cache_yield_data(all_yields)
            
            # Update database
            await self._update_database_yields(all_yields)
            
            return all_yields
            
        except Exception as e:
            logger.error(f"Failed to fetch all yield data: {e}")
            return {}
    
    async def _fetch_compound_yields(self) -> Dict[str, Any]:
        """Fetch Compound protocol yields"""
        try:
            # Compound API endpoints
            compound_api = "https://api.compound.finance/api/v2/ctoken"
            
            async with self.session.get(compound_api) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    yields = {}
                    for token in data.get('cToken', []):
                        if token.get('total_supply', {}).get('value', '0') != '0':
                            symbol = token.get('symbol', '')
                            apy = float(token.get('supply_rate', {}).get('value', 0))
                            tvl = float(token.get('total_supply', {}).get('value', 0))
                            
                            yields[f"compound_{symbol.lower()}"] = {
                                'protocol': 'compound',
                                'symbol': symbol,
                                'apy': apy,
                                'tvl': int(tvl),
                                'network': 'ethereum',
                                'timestamp': datetime.utcnow().isoformat()
                            }
                    
                    return yields
                else:
                    logger.warning(f"Compound API returned status {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Failed to fetch Compound yields: {e}")
            return {}
    
    async def _fetch_uniswap_v3_yields(self) -> Dict[str, Any]:
        """Fetch Uniswap V3 yields"""
        try:
            # Uniswap V3 subgraph
            subgraph_url = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"
            
            query = """
            {
                pools(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
                    id
                    token0 {
                        symbol
                    }
                    token1 {
                        symbol
                    }
                    totalValueLockedUSD
                    feeTier
                    liquidity
                }
            }
            """
            
            payload = {"query": query}
            
            async with self.session.post(subgraph_url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    yields = {}
                    for pool in data.get('data', {}).get('pools', []):
                        if pool.get('totalValueLockedUSD', '0') != '0':
                            pool_id = pool.get('id', '')
                            symbol = f"{pool['token0']['symbol']}-{pool['token1']['symbol']}"
                            
                            # Calculate estimated APY (simplified)
                            tvl = float(pool.get('totalValueLockedUSD', 0))
                            fee_tier = int(pool.get('feeTier', 0))
                            estimated_apy = (fee_tier / 10000) * 0.1  # Simplified calculation
                            
                            yields[f"uniswap_v3_{pool_id}"] = {
                                'protocol': 'uniswap_v3',
                                'symbol': symbol,
                                'apy': estimated_apy,
                                'tvl': int(tvl),
                                'network': 'ethereum',
                                'timestamp': datetime.utcnow().isoformat(),
                                'metadata': {
                                    'pool_id': pool_id,
                                    'fee_tier': fee_tier
                                }
                            }
                    
                    return yields
                else:
                    logger.warning(f"Uniswap V3 API returned status {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Failed to fetch Uniswap V3 yields: {e}")
            return {}
    
    async def _fetch_staking_yields(self) -> Dict[str, Any]:
        """Fetch staking yields"""
        try:
            # Ethereum 2.0 staking yields
            beacon_api = "https://beaconcha.in/api/v1/validator/stats"
            
            async with self.session.get(beacon_api) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    yields = {}
                    if data.get('status') == 'OK':
                        # Calculate staking yield
                        total_validators = data.get('data', {}).get('total_validators', 0)
                        total_eth = data.get('data', {}).get('total_eth', 0)
                        
                        if total_validators > 0 and total_eth > 0:
                            # Simplified staking yield calculation
                            staking_yield = 0.05  # 5% base rate
                            
                            yields['ethereum_staking'] = {
                                'protocol': 'staking',
                                'symbol': 'ETH2',
                                'apy': staking_yield,
                                'tvl': int(total_eth * 1e18),  # Convert to wei
                                'network': 'ethereum',
                                'timestamp': datetime.utcnow().isoformat(),
                                'metadata': {
                                    'total_validators': total_validators,
                                    'total_eth': total_eth
                                }
                            }
                    
                    return yields
                else:
                    logger.warning(f"Beacon API returned status {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Failed to fetch staking yields: {e}")
            return {}
    
    async def _fetch_aave_yields(self) -> Dict[str, Any]:
        """Fetch Aave protocol yields"""
        try:
            # Aave API
            aave_api = "https://aave-api-v2.aave.com/data/liquidity/v2"
            
            async with self.session.get(aave_api) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    yields = {}
                    for reserve in data.get('reserves', []):
                        if reserve.get('isActive', False):
                            symbol = reserve.get('symbol', '')
                            apy = float(reserve.get('liquidityRate', 0))
                            tvl = float(reserve.get('totalLiquidity', 0))
                            
                            yields[f"aave_{symbol.lower()}"] = {
                                'protocol': 'aave',
                                'symbol': symbol,
                                'apy': apy,
                                'tvl': int(tvl),
                                'network': 'ethereum',
                                'timestamp': datetime.utcnow().isoformat()
                            }
                    
                    return yields
                else:
                    logger.warning(f"Aave API returned status {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Failed to fetch Aave yields: {e}")
            return {}
    
    async def _fetch_curve_yields(self) -> Dict[str, Any]:
        """Fetch Curve protocol yields"""
        try:
            # Curve API
            curve_api = "https://api.curve.fi/api/getPools/ethereum"
            
            async with self.session.get(curve_api) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    yields = {}
                    for pool in data.get('data', {}).get('poolData', []):
                        if pool.get('totalSupply', 0) > 0:
                            name = pool.get('name', '')
                            apy = float(pool.get('apy', 0))
                            tvl = float(pool.get('totalSupply', 0))
                            
                            yields[f"curve_{name.lower().replace(' ', '_')}"] = {
                                'protocol': 'curve',
                                'symbol': name,
                                'apy': apy,
                                'tvl': int(tvl),
                                'network': 'ethereum',
                                'timestamp': datetime.utcnow().isoformat()
                            }
                    
                    return yields
                else:
                    logger.warning(f"Curve API returned status {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Failed to fetch Curve yields: {e}")
            return {}
    
    async def _cache_yield_data(self, yield_data: Dict[str, Any]):
        """Cache yield data in Redis"""
        try:
            if not self.redis_client:
                return
            
            cache_key = "yield_data:latest"
            cache_data = {
                'data': yield_data,
                'timestamp': datetime.utcnow().isoformat(),
                'count': len(yield_data)
            }
            
            await self.redis_client.setex(
                cache_key, 
                settings.CACHE_TTL, 
                json.dumps(cache_data)
            )
            
            logger.info(f"Cached {len(yield_data)} yield data entries")
            
        except Exception as e:
            logger.error(f"Failed to cache yield data: {e}")
    
    async def _update_database_yields(self, yield_data: Dict[str, Any]):
        """Update database with new yield data"""
        try:
            for key, data in yield_data.items():
                # Find or create strategy
                strategy = self.db.query(Strategy).filter(
                    Strategy.contract_address == data.get('contract_address', ''),
                    Strategy.network == data.get('network', 'ethereum')
                ).first()
                
                if not strategy:
                    # Create new strategy
                    strategy = Strategy(
                        name=data.get('symbol', key),
                        type=data.get('protocol', 'unknown'),
                        contract_address=data.get('contract_address', ''),
                        network=data.get('network', 'ethereum'),
                        apy=data.get('apy', 0.0),
                        tvl=data.get('tvl', 0),
                        risk_score=self._calculate_risk_score(data),
                        metadata=data.get('metadata', {})
                    )
                    self.db.add(strategy)
                    self.db.flush()
                
                # Update strategy data
                strategy.apy = data.get('apy', 0.0)
                strategy.tvl = data.get('tvl', 0)
                strategy.updated_at = datetime.utcnow()
                
                # Create yield data entry
                yield_entry = YieldData(
                    strategy_id=strategy.id,
                    apy=data.get('apy', 0.0),
                    tvl=data.get('tvl', 0),
                    network=data.get('network', 'ethereum'),
                    metadata=data.get('metadata', {})
                )
                self.db.add(yield_entry)
            
            self.db.commit()
            logger.info(f"Updated database with {len(yield_data)} yield entries")
            
        except Exception as e:
            logger.error(f"Failed to update database yields: {e}")
            self.db.rollback()
    
    def _calculate_risk_score(self, data: Dict[str, Any]) -> float:
        """Calculate risk score for a strategy"""
        try:
            # Base risk score
            risk_score = 0.5
            
            # Adjust based on protocol
            protocol = data.get('protocol', '')
            if protocol in ['compound', 'aave']:
                risk_score -= 0.2  # Lower risk
            elif protocol in ['curve']:
                risk_score -= 0.1
            elif protocol in ['uniswap_v3']:
                risk_score += 0.1  # Higher risk
            
            # Adjust based on TVL
            tvl = data.get('tvl', 0)
            if tvl > 1000000000000000000000000:  # > 1M ETH
                risk_score -= 0.1
            elif tvl < 10000000000000000000000:  # < 10K ETH
                risk_score += 0.1
            
            # Adjust based on APY
            apy = data.get('apy', 0)
            if apy > 0.2:  # > 20% APY
                risk_score += 0.2
            elif apy < 0.05:  # < 5% APY
                risk_score -= 0.1
            
            return max(0.0, min(1.0, risk_score))  # Clamp between 0 and 1
            
        except Exception as e:
            logger.error(f"Failed to calculate risk score: {e}")
            return 0.5
    
    async def get_cached_yield_data(self) -> Optional[Dict[str, Any]]:
        """Get cached yield data from Redis"""
        try:
            if not self.redis_client:
                return None
            
            cache_key = "yield_data:latest"
            cached_data = await self.redis_client.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get cached yield data: {e}")
            return None
    
    async def get_yield_history(
        self, 
        strategy_id: int, 
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """Get yield history for a strategy"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            yield_data = self.db.query(YieldData).filter(
                YieldData.strategy_id == strategy_id,
                YieldData.timestamp >= start_date
            ).order_by(YieldData.timestamp.desc()).all()
            
            return [
                {
                    'apy': data.apy,
                    'tvl': data.tvl,
                    'timestamp': data.timestamp.isoformat(),
                    'metadata': data.metadata
                }
                for data in yield_data
            ]
            
        except Exception as e:
            logger.error(f"Failed to get yield history: {e}")
            return []
    
    async def get_top_yields(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top yielding strategies"""
        try:
            strategies = self.db.query(Strategy).filter(
                Strategy.is_active == True,
                Strategy.apy > 0
            ).order_by(Strategy.apy.desc()).limit(limit).all()
            
            return [
                {
                    'id': strategy.id,
                    'name': strategy.name,
                    'type': strategy.type,
                    'apy': strategy.apy,
                    'tvl': strategy.tvl,
                    'risk_score': strategy.risk_score,
                    'network': strategy.network
                }
                for strategy in strategies
            ]
            
        except Exception as e:
            logger.error(f"Failed to get top yields: {e}")
            return []
