import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Upload } from 'lucide-react';

interface InventoryFormProps {
  onAdd: (item: {
    materialName: string;
    size?: string;
    texture?: string;
    quantity: number;
    availability: string;
    imageUrl?: string;
    reservedForProject?: string;
  }) => void;
}

export function InventoryForm({ onAdd }: InventoryFormProps) {
  const [materialName, setMaterialName] = useState('');
  const [size, setSize] = useState('');
  const [texture, setTexture] = useState('');
  const [quantity, setQuantity] = useState('');
  const [availability, setAvailability] = useState('In Stock');
  const [imageUrl, setImageUrl] = useState('');
  const [reservedForProject, setReservedForProject] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!materialName || !quantity) {
      return;
    }

    onAdd({
      materialName,
      size: size || undefined,
      texture: texture || undefined,
      quantity: parseInt(quantity),
      availability,
      imageUrl: imageUrl || undefined,
      reservedForProject: reservedForProject || undefined,
    });

    // Reset form
    setMaterialName('');
    setSize('');
    setTexture('');
    setQuantity('');
    setAvailability('In Stock');
    setImageUrl('');
    setReservedForProject('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Item Manually</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-name">Material Name</Label>
            <Input
              id="material-name"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="e.g., Steel Plate 10mm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size (Optional)</Label>
              <Input
                id="size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g., 10mm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="texture">Texture (Optional)</Label>
              <Input
                id="texture"
                value={texture}
                onChange={(e) => setTexture(e.target.value)}
                placeholder="e.g., Smooth"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger id="availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In Stock">In Stock</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                <SelectItem value="On Order">On Order</SelectItem>
                <SelectItem value="Reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reserved-project">Reserved For Project (Optional)</Label>
            <Input
              id="reserved-project"
              value={reservedForProject}
              onChange={(e) => setReservedForProject(e.target.value)}
              placeholder="e.g., Building A Construction"
            />
          </div>

          <div className="space-y-2">
            <Label>Item Image (Optional)</Label>
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="mt-2">
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                {imageUrl && imageUrl.startsWith('data:') && (
                  <p className="text-xs text-green-600 mt-1">✓ Image uploaded</p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
