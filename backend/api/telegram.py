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
async def search_groups(keyword: str, country: str = None, limit: int = 5000, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.owner_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=400, detail="No Telegram account connected")
    
    try:
        from telethon.tl.functions.contacts import SearchRequest
        import asyncio

        client = await telegram_service.get_client(account.phone, account.session_name)
        
        # Build keyword variations for wider net
        base_query = f"{keyword} {country}" if country else keyword
        keyword_variations = [base_query, keyword]
        if country:
            keyword_variations.append(f"{country} {keyword}")

        seen_ids = set()
        all_groups = []

        for query in keyword_variations:
            if len(all_groups) >= limit:
                break

            print(f"Searching groups for: {query}")
            offset_rate = 0
            offset_id = 0
            max_pages = (limit // 100) + 1

            for page in range(max_pages):
                if len(all_groups) >= limit:
                    break
                try:
                    result = await client(SearchRequest(
                        q=query,
                        limit=100,
                        offset_rate=offset_rate,
                        offset_id=offset_id,
                        offset_peer="username" if offset_id else None
                    ))
                except Exception:
                    # Simpler call without offset on first page or if offset fails
                    result = await client(SearchRequest(q=query, limit=100))

                new_chats = [c for c in result.chats if hasattr(c, 'title')]
                if not new_chats:
                    break  # No more results

                for c in new_chats:
                    cid = getattr(c, 'id', None)
                    if cid and cid not in seen_ids:
                        seen_ids.add(cid)
                        all_groups.append({
                            "id": str(cid),
                            "title": getattr(c, 'title', ''),
                            "username": getattr(c, 'username', None),
                            "participantsCount": getattr(c, 'participants_count', 0)
                        })

                # Advance pagination offsets
                offset_rate = getattr(result, 'next_rate', 0)
                if result.chats:
                    offset_id = result.chats[-1].id
                
                if not offset_rate:
                    break  # No next page

                await asyncio.sleep(0.5)  # Be polite to Telegram API

        print(f"Total groups found: {len(all_groups)}")
        return all_groups[:limit]

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/scrape_members")
async def scrape_group(data: ScrapeRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.owner_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=400, detail="No Telegram account connected")
    
    try:
        # Resolve group and scrape
        members = await telegram_service.scrape_members(account.phone, data.group_id, account.session_name)
        
        # PERSISTENCE LOGIC
        # 1. Get or create the group in our DB
        client = await telegram_service.get_client(account.phone, account.session_name)
        entity = await client.get_entity(data.group_id)
        
        tg_id = entity.id
        # Telethon IDs for groups/channels sometimes need normalization for matching
        # But we'll use the raw ID from the entity
        
        db_group = db.query(models.Group).filter(models.Group.telegram_id == tg_id).first()
        if not db_group:
            db_group = models.Group(
                telegram_id=tg_id,
                title=getattr(entity, 'title', 'Unknown Group'),
                username=getattr(entity, 'username', None)
            )
            db.add(db_group)
            db.commit()
            db.refresh(db_group)
        
        # 2. Save members to ScrapedUser table
        new_users_count = 0
        for m in members:
            # Check if user already exists in this group to avoid duplicates
            existing = db.query(models.ScrapedUser).filter(
                (models.ScrapedUser.telegram_id == m.id) & 
                (models.ScrapedUser.group_id == db_group.id)
            ).first()
            
            if not existing:
                new_user = models.ScrapedUser(
                    telegram_id=m.id,
                    username=m.username,
                    first_name=m.first_name,
                    last_name=m.last_name,
                    phone=m.phone,
                    group_id=db_group.id
                )
                db.add(new_user)
                new_users_count += 1
        
        db.commit()
        print(f"DEBUG: Scraped and persisted {new_users_count} new users for group {db_group.title}")
        
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
        groups = await telegram_service.get_groups(account.phone, account.session_name)
        return [{"id": g.id, "title": g.title, "username": getattr(g, 'username', None)} for g in groups]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/send-message")
async def send_group_message(data: MessageRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.owner_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=400, detail="No Telegram account connected")
    
    try:
        await telegram_service.send_message(account.phone, data.target_id, data.message, account.session_name)
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

