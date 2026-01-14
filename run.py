"""
Docker-compatible entry point for POS System
"""
import os
import sys
from flask import Flask, send_from_directory, jsonify, send_file

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import create_app

app = create_app()

# Get absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

# Debug: Print directory structure
print(f" Base directory: {BASE_DIR}")
print(f" Frontend directory: {FRONTEND_DIR}")
print(f" Exists: {os.path.exists(FRONTEND_DIR)}")
if os.path.exists(FRONTEND_DIR):
    print(f" Contents: {os.listdir(FRONTEND_DIR)}")

# Serve frontend files
@app.route('/')
def index():
    index_path = os.path.join(FRONTEND_DIR, 'index.html')
    if os.path.exists(index_path):
        return send_file(index_path)
    else:
        return f"index.html not found at {index_path}", 404

@app.route('/<path:filename>')
def serve_file(filename):
    file_path = os.path.join(FRONTEND_DIR, filename)
    
    if filename.endswith('.css'):
        return send_file(file_path, mimetype='text/css')
    elif filename.endswith('.js'):
        return send_file(file_path, mimetype='application/javascript')
    elif os.path.exists(file_path):
        return send_file(file_path)
    
    return f"File {filename} not found at {file_path}", 404

# Health check endpoint
@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "service": "POS System",
        "docker": True
    })

# Debug endpoint to list all routes
@app.route('/debug/routes')
def debug_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        if 'static' not in rule.rule:
            routes.append({
                "endpoint": rule.endpoint,
                "methods": list(rule.methods),
                "rule": rule.rule
            })
    return jsonify({"routes": routes})

if __name__ == '__main__':
    print("=" * 60)
    print(" SHAIKEL POS SYSTEM - OOP STRUCTURE")
    print("=" * 60)
    print(" Frontend: http://localhost:5000")
    print(" API: http://localhost:5000/api/*")
    print(" Structure: OOP with Controllers/Services/Repositories")
    print("=" * 60)
    
    # Show available routes
    print("\n Available Routes:")
    app.testing = True
    with app.test_request_context():
        for rule in app.url_map.iter_rules():
            if rule.rule.startswith('/api') or rule.rule in ['/', '/health']:
                print(f" {rule.rule}")
    
    print("\n Starting server...")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)