from typing import List, Dict, Optional
from datetime import datetime
from backend.repositories.transaction_repository import TransactionRepository
from backend.repositories.stock_repository import StockRepository

class TransactionService:
	def __init__(self, transaction_repo: TransactionRepository, stock_repo: StockRepository):
		self.transaction_repo = transaction_repo
		self.stock_repo = stock_repo
    
	def get_recent_transactions(self, limit: int = 50) -> List[Dict]:
		transactions = self.transaction_repo.get_all(limit)
		return [tx.to_dict() for tx in transactions]
    
	def create_transaction(self, customer_name: str, products: List[Dict], 
						  status: str = "completed") -> Dict:
		# Calculate total
		total = sum(item['product']['price'] * item['quantity'] for item in products)
        
		# Generate receipt number
		last_transaction = self.transaction_repo.get_all(1)
		next_id = last_transaction[0].id + 1 if last_transaction else 1
		receipt_number = f"T-{str(next_id).zfill(5)}"
        
		# Create transaction
		transaction = self.transaction_repo.create(
			receipt_number=receipt_number,
			customer_name=customer_name,
			products=products,
			total=total,
			status=status
		)
        
		# Update stock quantities
		for item in products:
			product_id = item['product']['id']
			quantity = item['quantity']
			self.stock_repo.update_stock_quantity(product_id, -quantity)
        
		return transaction.to_dict()
    
	def delete_transaction(self, transaction_id: int) -> bool:
		# Optional: Restore stock if needed
		return self.transaction_repo.delete(transaction_id)

