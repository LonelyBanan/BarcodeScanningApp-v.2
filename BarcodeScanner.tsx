"""
Barcode Service Module
Handles barcode generation and scanning operations
"""

import cv2
import barcode
from barcode.writer import ImageWriter
from pyzbar.pyzbar import decode
from PIL import Image
from io import BytesIO
import numpy as np
from datetime import datetime

class BarcodeService:
    """Service for barcode operations"""
    
    def __init__(self):
        """Initialize barcode service"""
        self.barcode_format = 'code128'
    
    def generate_barcode(self, value: str) -> Image.Image:
        """
        Generate barcode image from value
        
        Args:
            value: String value to encode
            
        Returns:
            PIL Image object
        """
        try:
            # Remove spaces and special characters for barcode encoding
            clean_value = ''.join(c for c in value if c.isalnum())
            
            # Create barcode
            barcode_obj = barcode.get(self.barcode_format, clean_value, writer=ImageWriter())
            
            # Generate image
            img_io = BytesIO()
            barcode_obj.write(img_io)
            img_io.seek(0)
            
            return Image.open(img_io)
        except Exception as e:
            raise Exception(f"Error generating barcode: {str(e)}")
    
    def scan_barcode(self, file) -> list:
        """
        Scan barcode from image file
        
        Args:
            file: Image file object
            
        Returns:
            List of detected barcode values
        """
        try:
            # Read image
            image_stream = file.read()
            image_array = np.frombuffer(image_stream, np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            if image is None:
                raise Exception("Invalid image file")
            
            # Convert to PIL Image for pyzbar
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            
            # Decode barcodes
            decoded_barcodes = decode(pil_image)
            
            barcodes = []
            for barcode_obj in decoded_barcodes:
                barcode_data = barcode_obj.data.decode('utf-8')
                barcodes.append(barcode_data)
            
            return barcodes
        except Exception as e:
            raise Exception(f"Error scanning barcode: {str(e)}")
    
    def generate_qr_code(self, value: str) -> Image.Image:
        """
        Generate QR code image from value
        
        Args:
            value: String value to encode
            
        Returns:
            PIL Image object
        """
        try:
            import qrcode
            
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(value)
            qr.make(fit=True)
            
            return qr.make_image(fill_color="black", back_color="white")
        except Exception as e:
            raise Exception(f"Error generating QR code: {str(e)}")
    
    def scan_qr_code(self, file) -> list:
        """
        Scan QR code from image file
        
        Args:
            file: Image file object
            
        Returns:
            List of detected QR code values
        """
        try:
            # Read image
            image_stream = file.read()
            image_array = np.frombuffer(image_stream, np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            if image is None:
                raise Exception("Invalid image file")
            
            # Convert to PIL Image for pyzbar
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            
            # Decode QR codes
            decoded_qrcodes = decode(pil_image)
            
            qrcodes = []
            for qrcode_obj in decoded_qrcodes:
                qrcode_data = qrcode_obj.data.decode('utf-8')
                qrcodes.append(qrcode_data)
            
            return qrcodes
        except Exception as e:
            raise Exception(f"Error scanning QR code: {str(e)}")
