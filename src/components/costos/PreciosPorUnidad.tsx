import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Save } from 'lucide-react';
import { PrecioPorUnidad, Estribo } from '@/hooks/useEstribosData';
import { formatCurrency } from '@/utils/formatters';

interface Props {
  preciosPorUnidad: PrecioPorUnidad[];
  estribos: Estribo[];
  onActualizar: (estriboPrecioId: string, precio: number) => void;
}

export const PreciosPorUnidad = ({ preciosPorUnidad, estribos, onActualizar }: Props) => {
  const [precios, setPrecios] = useState<{ [key: string]: string }>({});

  const handlePrecioChange = (estriboPrecioId: string, precio: string) => {
    setPrecios(prev => ({
      ...prev,
      [estriboPrecioId]: precio
    }));
  };

  const handleGuardar = (estriboPrecioId: string) => {
    const precio = precios[estriboPrecioId];
    if (precio) {
      onActualizar(estriboPrecioId, parseFloat(precio));
      setPrecios(prev => ({
        ...prev,
        [estriboPrecioId]: ''
      }));
    }
  };

  const getPrecioActual = (estriboPrecioId: string) => {
    const precio = preciosPorUnidad.find(p => p.estriboPrecioId === estriboPrecioId);
    return precio?.precioUnitario || 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Precios por Unidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {estribos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay estribos registrados. Primero agrega estribos para poder definir precios por unidad.
          </p>
        ) : (
          <div className="space-y-4">
            {estribos.map((estribo) => {
              const precioActual = getPrecioActual(estribo.id);
              const precioInput = precios[estribo.id] || '';

              return (
                <div key={estribo.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{estribo.medida}</h4>
                      <p className="text-sm text-muted-foreground">
                        Precio actual: <Badge variant="secondary">{formatCurrency(precioActual)}</Badge>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`precio-${estribo.id}`}>Nuevo precio por unidad ($)</Label>
                      <Input
                        id={`precio-${estribo.id}`}
                        type="number"
                        step="0.01"
                        value={precioInput}
                        onChange={(e) => handlePrecioChange(estribo.id, e.target.value)}
                        placeholder={`Precio actual: ${precioActual}`}
                      />
                    </div>
                    <Button
                      onClick={() => handleGuardar(estribo.id)}
                      disabled={!precioInput}
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-2">Información</h3>
          <p className="text-sm text-muted-foreground">
            Los precios por unidad son independientes del cálculo por peso y proveedor. 
            Estos precios se utilizan cuando vendes estribos individualmente en lugar de por peso.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};