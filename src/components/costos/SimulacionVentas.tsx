import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TrendingUp, Calculator, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface Props {
  simulacion: any[];
  simulacionPorUnidad?: any[];
}

export const SimulacionVentas = ({ simulacion, simulacionPorUnidad = [] }: Props) => {
  const [modoPorUnidad, setModoPorUnidad] = useState(false);

  const datosActuales = modoPorUnidad ? simulacionPorUnidad : simulacion;

  // Calcular totales
  const ingresosTotales = datosActuales.reduce((total, item) => total + item.ingresosDiarios, 0);
  const ventasTotales = datosActuales.reduce((total, item) => total + item.ventasPorDia, 0);
  const promedioVentaPorItem = ingresosTotales / ventasTotales || 0;

  // Producto más vendido
  const masVendido = datosActuales.reduce((mejor, actual) => 
    actual.ventasPorDia > mejor.ventasPorDia ? actual : mejor
  , datosActuales[0]);

  // Producto con mayores ingresos
  const mayoresIngresos = datosActuales.reduce((mejor, actual) => 
    actual.ingresosDiarios > mejor.ingresosDiarios ? actual : mejor
  , datosActuales[0]);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Simulación de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="modo-unidad-sim"
              checked={modoPorUnidad}
              onCheckedChange={setModoPorUnidad}
            />
            <Label htmlFor="modo-unidad-sim">Mostrar simulación por unidad</Label>
          </div>
        </CardContent>
      </Card>

      {/* Métricas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingresos Totales/Día</p>
                <p className="text-2xl font-bold">{formatCurrency(ingresosTotales)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ventas Totales/Día</p>
                <p className="text-2xl font-bold">{ventasTotales}</p>
              </div>
              <Calculator className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Promedio por Venta</p>
                <p className="text-2xl font-bold">{formatCurrency(promedioVentaPorItem)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productos Activos</p>
                <p className="text-2xl font-bold">{datosActuales.length}</p>
              </div>
              <Badge variant="secondary" className="text-lg">{modoPorUnidad ? 'Unidad' : 'Peso'}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de simulación */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Simulación {modoPorUnidad ? 'por Unidad' : 'por Peso'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                {!modoPorUnidad && <TableHead>Proveedor</TableHead>}
                <TableHead>Precio Unitario</TableHead>
                <TableHead>Ventas/Día</TableHead>
                <TableHead>Ingresos/Día</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosActuales.map((item, index) => {
                const esMasVendido = masVendido && item.ventasPorDia === masVendido.ventasPorDia;
                const esMayorIngreso = mayoresIngresos && item.ingresosDiarios === mayoresIngresos.ingresosDiarios;

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {modoPorUnidad ? item.medida : item.estribo.medida}
                    </TableCell>
                    {!modoPorUnidad && (
                      <TableCell>{item.proveedor.nombre}</TableCell>
                    )}
                    <TableCell>
                      {formatCurrency(modoPorUnidad ? item.precioConIva : item.precioFinalConIva)}
                    </TableCell>
                    <TableCell>{item.ventasPorDia}</TableCell>
                    <TableCell>{formatCurrency(item.ingresosDiarios)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {esMasVendido && <Badge variant="default" className="text-xs">Más Vendido</Badge>}
                        {esMayorIngreso && <Badge variant="secondary" className="text-xs">Mayor Ingreso</Badge>}
                        {!esMasVendido && !esMayorIngreso && <Badge variant="outline" className="text-xs">Normal</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Proyecciones */}
      <Card>
        <CardHeader>
          <CardTitle>Proyecciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium text-muted-foreground">Ingresos Semanales</h3>
              <p className="text-2xl font-bold text-primary">{formatCurrency(ingresosTotales * 7)}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium text-muted-foreground">Ingresos Mensuales</h3>
              <p className="text-2xl font-bold text-primary">{formatCurrency(ingresosTotales * 30)}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium text-muted-foreground">Ingresos Anuales</h3>
              <p className="text-2xl font-bold text-primary">{formatCurrency(ingresosTotales * 365)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nota */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Esta simulación utiliza datos aleatorios para demostrar el funcionamiento del sistema. 
            En un entorno real, estos datos provendrían de tu historial de ventas o sistemas de análisis predictivo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};