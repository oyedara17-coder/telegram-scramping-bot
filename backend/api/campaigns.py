from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from core.database import get_db
from api.users import get_current_user
from models import models
from services.messaging_service import messaging_service
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class CampaignCreate(BaseModel):
    name: str
    template_id: int
    group_id: Optional[int] = None
    schedule_time: Optional[datetime] = None


@router.post("/")
async def create_campaign(data: CampaignCreate, background_tasks: BackgroundTasks, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_campaign = models.Campaign(
        name=data.name,
        template_id=data.template_id,
        group_id=data.group_id,
        user_id=current_user.id,
        status="pending",
        schedule_time=data.schedule_time
    )

    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    # Run in background immediately if no schedule or schedule is in the past
    now = datetime.now()
    should_run_now = False
    if data.schedule_time is None:
        should_run_now = True
    elif data.schedule_time <= now:
        should_run_now = True
        
    if should_run_now:
        background_tasks.add_task(messaging_service.run_campaign, new_campaign.id, db)
    
    return new_campaign

@router.get("/", response_model=List[dict])
async def get_campaigns(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaigns = db.query(models.Campaign).filter(models.Campaign.user_id == current_user.id).all()
    return [{"id": c.id, "name": c.name, "status": c.status, "created_at": c.created_at} for c in campaigns]

class TemplateCreate(BaseModel):
    name: str
    content: str

@router.post("/templates")
async def create_template(data: TemplateCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_temp = models.Template(name=data.name, content=data.content, user_id=current_user.id)
    db.add(new_temp)
    db.commit()
    return new_temp

@router.get("/templates")
async def list_templates(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Template).filter(models.Template.user_id == current_user.id).all()
