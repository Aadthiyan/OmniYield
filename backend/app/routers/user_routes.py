from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User, UserResponse
from app.auth import create_access_token, get_current_user
from typing import Optional

router = APIRouter(prefix="/user", tags=["user"])

class LoginRequest(BaseModel):
    wallet_address: str
    signature: Optional[str] = None # Optional for now

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    # In a real production app, verify the signature using Web3 here.
    # e.g., w3.eth.account.recover_message(encode_defunct(text=msg), signature=sig)
    
    user = db.query(User).filter(User.wallet_address == request.wallet_address).first()
    if not user:
        user = User(wallet_address=request.wallet_address)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    access_token = create_access_token(data={"sub": user.wallet_address})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
