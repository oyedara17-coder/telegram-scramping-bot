from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from api.users import get_current_user
from models import models
from services.telegram_service import telegram_service
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class AccountCreate(BaseModel):
    phone: str

class LoginConfirm(BaseModel):
    phone: str
    phone_code_hash: str
    code: str

@router.post("/send_code")
async def send_code(data: AccountCreate, current_user: models.User = Depends(get_current_user)):
    try:
        sent_code = await telegram_service.send_code(data.phone)
        return {"phone_code_hash": sent_code.phone_code_hash}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/signin")
async def confirm_login(data: LoginConfirm, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        user, session_str = await telegram_service.sign_in(data.phone, data.phone_code_hash, data.code)
        
        # Save account to DB
        new_account = models.Account(
            phone=data.phone,
            api_id=telegram_service.api_id,
            api_hash=telegram_service.api_hash,
            session_name=session_str,
            owner_id=current_user.id
        )
        db.add(new_account)
        db.commit()
        db.refresh(new_account)
        
        return {"message": "Logged in successfully", "account_id": new_account.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[dict])
async def get_accounts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    accounts = db.query(models.Account).filter(models.Account.owner_id == current_user.id).all()
    return [{"id": a.id, "phone": a.phone, "status": a.status} for a in accounts]
