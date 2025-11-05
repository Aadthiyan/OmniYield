from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import asyncio
import logging

# Import bridge service (assuming it's available in the backend)
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'src'))
    from services.bridgeService import BridgeService
    bridge_service = BridgeService()
except ImportError:
    # Fallback for when bridge service is not available
    bridge_service = None

router = APIRouter(prefix="/bridge", tags=["bridge"])

# Request/Response Models
class CrossChainTransferRequest(BaseModel):
    token: str = Field(..., description="Token contract address")
    amount: str = Field(..., description="Amount to transfer (in wei)")
    to: str = Field(..., description="Destination address")
    srcChain: str = Field(..., description="Source chain identifier")
    dstChain: str = Field(..., description="Destination chain identifier")
    privateKey: str = Field(..., description="Private key for signing transactions")

class BurnAndReleaseRequest(BaseModel):
    wrappedToken: str = Field(..., description="Wrapped token contract address")
    amount: str = Field(..., description="Amount to burn (in wei)")
    to: str = Field(..., description="Destination address")
    srcChain: str = Field(..., description="Source chain identifier")
    dstChain: str = Field(..., description="Destination chain identifier")
    privateKey: str = Field(..., description="Private key for signing transactions")

class TransferStatusRequest(BaseModel):
    transferId: str = Field(..., description="Transfer ID to check status")
    protocol: Optional[str] = Field(None, description="Protocol to check (wormhole/chainbridge)")

class BridgeResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    message: Optional[str] = None

@router.get("/protocol")
async def get_bridge_protocol():
    """Get current bridge protocol configuration"""
    if not bridge_service:
        raise HTTPException(status_code=503, detail="Bridge service not available")
    
    return {
        "protocol": bridge_service.getProtocol(),
        "supportedChains": bridge_service.getSupportedChains(),
        "wrappedTokenConfig": bridge_service.getWrappedTokenConfig()
    }

@router.get("/chains")
async def get_supported_chains():
    """Get list of supported chains for cross-chain transfers"""
    if not bridge_service:
        raise HTTPException(status_code=503, detail="Bridge service not available")
    
    return {
        "chains": bridge_service.getSupportedChains(),
        "protocol": bridge_service.getProtocol()
    }

@router.post("/transfer/lock-and-mint", response_model=BridgeResponse)
async def lock_and_mint(request: CrossChainTransferRequest):
    """Initiate cross-chain transfer by locking tokens and minting wrapped tokens"""
    if not bridge_service:
        raise HTTPException(status_code=503, detail="Bridge service not available")
    
    try:
        # Validate transfer parameters
        validation = bridge_service.validateTransferParams({
            "token": request.token,
            "amount": int(request.amount),
            "to": request.to,
            "srcChain": request.srcChain,
            "dstChain": request.dstChain
        })
        
        if not validation["valid"]:
            return BridgeResponse(
                success=False,
                error="Validation failed",
                message="; ".join(validation["errors"])
            )
        
        # Execute lock and mint operation
        result = await bridge_service.lockAndMint({
            "token": request.token,
            "amount": int(request.amount),
            "to": request.to,
            "srcChain": request.srcChain,
            "dstChain": request.dstChain,
            "privateKey": request.privateKey
        })
        
        return BridgeResponse(
            success=True,
            data=result,
            message="Cross-chain transfer initiated successfully"
        )
        
    except Exception as e:
        logging.error(f"Lock and mint failed: {str(e)}")
        return BridgeResponse(
            success=False,
            error="Transfer failed",
            message=str(e)
        )

@router.post("/transfer/burn-and-release", response_model=BridgeResponse)
async def burn_and_release(request: BurnAndReleaseRequest):
    """Initiate cross-chain transfer by burning wrapped tokens and releasing original tokens"""
    if not bridge_service:
        raise HTTPException(status_code=503, detail="Bridge service not available")
    
    try:
        # Validate transfer parameters
        validation = bridge_service.validateTransferParams({
            "token": request.wrappedToken,
            "amount": int(request.amount),
            "to": request.to,
            "srcChain": request.srcChain,
            "dstChain": request.dstChain
        })
        
        if not validation["valid"]:
            return BridgeResponse(
                success=False,
                error="Validation failed",
                message="; ".join(validation["errors"])
            )
        
        # Execute burn and release operation
        result = await bridge_service.burnAndRelease({
            "wrappedToken": request.wrappedToken,
            "amount": int(request.amount),
            "to": request.to,
            "srcChain": request.srcChain,
            "dstChain": request.dstChain,
            "privateKey": request.privateKey
        })
        
        return BridgeResponse(
            success=True,
            data=result,
            message="Cross-chain burn and release initiated successfully"
        )
        
    except Exception as e:
        logging.error(f"Burn and release failed: {str(e)}")
        return BridgeResponse(
            success=False,
            error="Transfer failed",
            message=str(e)
        )

@router.get("/transfer/status/{transfer_id}")
async def get_transfer_status(transfer_id: str, protocol: Optional[str] = None):
    """Get status of a cross-chain transfer"""
    if not bridge_service:
        raise HTTPException(status_code=503, detail="Bridge service not available")
    
    try:
        result = await bridge_service.getTransferStatus(transfer_id, protocol)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logging.error(f"Failed to get transfer status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get transfer status: {str(e)}")

@router.post("/validate")
async def validate_transfer_params(request: CrossChainTransferRequest):
    """Validate cross-chain transfer parameters without executing the transfer"""
    if not bridge_service:
        raise HTTPException(status_code=503, detail="Bridge service not available")
    
    try:
        validation = bridge_service.validateTransferParams({
            "token": request.token,
            "amount": int(request.amount),
            "to": request.to,
            "srcChain": request.srcChain,
            "dstChain": request.dstChain
        })
        
        return {
            "success": True,
            "valid": validation["valid"],
            "errors": validation["errors"]
        }
    except Exception as e:
        logging.error(f"Validation failed: {str(e)}")
        return {
            "success": False,
            "valid": False,
            "errors": [str(e)]
        }

@router.get("/health")
async def bridge_health_check():
    """Health check for bridge service"""
    if not bridge_service:
        return {
            "status": "unhealthy",
            "message": "Bridge service not available"
        }
    
    try:
        # Test basic functionality
        protocol = bridge_service.getProtocol()
        chains = bridge_service.getSupportedChains()
        
        return {
            "status": "healthy",
            "protocol": protocol,
            "supportedChains": len(chains),
            "message": "Bridge service is operational"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"Bridge service error: {str(e)}"
        }

# Additional utility endpoints
@router.get("/fees/{src_chain}/{dst_chain}")
async def get_bridge_fees(src_chain: str, dst_chain: str):
    """Get estimated fees for cross-chain transfer"""
    # This would typically query the bridge protocol for current fees
    # For now, return mock data
    return {
        "srcChain": src_chain,
        "dstChain": dst_chain,
        "estimatedFees": {
            "gasFee": "0.001 ETH",
            "bridgeFee": "0.0005 ETH",
            "totalFee": "0.0015 ETH"
        },
        "estimatedTime": "10-15 minutes",
        "note": "Fees are estimates and may vary"
    }

@router.get("/history/{address}")
async def get_transfer_history(address: str, limit: int = 10):
    """Get transfer history for an address"""
    # This would typically query a database or blockchain for transfer history
    # For now, return mock data
    return {
        "address": address,
        "transfers": [],
        "message": "Transfer history not yet implemented"
    }
