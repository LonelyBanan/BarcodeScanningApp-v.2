import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, MapPin, Clock } from 'lucide-react';
import { InventoryItem } from './InventoryTable';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SearchInventoryProps {
  items: InventoryItem[];
  onItemFound: (itemId: string, location: string, timestamp: string) => void;
  onHighlight?: (itemId: string) => void;
}

export function SearchInventory({ items, onItemFound, onHighlight }: SearchInventoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<InventoryItem | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // Search for item by barcode, material code, or material name
    const foundItem = items.find(
      (item) =>
        item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.materialCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.materialName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundItem) {
      setIsGettingLocation(true);

      // Highlight the found item
      onHighlight?.(foundItem.id);

      // Get GPS location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
            const timestamp = new Date().toLocaleString();

            // Update the item with location and timestamp
            onItemFound(foundItem.id, location, timestamp);

            // Update search result
            setSearchResult({
              ...foundItem,
              lastSearchedLocation: location,
              lastSearchedTimestamp: timestamp,
            });

            setIsGettingLocation(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            const timestamp = new Date().toLocaleString();
            const location = 'Location unavailable';

            onItemFound(foundItem.id, location, timestamp);
            setSearchResult({
              ...foundItem,
              lastSearchedLocation: location,
              lastSearchedTimestamp: timestamp,
            });

            setIsGettingLocation(false);
          }
        );
      } else {
        const timestamp = new Date().toLocaleString();
        const location = 'GPS not supported';

        onItemFound(foundItem.id, location, timestamp);
        setSearchResult({
          ...foundItem,
          lastSearchedLocation: location,
          lastSearchedTimestamp: timestamp,
        });

        setIsGettingLocation(false);
      }
    } else {
      setSearchResult(null);
      alert('Item not found');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Inventory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by barcode, code, or name..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isGettingLocation}>
            <Search className="h-4 w-4 mr-2" />
            {isGettingLocation ? 'Locating...' : 'Search'}
          </Button>
        </div>

        {searchResult && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
            <div className="flex items-start gap-4">
              {searchResult.imageUrl ? (
                <ImageWithFallback
                  src={searchResult.imageUrl}
                  alt={searchResult.materialName}
                  className="w-24 h-24 object-cover rounded"
                />
              ) : (
                <div className="w-24 h-24 bg-background rounded flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No image</span>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="font-semibold text-lg">{searchResult.materialName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchResult.materialCode} • {searchResult.barcode}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>{' '}
                    <span className="font-medium">{searchResult.quantity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <span className="font-medium">{searchResult.availability}</span>
                  </div>
                </div>

                {searchResult.reservedForProject && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Reserved For:</span>{' '}
                    <span className="font-medium">{searchResult.reservedForProject}</span>
                  </div>
                )}

                <div className="pt-2 border-t space-y-1">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Clock className="h-4 w-4" />
                    <span>Last Searched: {searchResult.lastSearchedTimestamp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <MapPin className="h-4 w-4" />
                    <span>Location: {searchResult.lastSearchedLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
