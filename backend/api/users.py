from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core.database import get_db
from core.auth import verify_password, get_password_hash, create_access_token, decode_access_token
from core.config import get_settings
from datetime import timedelta
from models import models
from pydantic import BaseModel
from typing import List, Optional
from services.telegram_service import telegram_service

settings = get_settings()

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str = "user"

class UserOut(UserBase):
    id: int
    role: str
    status: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TelegramLoginRequest(BaseModel):
    phone: str

class TelegramVerifyRequest(BaseModel):
    phone: str
    code: str
    phone_code_hash: str

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    username: str = payload.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Try to find user by email first, then username
    user = db.query(models.User).filter(
        (models.User.email == form_data.username) | (models.User.username == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email/username or password")
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # For security reasons, don't reveal if user exists
        return {"message": "If this email is registered, a password reset link has been sent."}
    
    # Generate a simple token for demonstration (in production use a secure random token)
    reset_token = create_access_token(data={"sub": user.username, "type": "password_reset"}, expires_delta=timedelta(hours=1))
    reset_link = f"http://localhost:3001/reset-password?token={reset_token}"
    
    # LOG THE LINK (Development only)
    print(f"\n[PASSWORD RECOVERY] Reset link for {user.email}: {reset_link}\n")
    
    return {"message": "If this email is registered, a password reset link has been sent."}

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = decode_access_token(request.token)
    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    username = payload.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Password successfully updated. You can now log in."}

@router.post("/register", response_model=UserOut)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    
    new_user = models.User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/auth/telegram/send-code")
async def send_telegram_code(request: TelegramLoginRequest):
    try:
        result = await telegram_service.send_code(request.phone)
        return {"phone_code_hash": result.phone_code_hash}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/auth/telegram/verify", response_model=Token)
async def verify_telegram_code(request: TelegramVerifyRequest, db: Session = Depends(get_db)):
    try:
        user_data, session_str = await telegram_service.sign_in(
            request.phone, 
            request.phone_code_hash, 
            request.code
        )
        
        # Find or create user
        user = db.query(models.User).filter(models.User.telegram_id == user_data.id).first()
        if not user:
            # Check by phone as fallback
            user = db.query(models.User).filter(models.User.phone == request.phone).first()
            if not user:
                user = models.User(
                    telegram_id=user_data.id,
                    phone=request.phone,
                    username=user_data.username or f"user_{user_data.id}",
                    role="user"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                user.telegram_id = user_data.id
                db.commit()
        
        # Link Telegram Account session
        account = db.query(models.Account).filter(models.Account.phone == request.phone).first()
        if not account:
            account = models.Account(
                phone=request.phone,
                api_id=settings.TELEGRAM_API_ID,
                api_hash=settings.TELEGRAM_API_HASH,
                session_name=session_str,
                owner_id=user.id
            )
            db.add(account)
        else:
            account.session_name = session_str
            account.owner_id = user.id
        
        db.commit()

        access_token = create_access_token(data={"sub": user.username or str(user.telegram_id), "role": user.role})
        return {"access_token": access_token, "token_type": "bearer", "role": user.role}

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user
