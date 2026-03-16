import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote
from .config import get_settings

settings = get_settings()

# Normalize DATABASE_URL for LibSQL/Turso
db_url = settings.DATABASE_URL
if db_url.startswith("libsql://"):
    db_url = db_url.replace("libsql://", "sqlite+libsql://", 1)
elif db_url.startswith("https://") and "turso.io" in db_url:
    db_url = db_url.replace("https://", "sqlite+libsql://", 1)

is_libsql = "libsql" in db_url

# Configure connect arguments
connect_args = {}
if db_url.startswith("sqlite") and not is_libsql:
    connect_args["check_same_thread"] = False

if is_libsql:
    # Read token from multiple sources for reliability
    token = settings.LIBSQL_AUTH_TOKEN or os.environ.get("LIBSQL_AUTH_TOKEN", "")
    
    if token:
        # 1. Add to URL query string (URL-encoded)
        encoded_token = quote(token, safe="")
        sep = "&" if "?" in db_url else "?"
        db_url = f"{db_url}{sep}authToken={encoded_token}"
        
        # 2. ALSO add to connect_args for drivers that prefer it there
        # We use both key variations to be safe
        connect_args["authToken"] = token
        connect_args["auth_token"] = token
        print("INFO: LIBSQL_AUTH_TOKEN configured in URL and connect_args.")
    else:
        print("WARNING: No LIBSQL_AUTH_TOKEN found. Remote Turso connection will fail.")

print(f"INFO: Connecting to DB (masked): {db_url[:60]}...")

# Some versions of the driver might reject extra arguments, so we wrap in try/except 
# but specifically for the engine creation logic
try:
    engine = create_engine(
        db_url,
        connect_args=connect_args
    )
except TypeError as e:
    # If it fails due to unexpected arguments, try again with minimal args
    print(f"DEBUG: Initial engine creation failed ({e}). Retrying with minimal args...")
    engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
