import asyncio
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import accounts, admin, campaigns, keywords, telegram, users
from core.config import get_settings
from core.database import Base, SessionLocal, engine, ensure_admin_schema
from models import models
from services.messaging_service import messaging_service
from services.monitor_service import monitor_service

settings = get_settings()

try:
    print(f"Connecting to database at: {engine.url.render_as_string(hide_password=True)}")
    Base.metadata.create_all(bind=engine)
    ensure_admin_schema()
    print("Database tables and admin schema are ready.")
except Exception as exc:
    print(f"FATAL ERROR: Failed to initialize database schema: {exc}")
    print("Please check DATABASE_URL and LIBSQL_AUTH_TOKEN.")

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["Accounts"])
app.include_router(telegram.router, prefix="/api/telegram", tags=["Telegram"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["Campaigns"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(keywords.router, prefix="/api/keywords", tags=["Keywords"])


def pause_legacy_admin_accounts():
    """Block known bootstrap usernames until an operator provisions new credentials."""
    db = SessionLocal()
    try:
        legacy_admins = db.query(models.User).filter(
            models.User.username.in_(["stepyzoid", "stepyzoid studio admin"]),
            models.User.role == "admin",
            models.User.status == "active",
        ).all()
        for user in legacy_admins:
            user.status = "paused"
            user.token_version = (user.token_version or 0) + 1
            db.add(models.Log(
                level="WARNING",
                message="Paused a legacy bootstrap administrator; provision a new password through the trusted admin utility.",
                user_id=None,
            ))
        if legacy_admins:
            db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.get("/")
async def root():
    return {"message": "Telegram Scraping Platform API is running"}


async def campaign_worker():
    """Dispatch due campaigns using the application's persisted campaign state."""
    while True:
        db = SessionLocal()
        try:
            now = datetime.now()
            scheduled_campaigns = db.query(models.Campaign).filter(
                models.Campaign.status == "pending",
                models.Campaign.schedule_time <= now,
            ).all()
            campaign_ids = [campaign.id for campaign in scheduled_campaigns]
            for campaign_id in campaign_ids:
                await messaging_service.start_campaign(campaign_id)
        except Exception as exc:
            print(f"Campaign worker error: {exc}")
        finally:
            db.close()
        await asyncio.sleep(60)


@app.on_event("startup")
async def startup_event():
    pause_legacy_admin_accounts()
    if settings.validate_telegram_config():
        print("Telegram API configuration loaded successfully.")
    else:
        print("WARNING: Telegram API configuration is missing or invalid.")

    asyncio.create_task(campaign_worker())
    asyncio.create_task(monitor_service.start_monitoring())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
