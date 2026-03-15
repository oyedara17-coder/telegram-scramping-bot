from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_settings
from core.database import engine, Base, SessionLocal
import asyncio
from datetime import datetime
from services.messaging_service import messaging_service
from services.monitor_service import monitor_service
from models import models
from api import users, accounts, telegram, campaigns, admin, keywords

settings = get_settings()


# Create database tables
try:
    print(f"Connecting to database at: {engine.url.render_as_string(hide_password=True)}")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")
except Exception as e:
    print(f"FATAL ERROR: Failed to create database tables: {e}")
    print("Please check your DATABASE_URL and LIBSQL_AUTH_TOKEN environment variables.")
    # We don't exit here so at least the server might start or logs will show up before crash

app = FastAPI(title=settings.PROJECT_NAME)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["Accounts"])
app.include_router(telegram.router, prefix="/api/telegram", tags=["Telegram"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["Campaigns"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(keywords.router, prefix="/api/keywords", tags=["Keywords"])

@app.get("/")

async def root():
    return {"message": "Telegram Scraping Platform API is running"}

async def campaign_worker():
    """Background worker to process scheduled campaigns."""
    while True:
        try:
            db = SessionLocal()
            try:
                now = datetime.now()
                # Find pending campaigns where schedule_time <= now
                scheduled_campaigns = db.query(models.Campaign).filter(
                    models.Campaign.status == "pending",
                    models.Campaign.schedule_time <= now
                ).all()

                for campaign in scheduled_campaigns:
                    # Run the campaign logic - note that run_campaign handles status updates
                    asyncio.create_task(messaging_service.run_campaign(campaign.id, db))
                
            finally:
                db.close()
        except Exception as e:
            print(f"Campaign worker error: {e}")
            
        await asyncio.sleep(60) # Check every minute

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(campaign_worker())
    asyncio.create_task(monitor_service.start_monitoring())

if __name__ == "__main__":

    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
