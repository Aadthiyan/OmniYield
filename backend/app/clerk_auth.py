"""
Clerk authentication module for verifying JWT tokens from Clerk
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import httpx
from app.config import settings
from app.database import get_db
from app.models import User
from sqlalchemy.orm import Session

security = HTTPBearer()

# Cache for Clerk's public keys
_jwks_cache = None
_jwks_cache_timestamp = None
JWKS_CACHE_TTL = 3600  # 1 hour


async def get_clerk_jwks():
    """Fetch Clerk's JWKS (JSON Web Key Set) for token verification"""
    global _jwks_cache, _jwks_cache_timestamp
    from time import time
    
    current_time = time()
    if _jwks_cache and _jwks_cache_timestamp and (current_time - _jwks_cache_timestamp < JWKS_CACHE_TTL):
        return _jwks_cache
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://clerk.accounts.google.com/.well-known/jwks.json")
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_timestamp = current_time
        return _jwks_cache


async def verify_clerk_token(credentials: HTTPAuthCredentials = Depends(security)):
    """
    Verify and decode Clerk JWT token
    """
    try:
        import jwt
        from jwt import PyJWKClient
        
        if not settings.CLERK_SECRET_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Clerk secret key not configured"
            )
        
        token = credentials.credentials
        
        # Use Clerk's JWKS endpoint for token verification
        jwks_client = PyJWKClient(f"https://clerk.accounts.google.com/.well-known/jwks.json")
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        
        return payload
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    payload: dict = Depends(verify_clerk_token),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current authenticated user from Clerk JWT payload
    """
    try:
        # Extract user ID from Clerk JWT
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token - no user ID"
            )
        
        # Get or create user in database
        user = db.query(User).filter(User.clerk_user_id == user_id).first()
        
        if not user:
            # Create new user from Clerk data
            email = payload.get("email", "")
            name = payload.get("name", "Unknown")
            
            user = User(
                clerk_user_id=user_id,
                email=email,
                name=name,
                isActive=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        return user
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to retrieve user information"
        )
