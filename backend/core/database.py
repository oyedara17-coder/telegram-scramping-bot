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
        # URL-encode the token to handle JWT special characters (., +, /, =, etc.)
        encoded_token = quote(token, safe="")
        sep = "&" if "?" in db_url else "?"
        db_url = f"{db_url}{sep}authToken={encoded_token}"
        print("INFO: LIBSQL_AUTH_TOKEN detected and URL-encoded into connection URL.")
    else:
        print("WARNING: No LIBSQL_AUTH_TOKEN found. Remote Turso connection will fail.")

print(f"INFO: Connecting to DB (masked): {db_url[:60]}...")

engine = create_engine(
    db_url,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
