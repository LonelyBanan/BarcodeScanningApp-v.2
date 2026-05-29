"""
Barcode Scanning App - Python Flask Backend
Predmet Furniture Warehouse Inventory Management System
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from io import BytesIO
import os
from dotenv import load_dotenv
import uuid

# Import services
from services.barcode_service import BarcodeService
from services.excel_service import ExcelService
from services.google_sheets_service import GoogleSheetsService
from services.inventory_service import InventoryService

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 
    'sqlite:///inventory.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False

# Initialize database
db = SQLAlchemy(app)

# Initialize services
barcode_service = BarcodeService()
excel_service = ExcelService()
google_sheets_service = GoogleSheetsService()
inventory_service = InventoryService(db)

# Models
class InventoryItem(db.Model):
    """Inventory Item Model"""
    __tablename__ = 'inventory_items'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    barcode = db.Column(db.String(100), unique=True, nullable=False, index=True)
    material_code = db.Column(db.String(20), nullable=False)
    material_name = db.Column(db.String(255), nullable=False)
    size = db.Column(db.String(100))
    texture = db.Column(db.String(255))
    quantity = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    availability = db.Column(db.String(50), default='In Stock')
    image_url = db.Column(db.String(500))
    reserved_for_project = db.Column(db.String(255))
    last_searched_timestamp = db.Column(db.DateTime)
    last_searched_location = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'barcode': self.barcode,
            'materialCode': self.material_code,
            'materialName': self.material_name,
            'size': self.size,
            'texture': self.texture,
            'quantity': self.quantity,
            'timestamp': self.timestamp.isoformat(),
            'availability': self.availability,
            'imageUrl': self.image_url,
            'reservedForProject': self.reserved_for_project,
            'lastSearchedTimestamp': self.last_searched_timestamp.isoformat() if self.last_searched_timestamp else None,
            'lastSearchedLocation': self.last_searched_location,
        }

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Barcode Scanning App is running'}), 200

# Inventory Management Routes
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    """Get all inventory items"""
    try:
        items = InventoryItem.query.all()
        return jsonify([item.to_dict() for item in items]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventory', methods=['POST'])
def add_inventory_item():
    """Add new inventory item"""
    try:
        data = request.get_json()
        
        # Generate material code if not provided
        material_code = data.get('materialCode') or inventory_service.generate_material_code(
            data.get('materialName', '')
        )
        
        # Generate barcode
        barcode = inventory_service.generate_barcode()
        
        # Create new item
        new_item = InventoryItem(
            barcode=barcode,
            material_code=material_code,
            material_name=data.get('materialName'),
            size=data.get('size'),
            texture=data.get('texture'),
            quantity=data.get('quantity', 0),
            availability=data.get('availability', 'In Stock'),
            image_url=data.get('imageUrl'),
            reserved_for_project=data.get('reservedForProject'),
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        return jsonify(new_item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/inventory/<item_id>', methods=['GET'])
def get_inventory_item(item_id):
    """Get specific inventory item"""
    try:
        item = InventoryItem.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        return jsonify(item.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventory/<item_id>', methods=['PUT'])
def update_inventory_item(item_id):
    """Update inventory item"""
    try:
        item = InventoryItem.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        item.material_name = data.get('materialName', item.material_name)
        item.size = data.get('size', item.size)
        item.texture = data.get('texture', item.texture)
        item.quantity = data.get('quantity', item.quantity)
        item.availability = data.get('availability', item.availability)
        item.image_url = data.get('imageUrl', item.image_url)
        item.reserved_for_project = data.get('reservedForProject', item.reserved_for_project)
        item.last_searched_location = data.get('lastSearchedLocation', item.last_searched_location)
        item.last_searched_timestamp = datetime.utcnow()
        
        db.session.commit()
        return jsonify(item.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/inventory/<item_id>', methods=['DELETE'])
def delete_inventory_item(item_id):
    """Delete inventory item"""
    try:
        item = InventoryItem.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Barcode Routes
@app.route('/api/barcode/scan', methods=['POST'])
def scan_barcode():
    """Handle barcode scan"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        barcodes = barcode_service.scan_barcode(file)
        
        if not barcodes:
            return jsonify({'error': 'No barcode detected'}), 404
        
        # Check if barcode exists
        existing_item = InventoryItem.query.filter_by(barcode=barcodes[0]).first()
        
        if existing_item:
            return jsonify({
                'found': True,
                'item': existing_item.to_dict()
            }), 200
        
        return jsonify({
            'found': False,
            'barcode': barcodes[0]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/barcode/generate', methods=['POST'])
def generate_barcode_route():
    """Generate barcode image"""
    try:
        data = request.get_json()
        barcode_value = data.get('value') or inventory_service.generate_barcode()
        
        barcode_image = barcode_service.generate_barcode(barcode_value)
        
        # Convert to bytes
        img_io = BytesIO()
        barcode_image.save(img_io, 'PNG')
        img_io.seek(0)
        
        return send_file(
            img_io,
            mimetype='image/png',
            as_attachment=True,
            download_name=f'barcode_{barcode_value}.png'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Excel Routes
@app.route('/api/excel/export', methods=['GET'])
def export_to_excel():
    """Export inventory to Excel"""
    try:
        items = InventoryItem.query.all()
        excel_file = excel_service.export_to_excel(items)
        
        return send_file(
            excel_file,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f"inventory_{datetime.utcnow().strftime('%Y-%m-%d')}.xlsx"
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/excel/import', methods=['POST'])
def import_from_excel():
    """Import inventory from Excel"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        items_data = excel_service.import_from_excel(file)
        
        imported_items = []
        for item_data in items_data:
            # Generate IDs if not present
            item_data['id'] = item_data.get('id', str(uuid.uuid4()))
            item_data['barcode'] = item_data.get('barcode', inventory_service.generate_barcode())
            item_data['material_code'] = item_data.get('material_code', 'IMPORTED')
            
            # Create new item
            new_item = InventoryItem(
                id=item_data.get('id'),
                barcode=item_data['barcode'],
                material_code=item_data.get('material_code', 'IMPORTED'),
                material_name=item_data.get('material_name', 'Imported Item'),
                size=item_data.get('size'),
                texture=item_data.get('texture'),
                quantity=item_data.get('quantity', 0),
                availability=item_data.get('availability', 'In Stock'),
                image_url=item_data.get('image_url'),
                reserved_for_project=item_data.get('reserved_for_project'),
            )
            
            db.session.add(new_item)
            imported_items.append(new_item.to_dict())
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully imported {len(imported_items)} items',
            'items': imported_items
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Google Sheets Routes
@app.route('/api/sheets/sync', methods=['POST'])
def sync_google_sheets():
    """Sync inventory from Google Sheets"""
    try:
        data = request.get_json()
        sheet_url = data.get('sheetUrl')
        
        if not sheet_url:
            return jsonify({'error': 'Sheet URL is required'}), 400
        
        # Fetch data from Google Sheets
        sheet_data = google_sheets_service.fetch_sheet_data(sheet_url)
        
        if not sheet_data:
            return jsonify({'error': 'Failed to fetch data from Google Sheets'}), 400
        
        # Clear existing items and import new ones
        InventoryItem.query.delete()
        
        imported_items = []
        for item_data in sheet_data:
            new_item = InventoryItem(
                id=str(uuid.uuid4()),
                barcode=item_data.get('barcode', inventory_service.generate_barcode()),
                material_code=item_data.get('material_code', 'IMPORTED'),
                material_name=item_data.get('material_name', 'Imported Item'),
                size=item_data.get('size'),
                texture=item_data.get('texture'),
                quantity=item_data.get('quantity', 0),
                availability=item_data.get('availability', 'In Stock'),
                image_url=item_data.get('image_url'),
                reserved_for_project=item_data.get('reserved_for_project'),
            )
            
            db.session.add(new_item)
            imported_items.append(new_item.to_dict())
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully synced {len(imported_items)} items from Google Sheets',
            'items': imported_items
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Search Routes
@app.route('/api/inventory/search', methods=['GET'])
def search_inventory():
    """Search inventory items"""
    try:
        query = request.args.get('q', '')
        
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        items = InventoryItem.query.filter(
            db.or_(
                InventoryItem.material_name.ilike(f'%{query}%'),
                InventoryItem.barcode.ilike(f'%{query}%'),
                InventoryItem.material_code.ilike(f'%{query}%')
            )
        ).all()
        
        return jsonify([item.to_dict() for item in items]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Initialize database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
