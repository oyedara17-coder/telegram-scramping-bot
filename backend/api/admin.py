from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from api.users import get_current_user
from core.auth import create_access_token, get_password_hash, verify_password
from core.config import get_settings
from core.database import get_db
from models import models
from services.messaging_service import messaging_service
from services.monitor_service import monitor_service

router = APIRouter()
settings = get_settings()


class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=64)
    email: Optional[str] = Field(default=None, max_length=254)
    password: str = Field(min_length=12, max_length=72)
    role: str = Field(default="user", pattern="^(user|admin)$")


class UserUpdate(BaseModel):
    email: Optional[str] = Field(default=None, max_length=254)
    status: Optional[str] = Field(default=None, pattern="^(active|paused)$")
    role: Optional[str] = Field(default=None, pattern="^(user|admin)$")


class PasswordReset(BaseModel):
    password: str = Field(min_length=12, max_length=72)


class StatusUpdate(BaseModel):
    status: str


class LeadUpdate(BaseModel):
    status: str = Field(pattern="^(new|contacted|ignored)$")


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    content: Optional[str] = Field(default=None, min_length=1, max_length=10000)


class TemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1, max_length=10000)
    user_id: Optional[int] = None


class SettingsUpdate(BaseModel):
    global_delay: int = Field(ge=10, le=3600)


def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def audit(db: Session, admin: models.User, message: str, level: str = "INFO"):
    db.add(models.Log(level=level, message=f"Admin {admin.username}: {message}"[:2000], user_id=admin.id))


def serialize_user(user: models.User):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "telegram_id": user.telegram_id,
        "role": user.role,
        "status": user.status,
        "created_at": user.created_at,
    }


