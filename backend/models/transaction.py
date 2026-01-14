from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime, timezone
from backend.database.db_config import Base
#transaction class is defined here to handle all transaction related data , pretty simple and clear for the most part 
class Transaction(Base):
	__tablename__ = "transactions"
    
	id = Column(Integer, primary_key=True, index=True)
	receipt_number = Column(String, unique=True, nullable=False)
	date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
	customer_name = Column(String, default="Walk-in Customer")
	products = Column(JSON, nullable=False)
	total = Column(Float, nullable=False)
	status = Column(String, default="completed")
    
	def to_dict(self):
		return {
			"id": self.id,
			"receiptNumber": self.receipt_number,
			"date": self.date.isoformat(),
			"customerName": self.customer_name,
			"products": self.products,
			"total": self.total,
			"status": self.status
		}

