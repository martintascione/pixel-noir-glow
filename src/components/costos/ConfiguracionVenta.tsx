import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save } from 'lucide-react';
import { ConfiguracionVenta as ConfiguracionVentaType } from '@/hooks/useEstribosData';

interface Props {
  configuracion: ConfiguracionVentaType;
  onActualizar: (configuracion: ConfiguracionVentaType) => void;
}

export const ConfiguracionVenta = ({ configuracion, onActualizar }: Props) => {
  const [margenGanancia, setMargenGanancia] = useState(configuracion.margenGanancia.toString());
  const [iva, setIva] = useState(configuracion.iva.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onActualizar({
      margenGanancia: parseFloat(margenGanancia),
      iva: parseFloat(iva)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Configuración de Venta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="margen">Margen de Ganancia (%)</Label>
              <Input
                id="margen"
                type="number"
                step="0.1"
                value={margenGanancia}
                onChange={(e) => setMargenGanancia(e.target.value)}
                placeholder="90"
                required
              />
              <p className="text-sm text-muted-foreground">
                Porcentaje de ganancia sobre el costo base
              </p>
              <p className="text-sm text-primary font-medium mt-2">
                Su margen actual entre el valor de venta y el costo, es de {margenGanancia}% de ganancia
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="iva">IVA (%)</Label>
              <Input
                id="iva"
                type="number"
                step="0.1"
                value={iva}
                onChange={(e) => setIva(e.target.value)}
                placeholder="21"
                required
              />
              <p className="text-sm text-muted-foreground">
                Porcentaje de IVA aplicado al precio final
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Vista Previa del Cálculo</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Ejemplo con costo base de $100:</span>
              </div>
              <div className="text-sm">
                Costo base: <span className="font-mono">$100.00</span>
              </div>
              <div className="text-sm">
                Con margen ({margenGanancia}%): <span className="font-mono">${(100 * (1 + parseFloat(margenGanancia || '0') / 100)).toFixed(2)}</span>
              </div>
              <div className="text-sm">
                IVA ({iva}%): <span className="font-mono">${(100 * (1 + parseFloat(margenGanancia || '0') / 100) * parseFloat(iva || '0') / 100).toFixed(2)}</span>
              </div>
              <div className="text-sm font-medium border-t pt-2">
                Precio final: <span className="font-mono">${(100 * (1 + parseFloat(margenGanancia || '0') / 100) * (1 + parseFloat(iva || '0') / 100)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <Save className="w-4 h-4 mr-2" />
            Guardar Configuración
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};