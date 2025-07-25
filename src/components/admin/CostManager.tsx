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
  diameter?: string;
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

  const fetchConfig = async () => {
    try {
      // Cargar configuración de IVA
      const { data: generalConfig, error: generalError } = await supabase
        .from('general_config')
        .select('iva_rate')
        .limit(1)
        .single();

      if (generalError && generalError.code !== 'PGRST116') throw generalError;

      if (generalConfig) {
        setIvaRate(generalConfig.iva_rate);
      }

      // Cargar márgenes por categoría
      const { data: marginsData, error: marginsError } = await supabase
        .from('category_margins')
        .select('*');

      if (marginsError) throw marginsError;

      const margins: Record<string, number> = {};
      marginsData?.forEach(margin => {
        margins[margin.category_name] = margin.profit_margin;
      });
      setCategoryMargins(margins);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  useEffect(() => {
    fetchCosts();
    fetchConfig();
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
        }, {
          onConflict: 'product_id'
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

  // Función para calcular IVA contenido en el costo (discriminar IVA de un precio que ya lo incluye)
  const calculateContainedIVA = (costWithIVA: number): number => {
    // Fórmula: IVA = Precio con IVA × (tasa_iva / (1 + tasa_iva))
    return costWithIVA * (ivaRate / 100) / (1 + ivaRate / 100);
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

  // Función para extraer el número de la medida para ordenamiento
  const extractMeasureNumber = (size: string) => {
    const match = size.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Función para detectar medidas triangulares (3 dimensiones, ej: 10x10x10)
  const isTriangularMeasure = (size: string) => {
    const dimensionCount = (size.match(/x/gi) || []).length;
    return dimensionCount >= 2; // 3 dimensiones = 2 "x"
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

  // Ordenar productos dentro de cada categoría por diámetro y medida
  Object.keys(groupedProducts).forEach(categoryName => {
    groupedProducts[categoryName].sort((a, b) => {
      // Detectar si son medidas triangulares (3 dimensiones, ej: 10x10x10)
      const isTriangularA = isTriangularMeasure(a.size);
      const isTriangularB = isTriangularMeasure(b.size);
      
      // Las triangulares van al final
      if (isTriangularA && !isTriangularB) return 1;
      if (!isTriangularA && isTriangularB) return -1;
      
      // Primero ordenar por diámetro (4.2 primero, luego 6, luego otros)
      const diameterA = a.diameter || '999'; // Sin diámetro al final
      const diameterB = b.diameter || '999';
      
      if (diameterA === '4.2' && diameterB !== '4.2') return -1;
      if (diameterB === '4.2' && diameterA !== '4.2') return 1;
      if (diameterA === '6' && diameterB !== '6' && diameterB !== '4.2') return -1;
      if (diameterB === '6' && diameterA !== '6' && diameterA !== '4.2') return 1;
      
      // Si tienen el mismo diámetro, ordenar por medida
      if (diameterA === diameterB) {
        const sizeA = extractMeasureNumber(a.size);
        const sizeB = extractMeasureNumber(b.size);
        return sizeA - sizeB;
      }
      
      return diameterA.localeCompare(diameterB);
    });
  });

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
            <div className="space-y-4">
              <div className="space-y-3">
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
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('general_config')
                        .upsert({ iva_rate: ivaRate }, {
                          onConflict: 'id'
                        });
                      
                      if (error) throw error;
                      
                      toast({
                        title: "Éxito",
                        description: "IVA actualizado correctamente",
                      });
                    } catch (error) {
                      console.error('Error saving IVA rate:', error);
                      toast({
                        title: "Error",
                        description: "No se pudo guardar el IVA",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-fit"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar IVA
                </Button>
              </div>
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
                  <div className="space-y-4">
                    <div className="space-y-3">
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
                          disabled={categoryName.toLowerCase().includes('estribo')}
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('category_margins')
                              .upsert({
                                category_name: categoryName,
                                profit_margin: categoryMargins[categoryName] || 0
                              }, {
                                onConflict: 'category_name'
                              });
                            
                            if (error) throw error;
                            
                            toast({
                              title: "Éxito",
                              description: `Margen para ${categoryName} actualizado correctamente`,
                            });
                          } catch (error) {
                            console.error('Error saving category margin:', error);
                            toast({
                              title: "Error",
                              description: "No se pudo guardar el margen",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="w-fit"
                        disabled={categoryName.toLowerCase().includes('estribo')}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Margen
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {categoryName.toLowerCase().includes('estribo') 
                        ? "Función disponible para próximas actualizaciones..."
                        : `Este margen se aplicará a todos los productos de la categoría ${categoryName}.`
                      }
                    </p>
                    {categoryName.toLowerCase().includes('estribo') && (() => {
                      // Calcular margen real promedio para estribos
                      const estribosData = groupedProducts[categoryName];
                      let totalMarginReal = 0;
                      let productosConDatos = 0;
                      
                      estribosData.forEach(product => {
                        const cost = getCostForProduct(product.id, categoryName);
                        if (cost.production_cost > 0 && product.price > 0) {
                          const margenReal = ((product.price - cost.production_cost) / cost.production_cost) * 100;
                          totalMarginReal += margenReal;
                          productosConDatos++;
                        }
                      });
                      
                      const margenPromedio = productosConDatos > 0 ? totalMarginReal / productosConDatos : 0;
                      
                      return (
                        <p className="text-sm text-primary font-medium mt-2">
                          Su margen actual entre el valor de venta y el costo, es de {margenPromedio.toFixed(1)}% de ganancia
                          <span className="text-xs text-muted-foreground ml-2">
                            (Promedio de {productosConDatos} productos con datos)
                          </span>
                        </p>
                      );
                    })()}
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
                            {/* Header con información del producto y botón guardar */}
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <h3 className="font-semibold text-lg">
                                  {product.name}
                                  {product.diameter && (
                                    <span className="text-blue-600 font-medium ml-2">
                                      Ø{product.diameter}
                                    </span>
                                  )}
                                </h3>
                                <div className="text-sm text-muted-foreground">
                                  Tamaño: {product.size}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Precio actual: {formatCurrency(product.price)}
                                </div>
                              </div>
                              
                              <Button
                                onClick={() => saveCost(product.id, categoryName)}
                                disabled={isSaving}
                                size="sm"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Guardando...' : 'Guardar'}
                              </Button>
                            </div>

                            <Separator />

                            {/* Inputs de costos */}
                            <div className="space-y-4">
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

                              {/* Mostrar IVA contenido de forma compacta */}
                              {cost.production_cost > 0 && (
                                <div className="flex items-center gap-2 text-sm text-orange-600">
                                  <span>IVA contenido:</span>
                                  <span className="font-medium">{formatCurrency(calculateContainedIVA(cost.production_cost))}</span>
                                </div>
                              )}
                            </div>
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