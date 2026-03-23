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

class TemplateCreate(BaseModel):
    name: str
    content: str


# ---- TEMPLATES (must be declared BEFORE dynamic /{campaign_id} routes) ----

@router.post("/templates")
async def create_template(data: TemplateCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_temp = models.Template(name=data.name, content=data.content, user_id=current_user.id)
    db.add(new_temp)
    db.commit()
    return new_temp

@router.get("/templates")
async def list_templates(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Template).filter(models.Template.user_id == current_user.id).all()

@router.delete("/templates/{template_id}")
async def delete_template(template_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    template = db.query(models.Template).filter(models.Template.id == template_id, models.Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check if template is used in any campaigns
    active_usage = db.query(models.Campaign).filter(models.Campaign.template_id == template_id).first()
    if active_usage:
         raise HTTPException(status_code=400, detail="Cannot delete template currently being used by existing campaigns.")

    db.delete(template)
    db.commit()
    return {"message": "Template removed from library"}


# ---- CAMPAIGNS ----

@router.post("")
@router.post("/")
async def create_campaign(data: CampaignCreate, background_tasks: BackgroundTasks, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Resolve group_id (frontend sends telegram_id)
    internal_group_id = None
    if data.group_id:
        db_group = db.query(models.Group).filter(models.Group.telegram_id == data.group_id).first()
        if not db_group:
            # Try to resolve and create group if missing
            try:
                # Find an account to use for resolution
                account = db.query(models.Account).filter(models.Account.owner_id == current_user.id).first()
                if account:
                    from services.telegram_service import telegram_service
                    # Bug fix: pass session_name as required second argument
                    client = await telegram_service.get_client(account.phone, account.session_name)
                    entity = await client.get_entity(data.group_id)
                    db_group = models.Group(
                        telegram_id=entity.id,
                        title=getattr(entity, 'title', 'Unknown Group'),
                        username=getattr(entity, 'username', None)
                    )
                    db.add(db_group)
                    db.commit()
                    db.refresh(db_group)
                    internal_group_id = db_group.id
            except:
                pass
        else:
            internal_group_id = db_group.id

    new_campaign = models.Campaign(
        name=data.name,
        template_id=data.template_id,
        group_id=internal_group_id,
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
        background_tasks.add_task(messaging_service.run_campaign, new_campaign.id)
    
    return new_campaign

@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
async def get_campaigns(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaigns = db.query(models.Campaign).filter(models.Campaign.user_id == current_user.id).all()
    return [{"id": c.id, "name": c.name, "status": c.status, "created_at": c.created_at} for c in campaigns]

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id, models.Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted"}

@router.post("/{campaign_id}/terminate")
async def terminate_campaign(campaign_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id, models.Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.status == "running":
        campaign.status = "terminated"
        db.commit()
        return {"status": "ok", "message": "Campaign termination requested"}
    return {"status": "error", "message": "Campaign is not running"}
