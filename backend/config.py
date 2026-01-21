import os
from dataclasses import dataclass


@dataclass
class Config:
    # Compose DATABASE_URL from individual environment variables for flexibility.
    # POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
    # POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "mypassword")
    # POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    # POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5001")
    # POSTGRES_DB = os.getenv("POSTGRES_DB", "postgres")

    # # DATABASE_URL = os.getenv(
    # #     "DATABASE_URL",
    # #     f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    # # )
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:159357][@localhost:5432/stockdb")
    #DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://myuser:mypassword@db:5432/mydatabase")
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    DEBUG = os.getenv("DEBUG", True)

    # CORS origins for development
    CORS_ORIGINS = [
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "*",
    ]

