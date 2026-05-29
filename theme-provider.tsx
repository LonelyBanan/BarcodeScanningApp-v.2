import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './ui/button';
import { Camera, CameraOff } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {
          // Error callback - ignore
        }
      );
      setIsScanning(true);
    } catch (err) {
      setError('Failed to start camera. Please check permissions.');
      console.error(err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {!isScanning ? (
          <Button onClick={startScanning}>
            <Camera className="mr-2 h-4 w-4" />
            Start Scanning
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="destructive">
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Scanning
          </Button>
        )}
      </div>
      
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      
      <div id="qr-reader" className="w-full max-w-md" />
    </div>
  );
}
