import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Scale } from 'lucide-react';
import { Estribo, Proveedor } from '@/hooks/useEstribosData';

interface Props {
  estribos: Estribo[];
  proveedores: Proveedor[];
  onAgregarEstribo: (estribo: Omit<Estribo, 'id'>) => void;
  onEliminarEstribo: (id: string) => void;
}

export const FormularioEstribos = ({ estribos, proveedores, onAgregarEstribo, onEliminarEstribo }: Props) => {
  const [medida, setMedida] = useState('');
  const [pesos, setPesos] = useState<{ [proveedorId: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (medida && Object.keys(pesos).length > 0) {
      const pesosPorProveedor: { [proveedorId: string]: number } = {};
      Object.entries(pesos).forEach(([proveedorId, peso]) => {
        if (peso) {
          pesosPorProveedor[proveedorId] = parseFloat(peso);
        }
      });

      if (Object.keys(pesosPorProveedor).length > 0) {
        onAgregarEstribo({
          medida,
          pesosPorProveedor
        });
        setMedida('');
        setPesos({});
      }
    }
  };

  const handlePesoChange = (proveedorId: string, peso: string) => {
    setPesos(prev => ({
      ...prev,
      [proveedorId]: peso
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Gestión de Estribos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulario para agregar estribo */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medida">Medida del Estribo</Label>
            <Input
              id="medida"
              value={medida}
              onChange={(e) => setMedida(e.target.value)}
              placeholder="Ej: 6mm x 10cm x 15cm"
              required
            />
          </div>

          {proveedores.length > 0 && (
            <div className="space-y-3">
              <Label>Peso por Proveedor (kg)</Label>
              <div className="grid gap-3">
                {proveedores.map((proveedor) => (
                  <div key={proveedor.id} className="flex items-center gap-3">
                    <Label className="min-w-0 flex-1 text-sm">{proveedor.nombre}</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={pesos[proveedor.id] || ''}
                      onChange={(e) => handlePesoChange(proveedor.id, e.target.value)}
                      placeholder="0.000"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full md:w-auto" disabled={proveedores.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Estribo
          </Button>

          {proveedores.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Primero debes agregar al menos un proveedor para poder crear estribos.
            </p>
          )}
        </form>

        {/* Lista de estribos existentes */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Estribos Registrados ({estribos.length})</h3>
          {estribos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay estribos registrados. Agrega el primer estribo usando el formulario de arriba.
            </p>
          ) : (
            <div className="grid gap-3">
              {estribos.map((estribo) => (
                <div 
                  key={estribo.id} 
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{estribo.medida}</h4>
                      <div className="mt-2 space-y-1">
                        {Object.entries(estribo.pesosPorProveedor).map(([proveedorId, peso]) => {
                          const proveedor = proveedores.find(p => p.id === proveedorId);
                          return (
                            <div key={proveedorId} className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">{proveedor?.nombre}:</span>
                              <Badge variant="outline">{peso} kg</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEliminarEstribo(estribo.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};