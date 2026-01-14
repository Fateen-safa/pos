from flask import Flask
from flask_cors import CORS
from backend.database.db_config import engine, Base
from backend.config import Config
from backend.controllers.stock_controller import stock_bp
from backend.controllers.transaction_controller import transaction_bp

def create_app():
	app = Flask(__name__)
	app.config.from_object(Config)
    
	# Enable CORS
	CORS(app, origins=Config.CORS_ORIGINS)
    
	# Create database tables
	Base.metadata.create_all(bind=engine)
    
	# Register blueprints
	app.register_blueprint(stock_bp, url_prefix='/api')
	app.register_blueprint(transaction_bp, url_prefix='/api')
    
	# Health check endpoint
	@app.route('/api/health')
	def health_check():
		return {'status': 'healthy', 'service': 'POS System'}
    
	return app

if __name__ == '__main__':
	app = create_app()
	app.run(debug=Config.DEBUG)

