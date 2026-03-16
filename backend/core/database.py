import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL or "sqlite:///./app.db"

# Use SQLite by default (works reliably without external dependencies)
# Only use LibSQL/Turso if explicitly configured AND the driver is available
connect_args = {}
is_libsql = "libsql" in db_url

if is_libsql:
    try:
        token = settings.LIBSQL_AUTH_TOKEN or os.environ.get("LIBSQL_AUTH_TOKEN", "")
        from urllib.parse import quote
        if db_url.startswith("libsql://"):
            db_url = db_url.replace("libsql://", "sqlite+libsql://", 1)
        if token:
            encoded = quote(token, safe="")
            sep = "&" if "?" in db_url else "?"
            db_url = f"{db_url}{sep}authToken={encoded}"
            print(f"INFO: Using LibSQL/Turso with auth token.")
        engine = create_engine(db_url)
        # Test connection to validate
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("SELECT 1"))
        print("INFO: LibSQL/Turso connection successful.")
    except Exception as e:
        print(f"WARNING: LibSQL connection failed ({e}). Falling back to SQLite.")
        db_url = "sqlite:///./app.db"
        connect_args = {"check_same_thread": False}
        engine = create_engine(db_url, connect_args=connect_args)
elif db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    engine = create_engine(db_url, connect_args=connect_args)
else:
    # PostgreSQL or other
    engine = create_engine(db_url)

print(f"INFO: Database engine ready.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