def paginate(query, page: int, page_size: int):
    total = query.order_by(None).count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def require_user(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/login")
async def admin_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate an administrator without granting admin access based on client state."""
    user = db.query(models.User).filter(
        or_(models.User.username == form_data.username, models.User.email == form_data.username)
    ).first()
    if not user or not user.password_hash or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid administrator credentials")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is paused")
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")

    token = create_access_token({
        "sub": user.username,
        "role": user.role,
        "type": "access",
        "ver": user.token_version,
    })
    return {"access_token": token, "token_type": "bearer", "role": user.role}


@router.get("/overview")
async def get_overview(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    campaign_statuses = db.query(models.Campaign.status, func.count(models.Campaign.id)).group_by(models.Campaign.status).all()
    lead_statuses = db.query(models.Lead.status, func.count(models.Lead.id)).group_by(models.Lead.status).all()
    recent_logs = db.query(models.Log).order_by(models.Log.created_at.desc()).limit(8).all()
    return {
        "stats": {
            "users": db.query(models.User).count(),
            "active_users": db.query(models.User).filter(models.User.status == "active").count(),
            "accounts": db.query(models.Account).count(),
            "active_accounts": db.query(models.Account).filter(models.Account.status == "active").count(),
            "campaigns": db.query(models.Campaign).count(),
            "active_campaigns": db.query(models.Campaign).filter(models.Campaign.status == "running").count(),
            "leads": db.query(models.Lead).count(),
            "keywords": db.query(models.KeywordSetting).count(),
            "unread_alerts": db.query(models.Alert).filter(models.Alert.status == "pending").count(),
        },
        "campaign_statuses": [{"name": name or "unknown", "value": count} for name, count in campaign_statuses],
        "lead_statuses": [{"name": name or "unknown", "value": count} for name, count in lead_statuses],
        "recent_activity": [{
            "id": item.id,
            "level": item.level,
            "message": item.message,
            "created_at": item.created_at,
            "user_id": item.user_id,
        } for item in recent_logs],
    }


@router.get("/users")
async def list_users(
    search: str = Query(default="", max_length=120),
    role: Optional[str] = Query(default=None, pattern="^(user|admin)$"),
    user_status: Optional[str] = Query(default=None, alias="status", pattern="^(active|paused)$"),
    sort: str = Query(default="created_at", pattern="^(created_at|username|email|role|status)$"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    query = db.query(models.User)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(models.User.username.ilike(term), models.User.email.ilike(term), models.User.phone.ilike(term)))
    if role:
        query = query.filter(models.User.role == role)
    if user_status:
        query = query.filter(models.User.status == user_status)
    sort_column = getattr(models.User, sort)
    query = query.order_by(sort_column.desc() if order == "desc" else sort_column.asc(), models.User.id.asc())
    users, total = paginate(query, page, page_size)
    return {"items": [serialize_user(user) for user in users], "total": total, "page": page, "page_size": page_size}


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(data: UserCreate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    username = data.username.strip()
    email = data.email.strip().lower() if data.email and data.email.strip() else None
    if len(data.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Password must be 72 UTF-8 bytes or fewer")
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=409, detail="Username is already in use")
    if email and db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=409, detail="Email is already in use")
    user = models.User(username=username, email=email, password_hash=get_password_hash(data.password), role=data.role, status="active")
    db.add(user)
    audit(db, admin, f"created user {username} with role {data.role}")
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username or email is already in use")
    db.refresh(user)
    return serialize_user(user)


@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    user = require_user(db, user_id)
    latest_activity = db.query(models.Log).filter(models.Log.user_id == user_id).order_by(models.Log.created_at.desc()).limit(10).all()
    return {
        **serialize_user(user),
        "accounts_count": db.query(models.Account).filter(models.Account.owner_id == user_id).count(),
        "campaigns_count": db.query(models.Campaign).filter(models.Campaign.user_id == user_id).count(),
        "leads_count": db.query(models.Lead).filter(models.Lead.user_id == user_id).count(),
        "templates_count": db.query(models.Template).filter(models.Template.user_id == user_id).count(),
        "recent_activity": [{"id": row.id, "level": row.level, "message": row.message, "created_at": row.created_at} for row in latest_activity],
    }


@router.patch("/users/{user_id}")
async def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    user = require_user(db, user_id)
    values = data.dict(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=422, detail="No changes supplied")
    if user.id == admin.id and (values.get("status") == "paused" or values.get("role") == "user"):
        raise HTTPException(status_code=400, detail="You cannot pause or demote your own administrator account")
    if values.get("role") == "user" and user.role == "admin":
        active_admins = db.query(models.User).filter(models.User.role == "admin", models.User.status == "active").count()
        if active_admins <= 1:
            raise HTTPException(status_code=400, detail="The last active administrator cannot be demoted")
    if "email" in values:
        email = values["email"].strip().lower() if values["email"] and values["email"].strip() else None
        duplicate = db.query(models.User).filter(models.User.email == email, models.User.id != user_id).first() if email else None
        if duplicate:
            raise HTTPException(status_code=409, detail="Email is already in use")
        user.email = email
    campaigns_to_pause = []
    if values.get("status") == "paused" and user.status != "paused":
        campaigns_to_pause = db.query(models.Campaign).filter(models.Campaign.user_id == user_id, models.Campaign.status == "running").all()
        for campaign in campaigns_to_pause:
            campaign.status = "paused"
    previous = {key: getattr(user, key) for key in ("status", "role") if key in values}
    for key in ("status", "role"):
        if key in values:
            setattr(user, key, values[key])
    if previous and any(previous[key] != getattr(user, key) for key in previous):
        user.token_version += 1
    audit(db, admin, f"updated user {user.username}: {', '.join(values.keys())}")
    db.commit()
    for campaign in campaigns_to_pause:
        await messaging_service.pause_campaign(campaign.id)
    db.refresh(user)
    return serialize_user(user)


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: int, data: PasswordReset, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    user = require_user(db, user_id)
    if len(data.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Password must be 72 UTF-8 bytes or fewer")
    user.password_hash = get_password_hash(data.password)
    user.token_version += 1
    audit(db, admin, f"reset password and revoked sessions for user {user.username}", "WARNING")
    db.commit()
    return {"message": "Password updated and existing sessions revoked"}


@router.post("/users/{user_id}/revoke-sessions")
async def revoke_user_sessions(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    user = require_user(db, user_id)
    user.token_version += 1
    audit(db, admin, f"revoked sessions for user {user.username}", "WARNING")
    db.commit()
    return {"message": "All existing sessions revoked"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    user = require_user(db, user_id)
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    if user.role == "admin":
        active_admins = db.query(models.User).filter(models.User.role == "admin", models.User.status == "active").count()
        if active_admins <= 1:
            raise HTTPException(status_code=400, detail="The last active administrator cannot be deleted")

    running_campaigns = db.query(models.Campaign).filter(models.Campaign.user_id == user_id, models.Campaign.status == "running").count()
    if running_campaigns:
        raise HTTPException(status_code=409, detail="Pause or terminate this user's running campaigns before deleting the account")
    phones = [row.phone for row in db.query(models.Account.phone).filter(models.Account.owner_id == user_id).all()]
    for phone in phones:
        await monitor_service.stop_monitoring(phone)
    audit(db, admin, f"deleted user {user.username}", "WARNING")
    db.query(models.Log).filter(models.Log.user_id == user_id).update({models.Log.user_id: None}, synchronize_session=False)
    db.query(models.Campaign).filter(models.Campaign.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Lead).filter(models.Lead.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Account).filter(models.Account.owner_id == user_id).delete(synchronize_session=False)
    db.query(models.Template).filter(models.Template.user_id == user_id).update({models.Template.user_id: None}, synchronize_session=False)
    db.delete(user)
    db.commit()
    return {"message": "User and owned records deleted"}


@router.get("/accounts")
async def list_accounts(
    search: str = Query(default="", max_length=120),
    account_status: Optional[str] = Query(default=None, alias="status", max_length=32),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    query = db.query(models.Account, models.User.username).outerjoin(models.User, models.User.id == models.Account.owner_id)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(models.Account.phone.ilike(term), models.User.username.ilike(term)))
    if account_status:
        query = query.filter(models.Account.status == account_status)
    total = query.order_by(None).count()
    rows = query.order_by(models.Account.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [{"id": account.id, "phone": account.phone, "status": account.status, "owner_id": account.owner_id, "owner_username": owner, "created_at": getattr(account, "created_at", None)} for account, owner in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/accounts/{account_id}")
async def update_account(account_id: int, data: StatusUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    if data.status not in {"active", "paused", "disabled"}:
        raise HTTPException(status_code=422, detail="Status must be active, paused, or disabled")
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Telegram account not found")
    campaigns_to_pause = []
    if data.status != "active" and account.status == "active" and account.owner_id:
        campaigns_to_pause = db.query(models.Campaign).filter(models.Campaign.user_id == account.owner_id, models.Campaign.status == "running").all()
        for campaign in campaigns_to_pause:
            campaign.status = "paused"
    account.status = data.status
    audit(db, admin, f"set Telegram account {account.phone} to {data.status}")
    db.commit()
    for campaign in campaigns_to_pause:
        await messaging_service.pause_campaign(campaign.id)
    if data.status == "active":
        await monitor_service.start_monitoring()
    else:
        await monitor_service.stop_monitoring(account.phone)
    return {"id": account.id, "phone": account.phone, "status": account.status}


@router.delete("/accounts/{account_id}")
async def delete_account(account_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Telegram account not found")
    phone = account.phone
    campaigns_to_pause = []
    if account.owner_id:
        campaigns_to_pause = db.query(models.Campaign).filter(models.Campaign.user_id == account.owner_id, models.Campaign.status == "running").all()
        for campaign in campaigns_to_pause:
            campaign.status = "paused"
    audit(db, admin, f"unlinked Telegram account {phone}", "WARNING")
    db.delete(account)
    db.commit()
    for campaign in campaigns_to_pause:
        await messaging_service.pause_campaign(campaign.id)
    await monitor_service.stop_monitoring(phone)
    return {"message": "Telegram account unlinked from this platform"}


@router.get("/campaigns")
async def list_campaigns(
    search: str = Query(default="", max_length=120),
    campaign_status: Optional[str] = Query(default=None, alias="status", max_length=32),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    query = db.query(models.Campaign, models.User.username).outerjoin(models.User, models.User.id == models.Campaign.user_id)
    if search.strip():
        query = query.filter(models.Campaign.name.ilike(f"%{search.strip()}%"))
    if campaign_status:
        query = query.filter(models.Campaign.status == campaign_status)
    total = query.order_by(None).count()
    rows = query.order_by(models.Campaign.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [{"id": campaign.id, "name": campaign.name, "status": campaign.status, "processed_count": campaign.processed_count, "template_id": campaign.template_id, "group_id": campaign.group_id, "user_id": campaign.user_id, "owner_username": owner, "schedule_time": campaign.schedule_time} for campaign, owner in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/campaigns/{campaign_id}/status")
async def update_campaign_status(campaign_id: int, data: StatusUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    if data.status not in {"pending", "paused", "terminated"}:
        raise HTTPException(status_code=422, detail="Status must be pending, paused, or terminated")
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status in {"completed", "failed", "terminated"}:
        raise HTTPException(status_code=409, detail="A completed campaign cannot be restarted or changed")
    if data.status == "pending" and campaign.status != "paused":
        raise HTTPException(status_code=409, detail="Only a paused campaign can be resumed")
    if data.status == "paused" and campaign.status not in {"pending", "running", "paused"}:
        raise HTTPException(status_code=409, detail="This campaign cannot be paused")
    if data.status == "pending" and campaign.schedule_time is None:
        campaign.schedule_time = datetime.now()
    campaign.status = data.status
    audit(db, admin, f"set campaign {campaign.id} to {data.status}", "WARNING" if data.status == "terminated" else "INFO")
    db.commit()
    if data.status in {"paused", "terminated"}:
        await messaging_service.pause_campaign(campaign.id)
    return {"id": campaign.id, "status": campaign.status, "processed_count": campaign.processed_count}


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status in {"running", "paused"}:
        raise HTTPException(status_code=409, detail="Wait for paused work to stop before deleting the campaign")
    audit(db, admin, f"deleted campaign {campaign.name}", "WARNING")
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted"}


@router.get("/leads")
async def list_leads(
    search: str = Query(default="", max_length=120),
    lead_status: Optional[str] = Query(default=None, alias="status", pattern="^(new|contacted|ignored)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    query = db.query(models.Lead, models.User.username).outerjoin(models.User, models.User.id == models.Lead.user_id)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(models.Lead.username.ilike(term), models.Lead.message_content.ilike(term), models.Lead.detection_keyword.ilike(term)))
    if lead_status:
        query = query.filter(models.Lead.status == lead_status)
    total = query.order_by(None).count()
    rows = query.order_by(models.Lead.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [{"id": lead.id, "telegram_id": lead.telegram_id, "username": lead.username, "message_content": lead.message_content, "detection_keyword": lead.detection_keyword, "status": lead.status, "user_id": lead.user_id, "owner_username": owner} for lead, owner in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/leads/{lead_id}")
async def update_lead(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = data.status
    audit(db, admin, f"updated lead {lead.id} to {data.status}")
    db.commit()
    return {"id": lead.id, "status": lead.status}


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    audit(db, admin, f"deleted lead {lead.id}", "WARNING")
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted"}


@router.get("/lead-intelligence")
async def lead_intelligence(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    leads = db.query(models.Lead).order_by(models.Lead.id.desc()).limit(100).all()
    purchase_signals = ("buy", "price", "looking for", "need", "quote", "available")
    scored = []
    for lead in leads:
        message = (lead.message_content or "").lower()
        signals = [signal for signal in purchase_signals if signal in message]
        score = min(100, 25 + (20 if lead.detection_keyword else 0) + (15 if len(message) > 80 else 0) + min(40, len(signals) * 10))
        scored.append({
            "id": lead.id,
            "username": lead.username,
            "telegram_id": lead.telegram_id,
            "detection_keyword": lead.detection_keyword,
            "status": lead.status,
            "message_content": lead.message_content,
            "score": score,
            "signals": signals,
        })
    scored.sort(key=lambda item: (item["score"], item["id"]), reverse=True)
    return {"items": scored[:25], "total_scored": len(scored), "average_score": round(sum(item["score"] for item in scored) / len(scored)) if scored else 0}


@router.get("/templates")
async def list_templates(
    search: str = Query(default="", max_length=120),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    query = db.query(models.Template, models.User.username).outerjoin(models.User, models.User.id == models.Template.user_id)
    if search.strip():
        query = query.filter(or_(models.Template.name.ilike(f"%{search.strip()}%"), models.Template.content.ilike(f"%{search.strip()}%")))
    total = query.order_by(None).count()
    rows = query.order_by(models.Template.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [{"id": template.id, "name": template.name, "content": template.content, "user_id": template.user_id, "owner_username": owner, "campaign_count": db.query(models.Campaign).filter(models.Campaign.template_id == template.id).count()} for template, owner in rows], "total": total, "page": page, "page_size": page_size}


@router.post("/templates", status_code=status.HTTP_201_CREATED)
async def create_template(data: TemplateCreate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    owner_id = data.user_id or admin.id
    require_user(db, owner_id)
    template = models.Template(name=data.name.strip(), content=data.content.strip(), user_id=owner_id)
    db.add(template)
    audit(db, admin, f"created template {template.name}")
    db.commit()
    db.refresh(template)
    return {"id": template.id, "name": template.name, "content": template.content, "user_id": template.user_id}


@router.patch("/templates/{template_id}")
async def update_template(template_id: int, data: TemplateUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    values = data.dict(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=422, detail="No changes supplied")
    for key, value in values.items():
        setattr(template, key, value.strip())
    audit(db, admin, f"updated template {template.name}")
    db.commit()
    return {"id": template.id, "name": template.name, "content": template.content, "user_id": template.user_id}


@router.delete("/templates/{template_id}")
async def delete_template(template_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if db.query(models.Campaign).filter(models.Campaign.template_id == template_id).first():
        raise HTTPException(status_code=409, detail="This template is assigned to a campaign and cannot be deleted")
    audit(db, admin, f"deleted template {template.name}", "WARNING")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}


@router.get("/logs")
@router.get("/activity")
async def list_activity(
    search: str = Query(default="", max_length=160),
    level: Optional[str] = Query(default=None, max_length=16),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    query = db.query(models.Log, models.User.username).outerjoin(models.User, models.User.id == models.Log.user_id)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(models.Log.message.ilike(term), models.User.username.ilike(term)))
    if level:
        query = query.filter(models.Log.level == level.upper())
    total = query.order_by(None).count()
    rows = query.order_by(models.Log.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [{"id": log.id, "level": log.level, "message": log.message, "created_at": log.created_at, "user_id": log.user_id, "username": username} for log, username in rows], "total": total, "page": page, "page_size": page_size}


@router.get("/alerts")
async def list_alerts(
    alert_status: Optional[str] = Query(default=None, alias="status", max_length=32),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    query = db.query(models.Alert)
    if alert_status:
        query = query.filter(models.Alert.status == alert_status)
    items, total = paginate(query.order_by(models.Alert.created_at.desc()), page, page_size)
    return {"items": [{"id": item.id, "type": item.type, "destination": item.destination, "status": item.status, "created_at": item.created_at} for item in items], "total": total, "page": page, "page_size": page_size}


@router.patch("/alerts/{alert_id}")
async def update_alert(alert_id: int, data: StatusUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    if data.status not in {"pending", "read", "resolved"}:
        raise HTTPException(status_code=422, detail="Status must be pending, read, or resolved")
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = data.status
    audit(db, admin, f"updated alert {alert.id} to {data.status}")
    db.commit()
    return {"id": alert.id, "status": alert.status}


@router.get("/settings")
async def get_settings(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    setting = db.query(models.AdminSetting).filter(models.AdminSetting.key == "global_delay").first()
    return {
        "global_delay": int(setting.value) if setting else 60,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "telegram_configured": settings.validate_telegram_config(),
        "sendgrid_configured": bool(settings.SENDGRID_API_KEY),
        "twilio_configured": bool(settings.TWILIO_ACCOUNT_SID),
    }


@router.put("/settings")
@router.post("/settings")
async def update_settings(data: SettingsUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    setting = db.query(models.AdminSetting).filter(models.AdminSetting.key == "global_delay").first()
    if setting:
        setting.value = str(data.global_delay)
    else:
        db.add(models.AdminSetting(key="global_delay", value=str(data.global_delay)))
    audit(db, admin, f"updated global campaign delay to {data.global_delay} seconds")
    db.commit()
    return {"global_delay": data.global_delay, "message": "Settings saved"}
