import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from core.database import engine, SessionLocal
from core.auth import get_password_hash
from models import models

def init_db():
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    # Check if admin already exists
    admin = db.query(models.User).filter(models.User.username == "stepyzoid studio admin").first()
    if not admin:
        print("Creating admin user...")
        admin = models.User(
            username="stepyzoid studio admin",
            password_hash=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin)
        db.commit()
        print("Admin user created (stepyzoid studio admin / admin123)")
    else:
        print("Admin user already exists")
    db.close()

if __name__ == "__main__":
    init_db()
