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
    password: Optional[str] = None

@router.post("/send_code")
async def send_code(data: AccountCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        # Normalize phone
        phone = data.phone.strip()
        if not phone.startswith('+'):
            phone = '+' + phone
        
        print(f"DEBUG: Sending code to {phone}")
        sent_code = await telegram_service.send_code(phone)
        print(f"DEBUG: Sent code successfully. Hash: {sent_code.phone_code_hash}")
        return {"phone_code_hash": sent_code.phone_code_hash}
    except Exception as e:
        print(f"ERROR in send_code: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/signin")
async def confirm_login(data: LoginConfirm, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        # Normalize phone
        phone = data.phone.strip()
        if not phone.startswith('+'):
            phone = '+' + phone
            
        print(f"DEBUG: Attempting sign-in for {phone}")
        user, session_str = await telegram_service.sign_in(
            phone, 
            data.phone_code_hash, 
            data.code,
            password=data.password
        )
        print(f"DEBUG: Sign-in successful for {data.phone}")
        
        # Check if account already exists for this phone (allow re-linking/updating)
        existing_account = db.query(models.Account).filter(models.Account.phone == phone).first()
        if existing_account:
            existing_account.session_name = session_str
            existing_account.owner_id = current_user.id
            existing_account.status = "active"
            db_account = existing_account
        else:
            # Save new account to DB
            db_account = models.Account(
                phone=phone,
                api_id=telegram_service.api_id,
                api_hash=telegram_service.api_hash,
                session_name=session_str,
                owner_id=current_user.id
            )
            db.add(db_account)
            
        db.commit()
        db.refresh(db_account)
        print(f"DEBUG: Account saved/updated in DB with ID {db_account.id}")
        
        return {"message": "Logged in successfully", "account_id": db_account.id}
    except Exception as e:
        print(f"ERROR in confirm_login: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
async def get_accounts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        accounts = db.query(models.Account).filter(models.Account.owner_id == current_user.id).all()
        print(f"DEBUG: Fetched {len(accounts)} accounts for user {current_user.id}")
        return [{"id": a.id, "phone": a.phone, "status": a.status, "session_name": a.session_name} for a in accounts]
    except Exception as e:
        print(f"ERROR fetching accounts: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching accounts")

@router.delete("/{account_id}")
async def delete_account(account_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    account = db.query(models.Account).filter(models.Account.id == account_id, models.Account.owner_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account node not found")
    
    db.delete(account)
    db.commit()
    return {"message": "Account node revoked and removed from cluster"}
