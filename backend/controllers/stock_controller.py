from flask import Blueprint, request, jsonify
from backend.services.stock_service import StockService
from backend.repositories.stock_repository import StockRepository
from backend.database.db_config import get_db

stock_bp = Blueprint('stock', __name__)

@stock_bp.route('/stock', methods=['GET'])
def get_stock():
	db = next(get_db())
	stock_repo = StockRepository(db)
	stock_service = StockService(stock_repo)
    
	stock_items = stock_service.get_all_stock()
	return jsonify(stock_items)

@stock_bp.route('/stock', methods=['POST'])
def add_stock_item():
	db = next(get_db())
	data = request.json
    
	stock_repo = StockRepository(db)
	stock_service = StockService(stock_repo)
    
	name = data.get('name')
	price = float(data.get('price', 0))
	quantity = int(data.get('stock', 0))
    
	if not name or price <= 0 or quantity < 0:
		return jsonify({"error": "Invalid input"}), 400
    
	new_item = stock_service.add_stock_item(name, price, quantity)
	return jsonify(new_item), 201

@stock_bp.route('/stock/<int:product_id>', methods=['DELETE'])
def delete_stock_item(product_id: int):
	db = next(get_db())
	stock_repo = StockRepository(db)
	stock_service = StockService(stock_repo)
    
	if stock_service.delete_stock_item(product_id):
		return jsonify({"message": "Product deleted", "id": product_id})
	return jsonify({"error": "Product not found"}), 404

@stock_bp.route('/stock/update', methods=['POST'])
def update_stock():
	db = next(get_db())
	data = request.json
    
	stock_repo = StockRepository(db)
	stock_service = StockService(stock_repo)
    
	product_id = data.get('product_id')
	quantity = data.get('quantity')
    
	if not product_id or quantity is None:
		return jsonify({"error": "Missing product_id or quantity"}), 400
    
	result = stock_service.update_stock_quantity(product_id, quantity)
	
	if result:
		return jsonify(result)
	return jsonify({"error": "Product not found or insufficient stock"}), 404

@stock_bp.route('/stock/search', methods=['GET'])
def search_stock():
	db = next(get_db())
	search_term = request.args.get('q', '')
    
	stock_repo = StockRepository(db)
	stock_service = StockService(stock_repo)
    
	results = stock_service.search_stock(search_term)
	return jsonify(results)

