import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TrendingDown, DollarSign, Users } from 'lucide-react';
import { CalculoDetallado } from '@/hooks/useEstribosData';
import { formatCurrency } from '@/utils/formatters';

interface Props {
  calculos: CalculoDetallado[];
  calculosPorUnidad?: any[];
}

export const ComparacionPrecios = ({ calculos, calculosPorUnidad = [] }: Props) => {
  const [modoPorUnidad, setModoPorUnidad] = useState(false);
  const [discriminarIva, setDiscriminarIva] = useState(false);

  const datosActuales = modoPorUnidad ? calculosPorUnidad : calculos;

  // Agrupar por estribo para la comparación
  const datosAgrupados = calculos.reduce((acc, calculo) => {
    const existente = acc.find(item => item.medida === calculo.estribo.medida);
    if (existente) {
      existente.proveedores.push({
        nombre: calculo.proveedor.nombre,
        costoBase: calculo.costoBase,
        precioSinIva: calculo.precioFinalSinIva,
        precioConIva: calculo.precioFinalConIva
      });
    } else {
      acc.push({
        medida: calculo.estribo.medida,
        peso: calculo.estribo.peso,
        proveedores: [{
          nombre: calculo.proveedor.nombre,
          costoBase: calculo.costoBase,
          precioSinIva: calculo.precioFinalSinIva,
          precioConIva: calculo.precioFinalConIva
        }]
      });
    }
    return acc;
  }, [] as any[]);

  // Encontrar el mejor precio para cada estribo
  const mejoresPrecios = datosAgrupados.map(grupo => {
    const proveedorMasBarato = grupo.proveedores.reduce((mejor: any, actual: any) => {
      const precioMejor = discriminarIva ? mejor.precioSinIva : mejor.precioConIva;
      const precioActual = discriminarIva ? actual.precioSinIva : actual.precioConIva;
      return precioActual < precioMejor ? actual : mejor;
    });

    const proveedorMasCaro = grupo.proveedores.reduce((caro: any, actual: any) => {
      const precioCaro = discriminarIva ? caro.precioSinIva : caro.precioConIva;
      const precioActual = discriminarIva ? actual.precioSinIva : actual.precioConIva;
      return precioActual > precioCaro ? actual : caro;
    });

    const precioMasBarato = discriminarIva ? proveedorMasBarato.precioSinIva : proveedorMasBarato.precioConIva;
    const precioMasCaro = discriminarIva ? proveedorMasCaro.precioConIva : proveedorMasCaro.precioConIva;
    const ahorroAbsoluto = precioMasCaro - precioMasBarato;
    const ahorroRelativo = ((ahorroAbsoluto / precioMasCaro) * 100);

    return {
      ...grupo,
      proveedorMasBarato,
      proveedorMasCaro,
      ahorroAbsoluto,
      ahorroRelativo
    };
  });

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary" />
            Comparación de Precios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="modo-unidad"
                checked={modoPorUnidad}
                onCheckedChange={setModoPorUnidad}
              />
              <Label htmlFor="modo-unidad">Mostrar precios por unidad</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="discriminar-iva"
                checked={discriminarIva}
                onCheckedChange={setDiscriminarIva}
              />
              <Label htmlFor="discriminar-iva">Discriminar IVA</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de comparación por peso */}
      {!modoPorUnidad && (
        <Card>
          <CardHeader>
            <CardTitle>Comparación por Peso y Proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estribo</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>Costo Base</TableHead>
                  <TableHead>Precio {discriminarIva ? 'Sin' : 'Con'} IVA</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculos.map((calculo, index) => {
                  const precio = discriminarIva ? calculo.precioFinalSinIva : calculo.precioFinalConIva;
                  const grupo = mejoresPrecios.find(g => g.medida === calculo.estribo.medida);
                  const esMasBarato = grupo?.proveedorMasBarato.nombre === calculo.proveedor.nombre;
                  const esMasCaro = grupo?.proveedorMasCaro.nombre === calculo.proveedor.nombre;

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{calculo.estribo.medida}</TableCell>
                      <TableCell>{calculo.proveedor.nombre}</TableCell>
                      <TableCell>{calculo.estribo.peso}</TableCell>
                      <TableCell>{formatCurrency(calculo.costoBase)}</TableCell>
                      <TableCell>{formatCurrency(precio)}</TableCell>
                      <TableCell>
                        {esMasBarato && <Badge variant="default">Más Barato</Badge>}
                        {esMasCaro && <Badge variant="destructive">Más Caro</Badge>}
                        {!esMasBarato && !esMasCaro && <Badge variant="secondary">Intermedio</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tabla de precios por unidad */}
      {modoPorUnidad && (
        <Card>
          <CardHeader>
            <CardTitle>Precios por Unidad</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estribo</TableHead>
                  <TableHead>Precio Unitario</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead>Precio {discriminarIva ? 'Sin' : 'Con'} IVA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculosPorUnidad.map((calculo, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{calculo.medida}</TableCell>
                    <TableCell>{formatCurrency(calculo.precioSinIva)}</TableCell>
                    <TableCell>{formatCurrency(calculo.ivaAmount)}</TableCell>
                    <TableCell>{formatCurrency(discriminarIva ? calculo.precioSinIva : calculo.precioConIva)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Resumen de ahorros */}
      {!modoPorUnidad && mejoresPrecios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Resumen de Ahorros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mejoresPrecios.map((mejorPrecio, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{mejorPrecio.medida}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Más barato:</span>
                      <br />
                      <Badge variant="default">{mejorPrecio.proveedorMasBarato.nombre}</Badge>
                      <br />
                      <span className="font-mono">{formatCurrency(discriminarIva ? mejorPrecio.proveedorMasBarato.precioSinIva : mejorPrecio.proveedorMasBarato.precioConIva)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Más caro:</span>
                      <br />
                      <Badge variant="destructive">{mejorPrecio.proveedorMasCaro.nombre}</Badge>
                      <br />
                      <span className="font-mono">{formatCurrency(discriminarIva ? mejorPrecio.proveedorMasCaro.precioSinIva : mejorPrecio.proveedorMasCaro.precioConIva)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ahorro:</span>
                      <br />
                      <Badge variant="secondary">{mejorPrecio.ahorroRelativo.toFixed(1)}%</Badge>
                      <br />
                      <span className="font-mono">{formatCurrency(mejorPrecio.ahorroAbsoluto)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};