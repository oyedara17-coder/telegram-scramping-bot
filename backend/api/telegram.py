from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from api.users import get_current_user
from models import models
from services.telegram_service import telegram_service
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ScrapeRequest(BaseModel):
    group_id: str

class MessageRequest(BaseModel):
    target_id: str # Allow username or string ID
    message: str


@router.get("/search_groups")
async def search_groups(keyword: str, country: str = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.owner_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=400, detail="No Telegram account connected")
    
    try:
        from telethon.tl.functions.contacts import SearchRequest
        client = await telegram_service.get_client(account.phone, account.session_name)
        
        # Incorporate country into search query if provided
        search_query = f"{keyword} {country}" if country else keyword
        print(f"Searching groups for: {search_query}")
        
        # Global search for groups
        result = await client(SearchRequest(q=search_query, limit=20))
        return [
            {
                "id": str(getattr(c, 'id', '')),
                "title": getattr(c, 'title', ''),
                "username": getattr(c, 'username', None),
                "participantsCount": getattr(c, 'participants_count', 0)
            } 
            for c in result.chats if hasattr(c, 'title')
        ]

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/scrape_members")
async def scrape_group(data: ScrapeRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.owner_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=400, detail="No Telegram account connected")
    
    try:
        members = await telegram_service.scrape_members(account.phone, data.group_id)
        return [{"id": m.id, "first_name": m.first_name, "last_name": m.last_name, "username": m.username, "phone": m.phone} for m in members]

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/leads", response_model=List[dict])
async def get_leads(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    leads = db.query(models.Lead).filter(models.Lead.user_id == current_user.id).all()
    return [{"id": l.id, "telegram_id": str(l.telegram_id), "username": l.username, "detection_keyword": l.detection_keyword, "status": l.status, "created_at": l.created_at} for l in leads]

@router.get("/joined-groups")
async def get_joined_groups(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.owner_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=400, detail="No Telegram account connected")
    
    try:
        groups = await telegram_service.get_groups(account.phone)
        return [{"id": g.id, "title": g.title, "username": getattr(g, 'username', None)} for g in groups]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/send-message")
async def send_group_message(data: MessageRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.owner_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=400, detail="No Telegram account connected")
    
    try:
        await telegram_service.send_message(account.phone, data.target_id, data.message)
        return {"status": "success", "message": "Message dispatched to node"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    joined_groups_count = await telegram_service.get_joined_groups_count(db, current_user.id)
    active_campaigns = db.query(models.Campaign).filter(
        models.Campaign.user_id == current_user.id,
        models.Campaign.status == "running"
    ).count()
    total_leads = db.query(models.Lead).filter(models.Lead.user_id == current_user.id).count()
    
    messages_sent = db.query(models.Log).filter(
        models.Log.user_id == current_user.id,
        models.Log.message.like("Sent message%")
    ).count()
    
    return {
        "joined_groups": joined_groups_count,
        "active_campaigns": active_campaigns,
        "total_leads": total_leads,
        "messages_sent": messages_sent
    }

@router.get("/logs")
async def get_logs(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    logs = db.query(models.Log).filter(models.Log.user_id == current_user.id).order_by(models.Log.created_at.desc()).limit(20).all()
    return [{"id": l.id, "level": l.level, "message": l.message, "created_at": l.created_at} for l in logs]

