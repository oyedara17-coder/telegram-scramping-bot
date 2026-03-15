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

if is_libsql and settings.LIBSQL_AUTH_TOKEN:
    # Adding authToken to connect_args for sqlalchemy-libsql
    connect_args["authToken"] = settings.LIBSQL_AUTH_TOKEN

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
