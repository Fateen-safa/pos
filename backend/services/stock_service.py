from typing import List, Dict, Optional
from backend.repositories.stock_repository import StockRepository
from backend.models.stock import Stock

class StockService:
	def __init__(self, stock_repository: StockRepository):
		self.stock_repo = stock_repository
    
	def get_all_stock(self) -> List[Dict]:
		stock_items = self.stock_repo.get_all()
		return [item.to_dict() for item in stock_items]
    
	def add_stock_item(self, name: str, price: float, quantity: int) -> Dict:
		# Check if item already exists
		existing_item = self.stock_repo.get_by_name(name)
		if existing_item:
			# Update existing item
			updated_item = self.stock_repo.update(
				existing_item.id, 
				price=price, 
				quantity=existing_item.quantity + quantity
			)
			return updated_item.to_dict()
        
		# Create new item
		new_item = self.stock_repo.create(name, quantity, price)
		return new_item.to_dict()
    
	def update_stock_quantity(self, product_id: int, quantity: int) -> Optional[Dict]:
		# Negative quantity means reducing stock
		stock_item = self.stock_repo.update_stock_quantity(product_id, -quantity)
		return stock_item.to_dict() if stock_item else None
    
	def delete_stock_item(self, product_id: int) -> bool:
		return self.stock_repo.delete(product_id)
    
	def search_stock(self, search_term: str) -> List[Dict]:
		all_items = self.stock_repo.get_all()
		search_term = search_term.lower()
		filtered = [
			item.to_dict() for item in all_items 
			if search_term in item.item_name.lower()
		]
		return filtered

