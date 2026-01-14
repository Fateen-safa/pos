"""One-off helper to create DB tables for development.

Run this after setting environment vars or ensuring `Config.DATABASE_URL` is correct.
"""
from backend.database.db_config import engine, Base

# Import models so they are registered with the Base metadata
from backend.models import stock, transaction  # noqa: F401


def create_tables():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")


if __name__ == "__main__":
    create_tables()
