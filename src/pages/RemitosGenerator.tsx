import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProducts } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

interface RemitoItem {
  id: string;
  cantidad: number;
  medida: string;
  producto: string;
  precioUnitario: number;
  precioTotal: number;
}

const RemitosGenerator = () => {
  const { toast } = useToast();
  const [cliente, setCliente] = useState('');
  const [cuit, setCuit] = useState('');
  const [items, setItems] = useState<RemitoItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    cantidad: '',
    medida: '',
    producto: '',
    precioUnitario: 0
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  // Obtener medidas únicas agrupadas por tipo
  const medidasGrouped = React.useMemo(() => {
    const allMedidas = products.map(product => ({
      size: product.size,
      diameter: product.diameter || '',
      shape: product.shape || ''
    }));
    
    // Eliminar duplicados
    const uniqueMedidas = allMedidas.filter((medida, index, self) => 
      index === self.findIndex(m => m.size === medida.size)
    );
    
    // Agrupar por tipo
    const grouped = {
      '4mm': uniqueMedidas.filter(m => m.diameter && (m.diameter.startsWith('4') || m.diameter === '4.2')),
      '6mm': uniqueMedidas.filter(m => m.diameter && m.diameter.startsWith('6')),
      'triangular': uniqueMedidas.filter(m => m.shape?.toLowerCase().includes('triangular')),
      'otros': uniqueMedidas.filter(m => !m.diameter || (!m.diameter.startsWith('4') && !m.diameter.startsWith('6') && !m.shape?.toLowerCase().includes('triangular')))
    };
    
    console.log('Medidas agrupadas:', grouped); // Para debug
    return grouped;
  }, [products]);

  // Actualizar producto cuando cambia la medida
  useEffect(() => {
    if (currentItem.medida) {
      // Buscar el primer producto que coincida con la medida seleccionada
      const selectedProduct = products.find(p => p.size === currentItem.medida);
      if (selectedProduct) {
        setCurrentItem(prev => ({
          ...prev,
          producto: selectedProduct.name,
          precioUnitario: selectedProduct.price
        }));
      }
    }
  }, [currentItem.medida, products]);

  const addItem = () => {
    if (!currentItem.cantidad || !currentItem.medida || !currentItem.producto) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    const newItem: RemitoItem = {
      id: Date.now().toString(),
      cantidad: parseInt(currentItem.cantidad),
      medida: currentItem.medida,
      producto: currentItem.producto,
      precioUnitario: currentItem.precioUnitario,
      precioTotal: parseInt(currentItem.cantidad) * currentItem.precioUnitario
    };

    setItems([...items, newItem]);
    setCurrentItem({
      cantidad: '',
      medida: '',
      producto: '',
      precioUnitario: 0
    });

    toast({
      title: "Éxito",
      description: "Producto agregado al remito"
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalVenta = items.reduce((sum, item) => sum + item.precioTotal, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center">
        <Link to="/admin" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Generador de Remitos</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario de Remito */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Remito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Datos del Cliente */}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="cliente">Nombre del Cliente</Label>
                <Input
                  id="cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Ingrese el nombre del cliente"
                />
              </div>
              <div>
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  placeholder="00-00000000-0"
                />
              </div>
            </div>

            {/* Agregar Productos */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Agregar Producto</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cantidad">Cantidad</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      value={currentItem.cantidad}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, cantidad: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="medida">Medida del Estribo</Label>
                    <Select
                      value={currentItem.medida}
                      onValueChange={(value) => setCurrentItem(prev => ({ ...prev, medida: value }))}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Seleccionar medida" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50 max-h-80 overflow-y-auto">
                        {/* Medidas 4mm */}
                        {medidasGrouped['4mm'].length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                              Ø4.2mm
                            </div>
                            {medidasGrouped['4mm'].map((medida) => (
                              <SelectItem key={`4mm-${medida.size}`} value={medida.size} className="pl-4">
                                {medida.size} (Ø4.2mm)
                              </SelectItem>
                            ))}
                          </>
                        )}
                        
                        {/* Separador */}
                        {medidasGrouped['4mm'].length > 0 && medidasGrouped['6mm'].length > 0 && (
                          <div className="border-t my-1" />
                        )}
                        
                        {/* Medidas 6mm */}
                        {medidasGrouped['6mm'].length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                              Ø6mm
                            </div>
                            {medidasGrouped['6mm'].map((medida) => (
                              <SelectItem key={`6mm-${medida.size}`} value={medida.size} className="pl-4">
                                {medida.size} (Ø6mm)
                              </SelectItem>
                            ))}
                          </>
                        )}
                        
                        {/* Separador */}
                        {(medidasGrouped['4mm'].length > 0 || medidasGrouped['6mm'].length > 0) && medidasGrouped['triangular'].length > 0 && (
                          <div className="border-t my-1" />
                        )}
                        
                        {/* Medidas triangulares */}
                        {medidasGrouped['triangular'].length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                              Triangulares
                            </div>
                            {medidasGrouped['triangular'].map((medida) => (
                              <SelectItem key={`triangular-${medida.size}`} value={medida.size} className="pl-4">
                                {medida.size}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        
                        {/* Separador */}
                        {(medidasGrouped['4mm'].length > 0 || medidasGrouped['6mm'].length > 0 || medidasGrouped['triangular'].length > 0) && medidasGrouped['otros'].length > 0 && (
                          <div className="border-t my-1" />
                        )}
                        
                        {/* Otros productos */}
                        {medidasGrouped['otros'].length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                              Clavos y Otros
                            </div>
                            {medidasGrouped['otros'].map((medida) => (
                              <SelectItem key={`otros-${medida.size}`} value={medida.size} className="pl-4">
                                {medida.size}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Producto (autocompletado)</Label>
                  <Input
                    value={currentItem.producto}
                    disabled
                    placeholder="Se autocompletará al seleccionar medida"
                    className="bg-muted"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Precio Unitario</Label>
                    <Input
                      value={`$${currentItem.precioUnitario.toFixed(2)}`}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Precio Total</Label>
                    <Input
                      value={`$${(parseInt(currentItem.cantidad || '0') * currentItem.precioUnitario).toFixed(2)}`}
                      disabled
                    />
                  </div>
                </div>
                <Button onClick={addItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar al Remito
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Productos y Panel de Administración */}
        <div className="space-y-6">
          {/* Lista de Productos */}
          <Card>
            <CardHeader>
              <CardTitle>Productos en el Remito</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay productos agregados
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.producto}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.cantidad} x {item.medida} - ${item.precioUnitario.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">${item.precioTotal.toFixed(2)}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Panel de Administración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Panel de Administración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="font-medium">Valor Total de la Venta:</span>
                  <span className="font-bold text-lg">${totalVenta.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Gastos de la Venta:</span>
                    <span>$0.00 *</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ganancia:</span>
                    <span>$0.00 *</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA Neto (Crédito - Débito):</span>
                    <span>$0.00 *</span>
                  </div>
                  <p className="text-xs mt-2">
                    * Los cálculos detallados se implementarán con información adicional de la base de datos
                  </p>
                </div>
              </div>
              
              {items.length > 0 && (
                <Button className="w-full mt-4">
                  Generar Remito PDF
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RemitosGenerator;