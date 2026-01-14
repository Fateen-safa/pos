from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.models.transaction import Transaction

class TransactionRepository:
	def __init__(self, db: Session):
		self.db = db
    
	def get_all(self, limit: int = 50) -> List[Transaction]:
		return self.db.query(Transaction).order_by(desc(Transaction.date)).limit(limit).all()
    
	def get_by_id(self, transaction_id: int) -> Optional[Transaction]:
		return self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
	def get_by_receipt_number(self, receipt_number: str) -> Optional[Transaction]:
		return self.db.query(Transaction).filter(Transaction.receipt_number == receipt_number).first()
    
	def create(self, receipt_number: str, customer_name: str, 
			   products: dict, total: float, status: str = "completed") -> Transaction:
		transaction = Transaction(
			receipt_number=receipt_number,
			customer_name=customer_name,
			products=products,
			total=total,
			status=status
		)
		self.db.add(transaction)
		self.db.commit()
		self.db.refresh(transaction)
		return transaction
    
	def delete(self, transaction_id: int) -> bool:
		transaction = self.get_by_id(transaction_id)
		if transaction:
			self.db.delete(transaction)
			self.db.commit()
			return True
		return False

