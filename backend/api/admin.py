from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from api.users import get_current_user
from models import models
from core.auth import get_password_hash
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class UserUpdate(BaseModel):
    password: Optional[str] = None
    status: Optional[str] = None
    role: Optional[str] = None

def check_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

@router.get("/users", response_model=List[dict])
async def list_users(db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    users = db.query(models.User).all()
    return [{"id": u.id, "username": u.username, "role": u.role, "status": u.status, "created_at": u.created_at} for u in users]

@router.patch("/users/{user_id}")
async def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.password:
        user.password_hash = get_password_hash(data.password)
    if data.status:
        user.status = data.status
    if data.role:
        user.role = data.role
        
    db.commit()
    return {"message": "User updated successfully"}

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

@router.get("/logs", response_model=List[dict])
async def get_system_logs(db: Session = Depends(get_db), admin: models.User = Depends(check_admin)):
    logs = db.query(models.Log).order_by(models.Log.created_at.desc()).limit(100).all()
    return [{"id": l.id, "level": l.level, "message": l.message, "created_at": l.created_at, "username": l.user_id} for l in logs]

@router.post("/settings")
async def save_settings(data: dict, admin: models.User = Depends(check_admin)):
    # For now, just simulate success. In production, save to DB or .env
    return {"message": "Settings saved successfully"}
