from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models.stock import Stock

class StockRepository:
	def __init__(self, db: Session):
		self.db = db
    
	def get_all(self) -> List[Stock]:
		return self.db.query(Stock).all()
    
	def get_by_id(self, stock_id: int) -> Optional[Stock]:
		return self.db.query(Stock).filter(Stock.id == stock_id).first()
    
	def get_by_name(self, name: str) -> Optional[Stock]:
		return self.db.query(Stock).filter(Stock.item_name == name).first()
    
	def create(self, item_name: str, quantity: int, price: float) -> Stock:
		stock_item = Stock(item_name=item_name, quantity=quantity, price=price)
		self.db.add(stock_item)
		self.db.commit()
		self.db.refresh(stock_item)
		return stock_item
    
	def update(self, stock_id: int, **kwargs) -> Optional[Stock]:
		stock_item = self.get_by_id(stock_id)
		if stock_item:
			for key, value in kwargs.items():
				setattr(stock_item, key, value)
			self.db.commit()
			self.db.refresh(stock_item)
		return stock_item
    
	def delete(self, stock_id: int) -> bool:
		stock_item = self.get_by_id(stock_id)
		if stock_item:
			self.db.delete(stock_item)
			self.db.commit()
			return True
		return False
    
	def update_stock_quantity(self, stock_id: int, quantity_change: int) -> Optional[Stock]:
		stock_item = self.get_by_id(stock_id)
		if stock_item:
			new_quantity = stock_item.quantity + quantity_change
			if new_quantity >= 0:
				stock_item.quantity = new_quantity
				self.db.commit()
				self.db.refresh(stock_item)
				return stock_item
		return None

