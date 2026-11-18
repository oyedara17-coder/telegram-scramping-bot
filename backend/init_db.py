from core.database import Base, engine, ensure_admin_schema
from models import models


def init_db():
    Base.metadata.create_all(bind=engine)
    ensure_admin_schema()
    print("Database schema is ready. No administrator credentials were seeded.")
    print("Create an administrator through the trusted interactive provisioning script.")


if __name__ == "__main__":
    init_db()
