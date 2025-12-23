from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Float
from datetime import datetime, timezone
from sqlalchemy import DateTime
from sqlalchemy import JSON

# Replace with your PostgreSQL credentials
DATABASE_URL = "postgresql+psycopg2://postgres:159357][@localhost:5432/stockdb"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Stock(Base):
    __tablename__ = "stocks"
    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, unique=True, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String, unique=True, nullable=False)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    customer_name = Column(String, default="Walk-in Customer")
    products = Column(JSON, nullable=False)  # Stores products as JSON
    total = Column(Float, nullable=False)
    status = Column(String, default="completed")

# Create tables if they don't exist
Base.metadata.create_all(engine)


