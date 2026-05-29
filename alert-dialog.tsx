import { useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Trash2, QrCode, Package, MapPin, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import QRCodeComponent from 'react-qr-code';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface InventoryItem {
  id: string;
  barcode: string;
  materialCode: string;
  materialName: string;
  size?: string;
  texture?: string;
  quantity: number;
  timestamp: string;
  availability: string;
  imageUrl?: string;
  reservedForProject?: string;
  lastSearchedTimestamp?: string;
  lastSearchedLocation?: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete: (id: string) => void;
  highlightedId?: string;
}

const getAvailabilityColor = (availability: string) => {
  switch (availability) {
    case 'In Stock':
      return 'bg-green-100 text-green-800';
    case 'Low Stock':
      return 'bg-yellow-100 text-yellow-800';
    case 'Out of Stock':
      return 'bg-red-100 text-red-800';
    case 'On Order':
      return 'bg-blue-100 text-blue-800';
    case 'Reserved':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function InventoryTable({ items, onDelete, highlightedId }: InventoryTableProps) {
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  useEffect(() => {
    if (highlightedId && rowRefs.current[highlightedId]) {
      rowRefs.current[highlightedId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedId]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No items yet. Add items manually or scan a barcode to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Material Code</TableHead>
            <TableHead>Material Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Last Search Info</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              ref={(el) => (rowRefs.current[item.id] = el)}
              className={highlightedId === item.id ? 'bg-yellow-100 dark:bg-yellow-900/20 transition-colors' : ''}
            >
              <TableCell>
                {item.imageUrl ? (
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={item.materialName}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <QrCode className="h-4 w-4 mr-2" />
                      {item.barcode.slice(0, 8)}...
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>QR Code - {item.materialName}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4 p-4">
                      <div className="p-6 bg-white rounded-lg">
                        <QRCodeComponent value={item.barcode} size={256} />
                      </div>
                      <p className="font-mono text-sm break-all">{item.barcode}</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
              <TableCell className="font-semibold">{item.materialCode}</TableCell>
              <TableCell>{item.materialName}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.timestamp}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge className={getAvailabilityColor(item.availability)}>
                    {item.availability}
                  </Badge>
                  {item.reservedForProject && (
                    <div className="text-xs text-muted-foreground">
                      Reserved: {item.reservedForProject}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {item.lastSearchedTimestamp ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{item.lastSearchedTimestamp}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[150px]" title={item.lastSearchedLocation}>
                        {item.lastSearchedLocation}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Not searched</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
