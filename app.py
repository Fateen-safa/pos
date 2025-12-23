from flask import Flask, request, jsonify
from flask_cors import CORS
from database import SessionLocal, Stock , Transaction
app = Flask(__name__)
CORS(app)  # allow requests from your frontend (JS in browser)


products = []
transactions = []
transaction_counter = 1

#delete the proudct 
@app.route("/delete_product/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    db = SessionLocal()
    product = db.query(Stock).filter(Stock.id == product_id).first()
    if not product:
        db.close()
        return jsonify({"error": "Product not found"}), 404

    db.delete(product)
    db.commit()
    db.close()
    return jsonify({"message": "Product deleted", "id": product_id})



# Decrease stock after a sale
@app.route("/update_stock", methods=["POST"])
def update_stock():
    db = SessionLocal()
    data = request.json  # expects { "product_id": 1, "quantity": 2 }
    
    product_id = data.get("product_id")
    quantity = data.get("quantity")

    stock_item = db.query(Stock).filter(Stock.id == product_id).first()
    if not stock_item:
        db.close()
        return jsonify({"error": "Product not found"}), 404

    if stock_item.quantity < quantity:
        db.close()
        return jsonify({"error": "Not enough stock"}), 400

    stock_item.quantity -= quantity
    db.commit()
    db.refresh(stock_item)
    db.close()

    return jsonify({
        "message": "Stock updated",
        "product_id": stock_item.id,
        "remaining": stock_item.quantity
    })


#load the items from the data base 
@app.route("/get_stock", methods=["GET"])
def get_stock():
    print("show")
    db = SessionLocal()
    items = db.query(Stock).all()
    db.close()

    return jsonify([
        {
            "id": i.id,
            "name": i.item_name,
            "stock": i.quantity,
            "price": i.price  # <-- include price
        }
        for i in items
    ])





#add item to the database 
@app.route("/add_item", methods=["POST"])
def add_item():
    print("added")
    db = SessionLocal()
    data = request.json

    # Create new stock item including price
    item = Stock(
        item_name=data["name"],
        quantity=int(data["stock"]),
        price=float(data["price"])
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    db.close()

    return jsonify({
        "id": item.id,
        "name": item.item_name,
        "stock": item.quantity,
        "price": item.price 
        })





# #load the transactions
# @app.route("/transactions", methods=["GET"])
# def get_transactions():
#     return jsonify(transactions)



# #add the transaction
# @app.route("/transactions", methods=["POST"])
# def add_transaction():
#     global transaction_counter
#     data = request.json
#     transaction = {
#         "id": transaction_counter,
#         "receiptNumber": f"T-{str(transaction_counter).zfill(5)}",
#         "date": data["date"],
#         "customerName": data["customerName"],
#         "products": data["products"],
#         "total": data["total"],
#         "status": data["status"]
#     }
#     transactions.append(transaction)
#     transaction_counter += 1

#     return jsonify(transaction), 201


from sqlalchemy.orm import Session
from datetime import datetime, timedelta

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Load last 50 transactions
@app.route("/transactions", methods=["GET"])
def get_transactions():
    db = next(get_db())
    
    # Get last 50 transactions ordered by date (newest first)
    transactions = db.query(Transaction).order_by(Transaction.date.desc()).limit(50).all()
    
    # Convert to dictionary format for JSON response
    transactions_data = []
    for tx in transactions:
        transactions_data.append({
            "id": tx.id,
            "receiptNumber": tx.receipt_number,
            "date": tx.date.isoformat(),
            "customerName": tx.customer_name,
            "products": tx.products,
            "total": tx.total,
            "status": tx.status
        })
    
    db.close()
    return jsonify(transactions_data)

# Add a new transaction
@app.route("/transactions", methods=["POST"])
def add_transaction():
    db = next(get_db())
    data = request.json
    
    try:
        # Generate receipt number based on latest transaction ID
        last_transaction = db.query(Transaction).order_by(Transaction.id.desc()).first()
        next_id = last_transaction.id + 1 if last_transaction else 1
        
        # Create new transaction
        transaction = Transaction(
            receipt_number=f"T-{str(next_id).zfill(5)}",
            date=datetime.fromisoformat(data["date"]),
            customer_name=data.get("customerName", "Walk-in Customer"),
            products=data["products"],
            total=data["total"],
            status=data.get("status", "completed")
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        # Return the created transaction
        response = {
            "id": transaction.id,
            "receiptNumber": transaction.receipt_number,
            "date": transaction.date.isoformat(),
            "customerName": transaction.customer_name,
            "products": transaction.products,
            "total": transaction.total,
            "status": transaction.status
        }
        
        db.close()
        return jsonify(response), 201
        
    except Exception as e:
        db.rollback()
        db.close()
        return jsonify({"error": str(e)}), 500
    


# Delete a transaction
@app.route("/transactions/<int:transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    db = next(get_db())
    
    try:
        # Find the transaction
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        
        if not transaction:
            db.close()
            return jsonify({"error": "Transaction not found"}), 404
        
        # Delete the transaction
        db.delete(transaction)
        db.commit()
        
        db.close()
        return jsonify({"message": "Transaction deleted successfully"}), 200
        
    except Exception as e:
        db.rollback()
        db.close()
        return jsonify({"error": str(e)}), 500    


if __name__ == "__main__":
    app.run(debug=True)
