import { useState } from 'react';
import { BarcodeScanner } from './components/BarcodeScanner';
import { BarcodeGenerator } from './components/BarcodeGenerator';
import { InventoryForm } from './components/InventoryForm';
import { InventoryTable, InventoryItem } from './components/InventoryTable';
import { SearchInventory } from './components/SearchInventory';
import { ThemeProvider } from './components/theme-provider';
import { ThemeToggle } from './components/theme-toggle';
import { InstallPrompt } from './components/InstallPrompt';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Download, Package, Upload, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

// Helper function to generate material code from material name
// Examples: "Steel Plate 10mm" -> "10SPL", "Wood Oak Texture" -> "WOT"
function generateMaterialCode(materialName: string): string {
  if (!materialName || materialName.trim() === '') {
    return 'MAT';
  }

  // Split by spaces and special characters
  const words = materialName.trim().split(/[\s\-_,]+/).filter(w => w);

  let code = '';
  let numbers = '';
  let letters = '';

  // Extract all numbers first
  for (const word of words) {
    const nums = word.match(/\d+/g);
    if (nums) {
      numbers += nums.join('');
    }
  }

  // Extract first letters of each word (skip number-only words)
  for (const word of words) {
    if (!/^\d+$/.test(word)) { // Skip pure number words
      const firstLetter = word.charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstLetter)) {
        letters += firstLetter;
      }
    }
  }

  // Build code: numbers first, then letters
  // Example: "Steel Plate 10mm" -> numbers="10", letters="SPM" -> "10SPM"
  code = numbers + letters;

  // If no code generated, use first 3 letters of material name
  if (!code) {
    code = materialName.substring(0, 3).toUpperCase();
  }

  // Limit to 8 characters
  return code.slice(0, 8);
}

