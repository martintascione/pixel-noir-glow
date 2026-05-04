import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign, Percent, Save, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';

const ACTIVE_BATCH_KEY = 'active_cost_batch_id';

const dedupeProductCostUpdates = <T extends { product_id: string }>(updates: T[]): T[] =>
  Array.from(new Map(updates.map(update => [update.product_id, update])).values());

interface CostBatch {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
}

interface CostCalculation {
  id: string;
  batch_id: string;
  medida_nombre: string;
  costo_por_unidad: number;
}

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
  const [batches, setBatches] = useState<CostBatch[]>([]);
  const [batchCalcs, setBatchCalcs] = useState<Record<string, CostCalculation[]>>({});
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [switchingBatch, setSwitchingBatch] = useState(false);

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

  const fetchBatches = async () => {
    try {
      const { data: batchesData, error: bErr } = await supabase
        .from('cost_batches' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (bErr) throw bErr;
      const list = (batchesData || []) as unknown as CostBatch[];
      setBatches(list);

      if (list.length > 0) {
        const ids = list.map(b => b.id);
        const { data: calcsData, error: cErr } = await supabase
          .from('cost_calculations' as any)
          .select('*')
          .in('batch_id', ids);
        if (cErr) throw cErr;
        const grouped: Record<string, CostCalculation[]> = {};
        ((calcsData || []) as unknown as CostCalculation[]).forEach(c => {
          if (!grouped[c.batch_id]) grouped[c.batch_id] = [];
          grouped[c.batch_id].push(c);
        });
        setBatchCalcs(grouped);
      }

      const stored = localStorage.getItem(ACTIVE_BATCH_KEY);
      if (stored && list.find(b => b.id === stored)) {
        setActiveBatchId(stored);
      } else if (list.length > 0) {
        setActiveBatchId(list[0].id);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  useEffect(() => {
    fetchCosts();
    fetchConfig();
    fetchBatches();
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

  // Resolver product_id desde el nombre de medida de un cálculo (tolerante)
  const normalize = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*-\s*/g, ' - ')
      .trim();

  const resolveProductId = (medidaNombre: string, categoryProducts: Product[]): string | null => {
    const target = normalize(medidaNombre);
    const matched = categoryProducts.find(p => {
      const diamStr = p.diameter ? String(p.diameter).replace(/mm/i, '').trim() : '';
      const candidates = [
        `${p.name} - ${p.size}${diamStr ? ` - Ø${diamStr}mm` : ''}`,
        `${p.name} - ${p.size}`,
      ].map(normalize);
      return candidates.includes(target);
    });
    return matched?.id ?? null;
  };

  // Calcular el margen promedio para una tanda dada vs los precios públicos actuales
  const calcularMargenTanda = (batchId: string, categoryProducts: Product[]): { margen: number; cantidad: number } => {
    const calcs = batchCalcs[batchId] || [];
    let total = 0;
    let count = 0;
    calcs.forEach(calc => {
      const productId = resolveProductId(calc.medida_nombre, categoryProducts);
      if (!productId) return;
      const product = categoryProducts.find(p => p.id === productId);
      if (!product || product.price <= 0 || calc.costo_por_unidad <= 0) return;
      const margen = ((product.price - calc.costo_por_unidad) / calc.costo_por_unidad) * 100;
      total += margen;
      count++;
    });
    return { margen: count > 0 ? total / count : 0, cantidad: count };
  };

  // Cambiar tanda activa: sincroniza los costos a product_costs
  const cambiarTandaActiva = async (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;
    setSwitchingBatch(true);
    try {
      const calcs = batchCalcs[batchId] || [];
      const mapped = calcs.map(calc => {
        const pid = resolveProductId(calc.medida_nombre, products);
        return { calc, pid };
      });
      const unmatched = mapped.filter(m => !m.pid).map(m => m.calc.medida_nombre);
      if (unmatched.length > 0) {
        console.warn('[cambiarTandaActiva] Medidas sin match con productos:', unmatched);
      }
      const updates = dedupeProductCostUpdates(
        mapped
          .filter(m => m.pid)
          .map(m => ({ product_id: m.pid as string, production_cost: m.calc.costo_por_unidad }))
      );

      if (updates.length > 0) {
        const productIds = updates.map(u => u.product_id);
        const { data: existing } = await supabase
          .from('product_costs')
          .select('product_id, profit_margin')
          .in('product_id', productIds);
        const marginMap = new Map((existing || []).map((e: any) => [e.product_id, e.profit_margin]));
        const finalUpdates = updates.map(u => ({
          ...u,
          profit_margin: marginMap.get(u.product_id) ?? 0,
        }));
        const { error: upErr } = await supabase
          .from('product_costs')
          .upsert(finalUpdates, { onConflict: 'product_id' });
        if (upErr) throw upErr;
      }

      localStorage.setItem(ACTIVE_BATCH_KEY, batchId);
      setActiveBatchId(batchId);
      await fetchCosts();
      toast({
        title: 'Lista activada',
        description: `Tanda "${batch.nombre}" · ${updates.length} costo(s) sincronizado(s)`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la tanda activa: ' + err.message,
        variant: 'destructive',
      });
    } finally {
      setSwitchingBatch(false);
    }
  };

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
                        />

                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            const margin = categoryMargins[categoryName] || 0;
                            const { error } = await supabase
                              .from('category_margins')
                              .upsert({
                                category_name: categoryName,
                                profit_margin: margin
                              }, {
                                onConflict: 'category_name'
                              });
                            
                            if (error) throw error;

                            // Aplicar el margen a todos los productos de la categoría:
                            // 1) Persistir profit_margin en product_costs (upsert por producto)
                            // 2) Actualizar el precio público (products.price) con el precio final calculado
                            const productosCategoria = groupedProducts[categoryName];
                            const costUpserts = dedupeProductCostUpdates(productosCategoria.map(p => {
                              const c = costs.find(x => x.product_id === p.id);
                              return {
                                product_id: p.id,
                                production_cost: c?.production_cost ?? 0,
                                profit_margin: margin,
                              };
                            }));

                            if (costUpserts.length > 0) {
                              const { error: upErr } = await supabase
                                .from('product_costs')
                                .upsert(costUpserts, { onConflict: 'product_id' });
                              if (upErr) throw upErr;
                            }

                            // Actualizar precio público de cada producto con costo > 0
                            await Promise.all(productosCategoria.map(async (p) => {
                              const c = costs.find(x => x.product_id === p.id);
                              const productionCost = c?.production_cost ?? 0;
                              if (productionCost <= 0) return;
                              const { finalPrice } = calculateSalePrice({
                                product_id: p.id,
                                production_cost: productionCost,
                                profit_margin: margin,
                              });
                              await supabase
                                .from('products')
                                .update({ price: Math.round(finalPrice * 100) / 100 })
                                .eq('id', p.id);
                            }));

                            await fetchCosts();

                            toast({
                              title: "Éxito",
                              description: `Margen para ${categoryName} aplicado y precios actualizados`,
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
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Margen y Aplicar Precios
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Este margen se aplicará al costo de cada producto de la categoría {categoryName} para calcular el precio de venta público.
                    </p>
                    {categoryName.toLowerCase().includes('estribo') && (() => {
                      const estribosData = groupedProducts[categoryName];

                      // Margen actual real (con costos guardados en product_costs)
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
                        <div className="mt-3 space-y-3">
                          <p className="text-sm text-primary font-medium">
                            Su margen actual entre el valor de venta y el costo, es de {margenPromedio.toFixed(1)}% de ganancia
                            <span className="text-xs text-muted-foreground ml-2">
                              (Promedio de {productosConDatos} productos con datos)
                            </span>
                          </p>

                          {batches.length > 0 && (
                            <div className="rounded-md border border-primary/20 bg-background p-3 space-y-3">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Lista de precios del proveedor (tanda activa)
                                </Label>
                                <Select
                                  value={activeBatchId ?? undefined}
                                  onValueChange={(val) => cambiarTandaActiva(val)}
                                  disabled={switchingBatch}
                                >
                                  <SelectTrigger className="w-full md:w-[420px]">
                                    <SelectValue placeholder="Seleccionar tanda / proveedor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {batches.map(b => (
                                      <SelectItem key={b.id} value={b.id}>
                                        {b.nombre}{b.id === activeBatchId ? ' · activa' : ''}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Al cambiar la tanda activa se sincronizan los costos de producción de los estribos con esa lista del proveedor.
                                </p>
                              </div>

                              <Separator />

                              <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Margen estimado por lista de precios
                                </p>
                                {batches.map(b => {
                                  const { margen, cantidad } = calcularMargenTanda(b.id, estribosData);
                                  const isActive = b.id === activeBatchId;
                                  return (
                                    <div
                                      key={b.id}
                                      className={`flex items-center justify-between gap-3 text-sm p-2 rounded ${isActive ? 'bg-primary/10' : ''}`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {isActive && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                                        <span className="truncate">{b.nombre}</span>
                                      </div>
                                      <div className="text-right shrink-0">
                                        {cantidad > 0 ? (
                                          <>
                                            <span className="font-semibold text-primary">{margen.toFixed(1)}%</span>
                                            <span className="text-xs text-muted-foreground ml-2">({cantidad} prod.)</span>
                                          </>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">sin datos comparables</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                <p className="text-xs text-muted-foreground pt-1">
                                  Cada % indica la ganancia que tendrías sobre el precio de venta público actual si usaras esa lista de precios del proveedor.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
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