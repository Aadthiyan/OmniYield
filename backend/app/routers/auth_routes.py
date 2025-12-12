from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime

from app.database import get_db
from app.models import User
from app.schemas.auth import (
    UserSignUp, UserLogin, UserResponse, Token,
    PasswordReset, PasswordResetConfirm, ConnectWallet
)
from app.utils.auth import (
    get_password_hash, authenticate_user, create_access_token,
    generate_verification_token, get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserSignUp, db: Session = Depends(get_db)):
    """
    Register a new user with email and password
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    verification_token = generate_verification_token()
    
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        verification_token=verification_token,
        is_verified=False,  # Set to True for now, implement email verification later
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email, "user_id": new_user.id},
        expires_delta=access_token_expires
    )
    
    # TODO: Send verification email
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(new_user)
    }


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password
    """
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user information
    """
    return UserResponse.from_orm(current_user)


@router.post("/connect-wallet")
async def connect_wallet(
    wallet_data: ConnectWallet,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Connect a wallet to the user's account (optional feature)
    """
    # Check if wallet is already connected to another account
    existing_wallet = db.query(User).filter(
        User.wallet_address == wallet_data.wallet_address,
        User.id != current_user.id
    ).first()
    
    if existing_wallet:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wallet already connected to another account"
        )
    
    # Update user's wallet address
    current_user.wallet_address = wallet_data.wallet_address
    db.commit()
    
    return {
        "message": "Wallet connected successfully",
        "wallet_address": wallet_data.wallet_address
    }


@router.post("/disconnect-wallet")
async def disconnect_wallet(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Disconnect wallet from user's account
    """
    current_user.wallet_address = None
    db.commit()
    
    return {"message": "Wallet disconnected successfully"}


@router.post("/request-password-reset")
async def request_password_reset(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """
    Request a password reset email
    """
    user = db.query(User).filter(User.email == reset_data.email).first()
    
    # Don't reveal if email exists or not (security)
    if user:
        # Generate reset token
        reset_token = generate_verification_token()
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        
        # TODO: Send password reset email
    
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password using the reset token
    """
    user = db.query(User).filter(User.reset_token == reset_data.token).first()
    
    if not user or not user.reset_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    if datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Update password
    user.password_hash = get_password_hash(reset_data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """
    Logout (client should delete the token)
    """
    # In a stateless JWT system, logout is handled client-side
    # For added security, you could implement token blacklisting
    return {"message": "Logged out successfully"}
