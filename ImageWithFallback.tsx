import { useState } from 'react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface BarcodeGeneratorProps {
  value?: string;
}

export function BarcodeGenerator({ value: initialValue = '' }: BarcodeGeneratorProps) {
  const [value, setValue] = useState(initialValue);
  const [codeType, setCodeType] = useState<'qr' | 'barcode'>('qr');

  const downloadCode = () => {
    const svg = document.getElementById(codeType === 'qr' ? 'qr-code-svg' : 'barcode-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `${codeType}-${value}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Barcode/QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code-value">Value</Label>
          <Input
            id="code-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter text or barcode value"
          />
        </div>

        <Tabs value={codeType} onValueChange={(v) => setCodeType(v as 'qr' | 'barcode')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="barcode">Barcode</TabsTrigger>
          </TabsList>
          
          <TabsContent value="qr" className="space-y-4">
            {value && (
              <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-md">
                <div id="qr-code-svg" className="p-4 bg-white">
                  <QRCode value={value} size={200} />
                </div>
                <Button onClick={downloadCode}>Download QR Code</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="barcode" className="space-y-4">
            {value && (
              <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-md">
                <div id="barcode-svg" className="p-4 bg-white">
                  <Barcode value={value} />
                </div>
                <Button onClick={downloadCode}>Download Barcode</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
