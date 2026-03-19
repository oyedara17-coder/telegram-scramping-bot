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

def init_admin():
    db = SessionLocal()
    try:
        # Ensure tables exist first
        Base.metadata.create_all(bind=engine)
        
        # Ensure admin exists
        admin_user = db.query(models.User).filter(models.User.username == "stepyzoid").first()
        
        hashed_pw = None
        try:
            from core.auth import get_password_hash
            hashed_pw = get_password_hash("080789")
        except Exception as e:
            print(f"⚠️ Bcrypt failed during hashing: {e}. Using SHA256 fallback for admin.")
            import hashlib
            hashed_pw = hashlib.sha256("080789".encode()).hexdigest()
        
        if not admin_user:
            print("Initializing admin account...")
            new_admin = models.User(
                username="stepyzoid",
                password_hash=hashed_pw,
                role="admin",
                status="active"
            )
            db.add(new_admin)
            print("Admin account created successfully (stepyzoid).")
        else:
            print("Updating admin password...")
            admin_user.password_hash = hashed_pw
            admin_user.role = "admin"
            admin_user.status = "active"
            print("Admin account 'stepyzoid' updated.")
        
        db.commit()
    except Exception as e:
        print(f"❌ FATAL Error initializing admin: {e}")
        db.rollback()
    finally:
        db.close()

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

@app.get("/setup")
async def setup():
    """Force-run admin initialization. Safe to call multiple times."""
    init_admin()
    return {"status": "ok", "message": "Admin initialization complete. Username: stepyzoid, Password: 080789"}

@app.get("/force-reset-admin")
async def force_reset_admin():
    """Nuclear option: DELETE and recreate admin user using raw SQL."""
    db = SessionLocal()
    try:
        from sqlalchemy import text
        
        # Step 1: Delete using raw SQL to avoid any ORM/bcrypt interaction
        db.execute(text("DELETE FROM users WHERE username = 'stepyzoid'"))
        db.commit()
        
        # Step 2: Generate new password hash using sha256 (safest fallback)
        import hashlib
        new_hash = hashlib.sha256("080789".encode()).hexdigest()
        
        # Step 3: Insert fresh admin using raw SQL
        db.execute(text(
            "INSERT INTO users (username, password_hash, role, status) VALUES (:username, :password_hash, :role, :status)"
        ), {"username": "stepyzoid", "password_hash": new_hash, "role": "admin", "status": "active"})
        db.commit()
        
        # Step 4: Verify it works
        result = db.execute(text("SELECT id, username, role, password_hash FROM users WHERE username = 'stepyzoid'")).fetchone()
        if result:
            from core.auth import verify_password
            pw_ok = verify_password("080789", result[3])
            return {
                "status": "ok", 
                "message": f"Admin recreated with SHA256. Password verify: {pw_ok}",
                "user_id": result[0],
                "role": result[2],
                "hash_type": "sha256"
            }
        else:
            return {"status": "error", "message": "Insert succeeded but user not found after insert"}
    except Exception as e:
        db.rollback()
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}
    finally:
        db.close()

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
    # Verify Telegram Configuration
    if settings.validate_telegram_config():
        print("✅ Telegram API configuration loaded successfully.")
    else:
        print("⚠️  WARNING: Telegram API configuration is missing or invalid.")
        print("   Please set TELEGRAM_API_ID and TELEGRAM_API_HASH in your .env or environment.")
        print("   Refer to telethon.rtfd.io for details.")
    
    init_admin()
    asyncio.create_task(campaign_worker())
    asyncio.create_task(monitor_service.start_monitoring())

if __name__ == "__main__":

    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
