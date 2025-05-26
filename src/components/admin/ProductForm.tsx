
import React, { useState, useEffect } from 'react';
import { Product, ProductSize } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: 'Estribos',
    subcategory: undefined,
    shape: undefined,
    sizes: [{ size: '', price: 0 }]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        subcategory: initialData.subcategory,
        shape: initialData.shape,
        sizes: initialData.sizes
      });
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSizeChange = (index: number, field: 'size' | 'price', value: string | number) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = {
      ...newSizes[index],
      [field]: field === 'price' ? Number(value) : value
    };
    setFormData(prev => ({
      ...prev,
      sizes: newSizes
    }));
  };

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', price: 0 }]
    }));
  };

  const removeSize = (index: number) => {
    if (formData.sizes.length > 1) {
      const newSizes = formData.sizes.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        sizes: newSizes
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre del Producto</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Estribos">Estribos</SelectItem>
              <SelectItem value="Clavos">Clavos</SelectItem>
              <SelectItem value="Alambres">Alambres</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.category === 'Estribos' && (
          <>
            <div>
              <Label htmlFor="subcategory">Subcategoría</Label>
              <Select value={formData.subcategory || ''} onValueChange={(value) => handleInputChange('subcategory', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4.2mm">4.2mm</SelectItem>
                  <SelectItem value="6mm">6mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="shape">Forma</Label>
              <Select value={formData.shape || ''} onValueChange={(value) => handleInputChange('shape', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cuadrado">Cuadrado</SelectItem>
                  <SelectItem value="Rectangular">Rectangular</SelectItem>
                  <SelectItem value="Triangular">Triangular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Medidas y Precios
            <Button type="button" variant="outline" size="sm" onClick={addSize}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Medida
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.sizes.map((size, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor={`size-${index}`}>Medida</Label>
                  <Input
                    id={`size-${index}`}
                    value={size.size}
                    onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                    placeholder="ej: 10x10, 2 pulgadas"
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`price-${index}`}>Precio</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    step="0.01"
                    value={size.price}
                    onChange={(e) => handleSizeChange(index, 'price', e.target.value)}
                    required
                  />
                </div>
                {formData.sizes.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeSize(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          {initialData ? 'Actualizar Producto' : 'Crear Producto'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
