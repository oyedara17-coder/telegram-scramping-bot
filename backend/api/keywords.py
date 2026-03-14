from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from core.database import get_db
from models import models
from api.users import get_current_user

router = APIRouter()

class KeywordCreate(BaseModel):
    keyword: str
    is_active: bool = True

class KeywordResponse(BaseModel):
    id: int
    keyword: str
    is_active: bool

    class Config:
        orm_mode = True

@router.get("/", response_model=List[KeywordResponse])
async def get_keywords(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Keywords are global settings so any admin/user can view them, 
    # but we might restrict who can create them
    keywords = db.query(models.KeywordSetting).all()
    return keywords

@router.post("/", response_model=KeywordResponse)
async def create_keyword(data: KeywordCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage keywords")

    existing = db.query(models.KeywordSetting).filter(models.KeywordSetting.keyword == data.keyword.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Keyword already exists")

    new_kw = models.KeywordSetting(
        keyword=data.keyword.lower(),
        is_active=data.is_active
    )
    db.add(new_kw)
    db.commit()
    db.refresh(new_kw)
    return new_kw

@router.delete("/{keyword_id}")
async def delete_keyword(keyword_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage keywords")

    kw = db.query(models.KeywordSetting).filter(models.KeywordSetting.id == keyword_id).first()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")

    db.delete(kw)
    db.commit()
    return {"status": "success"}

@router.patch("/{keyword_id}/toggle")
async def toggle_keyword(keyword_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage keywords")

    kw = db.query(models.KeywordSetting).filter(models.KeywordSetting.id == keyword_id).first()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")

    kw.is_active = not kw.is_active
    db.commit()
    return {"status": "success", "is_active": kw.is_active}
