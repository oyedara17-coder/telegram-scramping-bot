import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from core.database import engine, SessionLocal
from models import models

# Use a simpler hashing method if passlib/bcrypt is failing in this environment
import hashlib

def get_simple_hash(password):
    # This is ONLY for troubleshooting/initial setup if bcrypt fails
    # We should use proper bcrypt in production
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    # Check if admin already exists
    admin = db.query(models.User).filter(models.User.username == "stepyzoid studio admin").first()
    if not admin:
        print("Creating admin user...")
        # We'll use get_password_hash from auth.py first, if it fails we fall back
        try:
            from core.auth import get_password_hash
            pwd_hash = get_password_hash("admin123")
        except:
            print("Bcrypt failed, using SHA256 fallback for init...")
            pwd_hash = get_simple_hash("admin123")
            
        admin = models.User(
            username="stepyzoid studio admin",
            password_hash=pwd_hash,
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
