import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from core.database import SessionLocal
from models import models
from core.auth import get_password_hash

def fix_admin():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "stepyzoid").first()
        if user:
            print(f"Found admin user: {user.username}, Role: {user.role}")
            print(f"Current password hash: {user.password_hash}")
            user.password_hash = get_password_hash("080789")
            user.role = "admin"
            db.commit()
            print("Password reset to 080789 and role ensured as admin.")
        else:
            print("Admin user not found! Creating...")
            new_admin = models.User(
                username="stepyzoid",
                password_hash=get_password_hash("080789"),
                role="admin"
            )
            db.add(new_admin)
            db.commit()
            print("Created new admin user stepyzoid with password 080789")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin()
