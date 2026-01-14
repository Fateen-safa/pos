from flask import Blueprint, request, jsonify
from backend.services.transaction_service import TransactionService
from backend.repositories.transaction_repository import TransactionRepository
from backend.repositories.stock_repository import StockRepository
from backend.database.db_config import get_db

transaction_bp = Blueprint('transaction', __name__)

@transaction_bp.route('/transactions', methods=['GET'])
def get_transactions():
	db = next(get_db())
	transaction_repo = TransactionRepository(db)
	stock_repo = StockRepository(db)
	transaction_service = TransactionService(transaction_repo, stock_repo)
    
	transactions = transaction_service.get_recent_transactions()
	return jsonify(transactions)

@transaction_bp.route('/transactions', methods=['POST'])
def create_transaction():
	db = next(get_db())
	data = request.json
    
	transaction_repo = TransactionRepository(db)
	stock_repo = StockRepository(db)
	transaction_service = TransactionService(transaction_repo, stock_repo)
    
	customer_name = data.get('customerName', 'Walk-in Customer')
	products = data.get('products', [])
	status = data.get('status', 'completed')
    
	if not products:
		return jsonify({"error": "No products in transaction"}), 400
    
	transaction = transaction_service.create_transaction(customer_name, products, status)
	return jsonify(transaction), 201

@transaction_bp.route('/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id: int):
	db = next(get_db())
	transaction_repo = TransactionRepository(db)
	stock_repo = StockRepository(db)
	transaction_service = TransactionService(transaction_repo, stock_repo)
    
	if transaction_service.delete_transaction(transaction_id):
		return jsonify({"message": "Transaction deleted successfully"})
	return jsonify({"error": "Transaction not found"}), 404

