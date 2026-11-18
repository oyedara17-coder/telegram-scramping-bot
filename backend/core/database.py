import os
from sqlalchemy import create_engine, inspect, text
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
            print(f"INFO: LibSQL token detected (length: {len(token)} characters).")
            encoded = quote(token, safe="")
            sep = "&" if "?" in db_url else "?"
            db_url = f"{db_url}{sep}authToken={encoded}"
            print(f"INFO: Using LibSQL/Turso with auth token.")
        else:
            print(f"WARNING: LibSQL/Turso URL was detected, but NO LIBSQL_AUTH_TOKEN was found in environment.")
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

def ensure_admin_schema():
    """Apply small, idempotent additive migrations needed by admin controls."""
    inspector = inspect(engine)
    if not inspector.has_table("users") or not inspector.has_table("campaigns"):
        Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)

    user_columns = {column["name"] for column in inspector.get_columns("users")}
    campaign_columns = {column["name"] for column in inspector.get_columns("campaigns")}
    with engine.begin() as connection:
        if "token_version" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0"))
        if "processed_count" not in campaign_columns:
            connection.execute(text("ALTER TABLE campaigns ADD COLUMN processed_count INTEGER NOT NULL DEFAULT 0"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
