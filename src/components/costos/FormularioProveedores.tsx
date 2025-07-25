import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { Proveedor } from '@/hooks/useEstribosData';
import { formatCurrency } from '@/utils/formatters';

interface Props {
  proveedores: Proveedor[];
  onAgregarProveedor: (proveedor: Omit<Proveedor, 'id'>) => void;
  onEliminarProveedor: (id: string) => void;
}

export const FormularioProveedores = ({ proveedores, onAgregarProveedor, onEliminarProveedor }: Props) => {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre && precio) {
      onAgregarProveedor({
        nombre,
        precioPorKg: parseFloat(precio)
      });
      setNombre('');
      setPrecio('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Gestión de Proveedores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulario para agregar proveedor */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Proveedor</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Proveedor ABC"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio por Kg ($)</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: 1500.00"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Proveedor
          </Button>
        </form>

        {/* Lista de proveedores existentes */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Proveedores Registrados ({proveedores.length})</h3>
          {proveedores.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay proveedores registrados. Agrega el primer proveedor usando el formulario de arriba.
            </p>
          ) : (
            <div className="grid gap-3">
              {proveedores.map((proveedor) => (
                <div 
                  key={proveedor.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{proveedor.nombre}</h4>
                    <p className="text-sm text-muted-foreground">
                      Precio por kg: <Badge variant="secondary">{formatCurrency(proveedor.precioPorKg)}</Badge>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEliminarProveedor(proveedor.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};