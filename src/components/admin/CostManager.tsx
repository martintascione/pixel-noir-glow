import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign, Percent, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  category?: {
    name: string;
  };
}

interface ProductCost {
  id?: string;
  product_id: string;
  production_cost: number;
  profit_margin: number;
}

interface Props {
  products: Product[];
}

export const CostManager = ({ products }: Props) => {
  const [costs, setCosts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCosts, setSavingCosts] = useState<Set<string>>(new Set());
  const [ivaRate, setIvaRate] = useState(21);
  const [categoryMargins, setCategoryMargins] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_costs')
        .select('*');

      if (error) throw error;

      setCosts(data || []);
    } catch (error) {
      console.error('Error fetching costs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los costos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCostForProduct = (productId: string, categoryName: string): ProductCost => {
    const existingCost = costs.find(c => c.product_id === productId);
    const categoryMargin = categoryMargins[categoryName] || 0;
    
    return existingCost || {
      product_id: productId,
      production_cost: 0,
      profit_margin: categoryMargin
    };
  };

  const updateCost = (productId: string, field: keyof ProductCost, value: number) => {
    setCosts(prev => {
      const existingIndex = prev.findIndex(c => c.product_id === productId);
      const existingCost = existingIndex >= 0 ? prev[existingIndex] : { product_id: productId, production_cost: 0, profit_margin: 0 };
      
      const updatedCost = { ...existingCost, [field]: value };
      
      if (existingIndex >= 0) {
        const newCosts = [...prev];
        newCosts[existingIndex] = updatedCost;
        return newCosts;
      } else {
        return [...prev, updatedCost];
      }
    });
  };

  const saveCost = async (productId: string, categoryName: string) => {
    setSavingCosts(prev => new Set(prev).add(productId));
    
    try {
      const cost = getCostForProduct(productId, categoryName);
      
      const { error } = await supabase
        .from('product_costs')
        .upsert({
          product_id: productId,
          production_cost: cost.production_cost,
          profit_margin: cost.profit_margin
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Costo guardado correctamente",
      });

      await fetchCosts(); // Refresh data
    } catch (error) {
      console.error('Error saving cost:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el costo",
        variant: "destructive",
      });
    } finally {
      setSavingCosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Función para calcular IVA crédito (discriminar IVA de un precio que ya lo incluye)
  const calculateIVACredit = (costWithIVA: number): { netCost: number; ivaAmount: number } => {
    const netCost = costWithIVA / (1 + ivaRate / 100);
    const ivaAmount = costWithIVA - netCost;
    return { netCost, ivaAmount };
  };

  // Función para calcular precio de venta
  const calculateSalePrice = (cost: ProductCost): { netCost: number; ivaCredit: number; costWithMargin: number; finalPrice: number } => {
    const { netCost, ivaAmount: ivaCredit } = calculateIVACredit(cost.production_cost);
    const costWithMargin = netCost * (1 + cost.profit_margin / 100);
    const finalPrice = costWithMargin * (1 + ivaRate / 100); // Agregar IVA al precio final
    
    return {
      netCost,
      ivaCredit,
      costWithMargin,
      finalPrice
    };
  };

  // Agrupar productos por categoría
  const groupedProducts = products.reduce((acc, product) => {
    const categoryName = product.category?.name || 'Sin categoría';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Ordenar categorías: Estribos primero, luego el resto alfabéticamente
  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    if (a.toLowerCase().includes('estribo')) return -1;
    if (b.toLowerCase().includes('estribo')) return 1;
    return a.localeCompare(b);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Gestión de Costos de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Ingresa los costos de producción (con IVA incluido) y el margen de ganancia para cada producto.
            El sistema calculará automáticamente el IVA crédito y el precio de venta sugerido.
          </p>

          {/* Input de IVA general */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="iva-rate" className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                IVA General (%)
              </Label>
              <Input
                id="iva-rate"
                type="number"
                step="0.1"
                value={ivaRate}
                onChange={(e) => setIvaRate(parseFloat(e.target.value) || 21)}
                placeholder="21.0"
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">
                Este porcentaje se aplicará a todos los productos para el cálculo del IVA.
              </p>
            </div>
          </div>
          
          <div className="space-y-8">
            {sortedCategories.map((categoryName) => (
              <div key={categoryName} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-primary">{categoryName}</h2>
                  <Badge variant="secondary">{groupedProducts[categoryName].length} productos</Badge>
                </div>
                
                {/* Input de margen por categoría */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor={`margin-${categoryName}`} className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Margen de Ganancia para {categoryName} (%)
                    </Label>
                    <Input
                      id={`margin-${categoryName}`}
                      type="number"
                      step="0.1"
                      value={categoryMargins[categoryName] || 0}
                      onChange={(e) => {
                        const newMargin = parseFloat(e.target.value) || 0;
                        setCategoryMargins(prev => ({ ...prev, [categoryName]: newMargin }));
                        
                        // Actualizar todos los productos de esta categoría
                        groupedProducts[categoryName].forEach(product => {
                          updateCost(product.id, 'profit_margin', newMargin);
                        });
                      }}
                      placeholder="0.0"
                      className="w-32"
                    />
                    <p className="text-sm text-muted-foreground">
                      Este margen se aplicará a todos los productos de la categoría {categoryName}.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  {groupedProducts[categoryName].map((product) => {
                    const cost = getCostForProduct(product.id, categoryName);
                    const calculations = calculateSalePrice(cost);
                    const isSaving = savingCosts.has(product.id);

                    return (
                      <Card key={product.id} className="border-l-4 border-l-primary/20">
                        <CardContent className="p-6">
                          <div className="grid gap-6">
                            {/* Información del producto */}
                            <div>
                              <h3 className="font-semibold text-lg">{product.name}</h3>
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>Tamaño: {product.size}</span>
                                <span>Categoría: {product.category?.name || 'Sin categoría'}</span>
                                <span>Precio actual: {formatCurrency(product.price)}</span>
                              </div>
                            </div>

                            <Separator />

                            {/* Inputs de costos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`cost-${product.id}`} className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  Costo de Producción (con IVA)
                                </Label>
                                <Input
                                  id={`cost-${product.id}`}
                                  type="number"
                                  step="0.01"
                                  value={cost.production_cost}
                                  onChange={(e) => updateCost(product.id, 'production_cost', parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                />
                              </div>

                              <div className="flex items-end">
                                <Button
                                  onClick={() => saveCost(product.id, categoryName)}
                                  disabled={isSaving}
                                  className="w-full"
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  {isSaving ? 'Guardando...' : 'Guardar'}
                                </Button>
                              </div>
                            </div>

                            {/* Cálculos automáticos */}
                            {cost.production_cost > 0 && (
                              <>
                                <Separator />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Costo Neto</p>
                                    <p className="text-lg font-bold">{formatCurrency(calculations.netCost)}</p>
                                  </div>
                                  
                                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm font-medium text-blue-600">IVA Crédito</p>
                                    <p className="text-lg font-bold text-blue-700">{formatCurrency(calculations.ivaCredit)}</p>
                                  </div>
                                  
                                  <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <p className="text-sm font-medium text-green-600">Con Margen</p>
                                    <p className="text-lg font-bold text-green-700">{formatCurrency(calculations.costWithMargin)}</p>
                                  </div>
                                  
                                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                                    <p className="text-sm font-medium text-primary">Precio Sugerido</p>
                                    <p className="text-lg font-bold text-primary">{formatCurrency(calculations.finalPrice)}</p>
                                  </div>
                                </div>

                                {/* Comparación con precio actual */}
                                {product.price !== calculations.finalPrice && (
                                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                                        Diferencia con precio actual
                                      </Badge>
                                      <span className="text-sm text-yellow-700">
                                        {calculations.finalPrice > product.price ? '+' : ''}{formatCurrency(calculations.finalPrice - product.price)}
                                      </span>
                                    </div>
                                    {calculations.finalPrice > product.price && (
                                      <span className="text-sm text-green-600 font-medium">
                                        Precio sugerido mayor
                                      </span>
                                    )}
                                    {calculations.finalPrice < product.price && (
                                      <span className="text-sm text-red-600 font-medium">
                                        Precio sugerido menor
                                      </span>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};