# Python Barcode Scanning App - Installation & Setup Guide

## Project Structure

```
Barcodescanningapp/
├── app.py                          # Main Flask application
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
├── README_PYTHON.md               # This file
├── services/
│   ├── __init__.py
│   ├── barcode_service.py         # Barcode/QR code scanning and generation
│   ├── excel_service.py           # Excel import/export functionality
│   ├── google_sheets_service.py   # Google Sheets integration
│   └── inventory_service.py       # Inventory business logic
└── uploads/                        # Temporary file storage
```

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/LonelyBanan/Barcodescanningapp.git
cd Barcodescanningapp
git checkout python-conversion
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file and update configuration as needed:
- `DATABASE_URL`: Database connection string (default: SQLite)
- `FLASK_ENV`: Set to 'production' for production deployment
- `SECRET_KEY`: Change this to a secure random key in production

### 5. Initialize Database

```bash
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

## Running the Application

### Development Mode

```bash
python app.py
```

The application will start on `http://localhost:5000`

### Production Mode

```bash
# Using Gunicorn (recommended)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Inventory Management
- `GET /api/inventory` - Get all items
- `POST /api/inventory` - Add new item
- `GET /api/inventory/<item_id>` - Get specific item
- `PUT /api/inventory/<item_id>` - Update item
- `DELETE /api/inventory/<item_id>` - Delete item
- `GET /api/inventory/search?q=<query>` - Search items

### Barcode Operations
- `POST /api/barcode/scan` - Scan barcode from image
- `POST /api/barcode/generate` - Generate barcode image

### Excel Operations
- `GET /api/excel/export` - Export inventory to Excel
- `POST /api/excel/import` - Import inventory from Excel

### Google Sheets Integration
- `POST /api/sheets/sync` - Sync from Google Sheets

## System Requirements

### For Barcode/QR Code Scanning
- OpenCV (opencv-python)
- pyzbar library
- Pillow for image processing

### For Excel Operations
- openpyxl
- pandas

### For Google Sheets
- requests
- pandas

## Key Features

### 1. Barcode/QR Code Management
- Generate barcodes (Code128)
- Generate QR codes
- Scan barcodes from images
- Scan QR codes from images

### 2. Inventory Management
- Add/edit/delete inventory items
- Track material codes, quantities, availability
- Record location and timestamps
- Image URL storage for products

### 3. Excel Integration
- Export inventory to Excel with formatted columns
- Import inventory from Excel files
- Automatic data validation and conversion

### 4. Google Sheets Sync
- Import data from public Google Sheets
- Automatic data parsing
- Support for multiple sheet tabs

### 5. Search & Statistics
- Full-text search across all fields
- Inventory statistics
- Low stock alerts
- Material code generation

## Database Schema

### InventoryItem Table

```
- id: UUID (Primary Key)
- barcode: String (Unique)
- material_code: String
- material_name: String
- size: String (Optional)
- texture: String (Optional)
- quantity: Integer
- timestamp: DateTime
- availability: String
- image_url: String (Optional)
- reserved_for_project: String (Optional)
- last_searched_timestamp: DateTime (Optional)
- last_searched_location: String (Optional)
- created_at: DateTime
- updated_at: DateTime
```

## Usage Examples

### Add Inventory Item

```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "materialName": "Steel Plate 10mm",
    "size": "500x1000",
    "quantity": 50,
    "availability": "In Stock"
  }'
```

### Export to Excel

```bash
curl -X GET http://localhost:5000/api/excel/export \
  -o inventory.xlsx
```

### Sync from Google Sheets

```bash
curl -X POST http://localhost:5000/api/sheets/sync \
  -H "Content-Type: application/json" \
  -d '{
    "sheetUrl": "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
  }'
```

## Troubleshooting

### Issue: "No module named 'services'"
**Solution**: Make sure you're running from the project root directory and the virtual environment is activated.

### Issue: Database not found
**Solution**: Run database initialization: 
```bash
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

### Issue: Barcode scanning not working
**Solution**: Ensure opencv-python and pyzbar are properly installed:
```bash
pip install --upgrade opencv-python pyzbar
```

### Issue: Google Sheets sync fails
**Solution**: Verify that the Google Sheet is publicly accessible (Anyone with the link can view).

## Deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Heroku Deployment

1. Create `Procfile`:
```
web: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

2. Deploy:
```bash
git push heroku python-conversion:main
```

## Development Notes

### Adding New Services

1. Create new service file in `services/` folder
2. Create a class inheriting from base patterns
3. Add to `services/__init__.py`
4. Import in `app.py`

### Database Migrations

For production, consider using Flask-Migrate:

```bash
pip install Flask-Migrate
flask db init
flask db migrate
flask db upgrade
```

## Performance Optimization

For production deployments:
- Use PostgreSQL instead of SQLite
- Enable query caching
- Use connection pooling
- Deploy behind Nginx
- Enable GZIP compression
- Use CDN for static files

## License

This project is open source. See LICENSE file for details.

## Support

For issues or questions, please create an issue on GitHub.
