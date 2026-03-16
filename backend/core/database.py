from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
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
    # Explicitly check for token in environment as well, just in case settings lru_cache is stale
    token = settings.LIBSQL_AUTH_TOKEN or os.getenv("LIBSQL_AUTH_TOKEN")
    
    if token:
        # Pass token in URL for better compatibility with different driver versions
        # This prevents "unexpected keyword argument" errors
        if "?" in db_url:
            db_url += f"&authToken={token}"
        else:
            db_url += f"?authToken={token}"
        print("INFO: LIBSQL_AUTH_TOKEN detected and added to URL.")
    else:
        # If the URL is a remote one (not local file), we REQUIRE a token
        if "turso.io" in db_url or db_url.startswith("sqlite+libsql://") and not ":memory:" in db_url:
             print("WARNING: remote LibSQL/Turso URL detected without LIBSQL_AUTH_TOKEN!")

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