// Generate unique barcode
function generateBarcode(): string {
  return `BC${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | undefined>(undefined);

  const addItem = (data: {
    materialName: string;
    size?: string;
    texture?: string;
    quantity: number;
    availability: string;
    imageUrl?: string;
    reservedForProject?: string;
  }) => {
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substring(7),
      barcode: generateBarcode(),
      materialCode: generateMaterialCode(data.materialName),
      materialName: data.materialName,
      size: data.size,
      texture: data.texture,
      quantity: data.quantity,
      timestamp: new Date().toLocaleString(),
      availability: data.availability,
      imageUrl: data.imageUrl,
      reservedForProject: data.reservedForProject,
      lastSearchedTimestamp: undefined,
      lastSearchedLocation: undefined,
    };

    setItems([newItem, ...items]);
    toast.success('Item added successfully!');
  };

  const handleScan = (scannedValue: string) => {
    // Check if item already exists
    const existingItem = items.find(item => item.barcode === scannedValue);

    if (existingItem) {
      setHighlightedItemId(existingItem.id);
      setTimeout(() => setHighlightedItemId(undefined), 3000);
      toast.info(`Scanned existing item: ${existingItem.materialName}`);
      return;
    }

    // For scanned barcodes, we'll create a basic entry
    // In a real app, you might want to prompt for additional details
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substring(7),
      barcode: scannedValue,
      materialCode: 'SCANNED',
      materialName: 'Scanned Item',
      size: undefined,
      texture: undefined,
      quantity: 1,
      timestamp: new Date().toLocaleString(),
      availability: 'In Stock',
      imageUrl: undefined,
      reservedForProject: undefined,
      lastSearchedTimestamp: undefined,
      lastSearchedLocation: undefined,
    };

    setItems([newItem, ...items]);
    toast.success('Barcode scanned and added!');
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast.success('Item deleted successfully!');
  };

  const handleItemFound = (itemId: string, location: string, timestamp: string) => {
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, lastSearchedLocation: location, lastSearchedTimestamp: timestamp }
        : item
    ));
    toast.success('Item found! Location and timestamp recorded.');
  };

  const handleHighlight = (itemId: string) => {
    setHighlightedItemId(itemId);
    setTimeout(() => setHighlightedItemId(undefined), 3000);
  };

  const exportToExcel = () => {
    if (items.length === 0) {
      toast.error('No items to export!');
      return;
    }

    // Prepare data for Excel
    const excelData = items.map(item => ({
      Barcode: item.barcode,
      'Material Code': item.materialCode,
      'Material Name': item.materialName,
      Size: item.size || '',
      Texture: item.texture || '',
      Quantity: item.quantity,
      Timestamp: item.timestamp,
      Availability: item.availability,
      'Image URL': item.imageUrl || '',
      'Reserved For Project': item.reservedForProject || '',
      'Last Searched': item.lastSearchedTimestamp || '',
      'GPS Location': item.lastSearchedLocation || '',
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Barcode
      { wch: 15 }, // Material Code
      { wch: 30 }, // Material Name
      { wch: 15 }, // Size
      { wch: 15 }, // Texture
      { wch: 10 }, // Quantity
      { wch: 20 }, // Timestamp
      { wch: 15 }, // Availability
      { wch: 40 }, // Image URL
      { wch: 30 }, // Reserved For Project
      { wch: 20 }, // Last Searched
      { wch: 25 }, // GPS Location
    ];

    // Generate Excel file
    XLSX.writeFile(wb, `inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file downloaded successfully!');
  };

  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map to inventory items
        const importedItems: InventoryItem[] = jsonData.map((row: any) => ({
          id: Math.random().toString(36).substring(7),
          barcode: row['Barcode'] || row['barcode'] || generateBarcode(),
          materialCode: row['Material Code'] || row['materialCode'] || 'IMPORTED',
          materialName: row['Material Name'] || row['materialName'] || 'Imported Item',
          size: row['Size'] || row['size'] || undefined,
          texture: row['Texture'] || row['texture'] || undefined,
          quantity: Number(row['Quantity'] || row['quantity']) || 0,
          timestamp: row['Timestamp'] || row['timestamp'] || new Date().toLocaleString(),
          availability: row['Availability'] || row['availability'] || 'In Stock',
          imageUrl: row['Image URL'] || row['imageUrl'] || undefined,
          reservedForProject: row['Reserved For Project'] || row['reservedForProject'] || undefined,
          lastSearchedTimestamp: row['Last Searched'] || row['lastSearchedTimestamp'] || undefined,
          lastSearchedLocation: row['GPS Location'] || row['lastSearchedLocation'] || undefined,
        }));

        // Add imported items to existing items
        setItems([...importedItems, ...items]);
        toast.success(`Successfully imported ${importedItems.length} items!`);
      } catch (error) {
        toast.error('Error reading Excel file. Please check the file format.');
        console.error('Import error:', error);
      }
    };

    reader.readAsBinaryString(file);

    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const syncFromGoogleSheets = async () => {
    if (!sheetUrl) {
      toast.error('Please enter a Google Sheets URL');
      return;
    }

    setIsSyncing(true);

    try {
      // Extract sheet ID and gid from URL
      let csvUrl = '';

      // Handle different Google Sheets URL formats
      const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);

      if (!sheetIdMatch) {
        toast.error('Invalid Google Sheets URL. Please check the URL format.');
        setIsSyncing(false);
        return;
      }

      const sheetId = sheetIdMatch[1];
      const gid = gidMatch ? gidMatch[1] : '0';

      // Construct CSV export URL
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

      // Fetch the CSV data
      const response = await fetch(csvUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch data. Make sure the sheet is publicly accessible.');
      }

      const csvText = await response.text();

      // Parse CSV using xlsx library
      const workbook = XLSX.read(csvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Map to inventory items
      const importedItems: InventoryItem[] = jsonData.map((row: any) => ({
        id: Math.random().toString(36).substring(7),
        barcode: row['Barcode'] || row['barcode'] || generateBarcode(),
        materialCode: row['Material Code'] || row['materialCode'] || 'IMPORTED',
        materialName: row['Material Name'] || row['materialName'] || 'Imported Item',
        size: row['Size'] || row['size'] || undefined,
        texture: row['Texture'] || row['texture'] || undefined,
        quantity: Number(row['Quantity'] || row['quantity']) || 0,
        timestamp: row['Timestamp'] || row['timestamp'] || new Date().toLocaleString(),
        availability: row['Availability'] || row['availability'] || 'In Stock',
        imageUrl: row['Image URL'] || row['imageUrl'] || undefined,
        reservedForProject: row['Reserved For Project'] || row['reservedForProject'] || undefined,
        lastSearchedTimestamp: row['Last Searched'] || row['lastSearchedTimestamp'] || undefined,
        lastSearchedLocation: row['GPS Location'] || row['lastSearchedLocation'] || undefined,
      }));

      // Replace all items with synced data
      setItems(importedItems);
      toast.success(`Successfully synced ${importedItems.length} items from Google Sheets!`);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Error syncing from Google Sheets. Please check the URL and sheet permissions.');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="inventory-theme">
      <div className="min-h-screen bg-background">
        <Toaster />
        <InstallPrompt />
      
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Predmet Furniture Warehouse Inventory</h1>
                <p className="text-muted-foreground">Scan, generate, and manage your inventory</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Sync from Google Sheets
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sync from Google Sheets</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="sheet-url">Google Sheets URL</Label>
                      <Input
                        id="sheet-url"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Make sure the sheet is publicly accessible (Anyone with the link can view)
                      </p>
                    </div>
                    <Button onClick={syncFromGoogleSheets} disabled={isSyncing} className="w-full">
                      {isSyncing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync Now
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={() => document.getElementById('excel-upload')?.click()} size="lg" variant="outline">
                <Upload className="mr-2 h-5 w-5" />
                Import Excel
              </Button>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={importFromExcel}
                className="hidden"
              />
              <Button onClick={exportToExcel} size="lg">
                <Download className="mr-2 h-5 w-5" />
                Export to Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tabs for Scanner and Form */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="form" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="form">Add Item</TabsTrigger>
                <TabsTrigger value="scan">Scan</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="mt-4">
                <InventoryForm onAdd={addItem} />
              </TabsContent>

              <TabsContent value="scan" className="mt-4">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Scan Barcode/QR Code</h3>
                  <BarcodeScanner onScan={handleScan} />
                </div>
              </TabsContent>

              <TabsContent value="search" className="mt-4">
                <SearchInventory items={items} onItemFound={handleItemFound} onHighlight={handleHighlight} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Barcode Generator */}
          <div className="lg:col-span-2">
            <BarcodeGenerator value={items[0]?.barcode || ''} />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Inventory Items ({items.length})</h2>
          </div>
          <InventoryTable items={items} onDelete={deleteItem} highlightedId={highlightedItemId} />
        </div>
      </div>
    </div>
    </ThemeProvider>
  );
}

export default App;
