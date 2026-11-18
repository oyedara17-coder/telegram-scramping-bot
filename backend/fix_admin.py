from getpass import getpass

from core.auth import get_password_hash
from core.database import Base, SessionLocal, engine, ensure_admin_schema
from models import models


def provision_admin():
    Base.metadata.create_all(bind=engine)
    ensure_admin_schema()

    username = input("Administrator username: ").strip()
    if len(username) < 2 or len(username) > 64:
        raise SystemExit("Username must contain between 2 and 64 characters.")

    password = getpass("New administrator password (12-72 characters): ")
    confirmation = getpass("Confirm password: ")
    if password != confirmation:
        raise SystemExit("Passwords did not match.")
    if len(password) < 12 or len(password) > 72 or len(password.encode("utf-8")) > 72:
        raise SystemExit("Password must contain 12-72 characters and use at most 72 UTF-8 bytes.")

    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if user is None:
            user = models.User(username=username)
            db.add(user)
        user.password_hash = get_password_hash(password)
        user.role = "admin"
        user.status = "active"
        user.token_version = (user.token_version or 0) + 1
        db.commit()
        print(f"Administrator '{username}' is ready. No password was printed or stored in application output.")
    finally:
        db.close()


if __name__ == "__main__":
    provision_admin()
