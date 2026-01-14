from sqlalchemy import Column, Integer, String, Float
from backend.database.db_config import Base
#stock class is defined here and it's the lowest class to be used by other files 
#the idea of stock class is like item class but does'nt define indivsual item but for stock of of same name items 
#the defention is kinda confusing but what is improtant to know it's for one tybe of items like "apple"
#the full stock/items list is the data base itself 
class Stock(Base):
	__tablename__ = "stocks"
    
	id = Column(Integer, primary_key=True, index=True)
	item_name = Column(String, unique=True, nullable=False)
	quantity = Column(Integer, nullable=False)
	price = Column(Float, nullable=False)
    
	def to_dict(self):
		return {
			"id": self.id,
			"name": self.item_name,
			"stock": self.quantity,
			"price": self.price
		}

    
