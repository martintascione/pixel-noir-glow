import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductCategory, Product, CreateProduct } from '@/types/supabase';
import { createProduct, updateProduct, deleteProduct, updatePricesByCategory } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Save, X, Percent, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from "@/lib/utils";
import { CostManager } from '@/components/admin/CostManager';

interface ProductManagerProps {
  categories: ProductCategory[];
  products: Product[];
}

const ProductManager = ({ categories, products }: ProductManagerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPriceUpdateOpen, setIsPriceUpdateOpen] = useState(false);
  const [isCostManagerOpen, setIsCostManagerOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [priceUpdateData, setPriceUpdateData] = useState({
    categoryId: '',
    percentage: 0
  });
  const [formData, setFormData] = useState<CreateProduct>({
    category_id: '',
    name: '',
    size: '',
    price: 0,
    diameter: '',
    shape: '',
    nail_type: '',
    display_order: 0
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreating(false);
      resetForm();
      toast({ title: "Éxito", description: "Producto creado correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo crear el producto", variant: "destructive" });
      console.error(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<CreateProduct> }) =>
      updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingId(null);
      toast({ title: "Éxito", description: "Producto actualizado correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo actualizar el producto", variant: "destructive" });
      console.error(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Éxito", description: "Producto eliminado correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo eliminar el producto", variant: "destructive" });
      console.error(error);
    }
  });

  const updatePricesMutation = useMutation({
    mutationFn: ({ categoryId, percentage }: { categoryId: string, percentage: number }) =>
      updatePricesByCategory(categoryId, percentage),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsPriceUpdateOpen(false);
      setPriceUpdateData({ categoryId: '', percentage: 0 });
      toast({ 
        title: "Éxito", 
        description: `Se actualizaron ${data.length} productos correctamente` 
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "No se pudieron actualizar los precios", 
        variant: "destructive" 
      });
      console.error(error);
    }
  });

  const resetForm = () => {
    setFormData({
      category_id: '',
      name: '',
      size: '',
      price: 0,
      diameter: '',
      shape: '',
      nail_type: '',
      display_order: 0
    });
  };

  const handleCreate = () => {
    const cleanData = { ...formData };
    if (!cleanData.diameter) delete cleanData.diameter;
    if (!cleanData.shape) delete cleanData.shape;
    if (!cleanData.nail_type) delete cleanData.nail_type;
    
    createMutation.mutate(cleanData);
  };

  const handleUpdate = (product: Product) => {
    const cleanData = { ...formData };
    delete cleanData.category_id; // No cambiar categoría en update
    if (!cleanData.diameter) delete cleanData.diameter;
    if (!cleanData.shape) delete cleanData.shape;
    if (!cleanData.nail_type) delete cleanData.nail_type;
    
    updateMutation.mutate({ id: product.id, updates: cleanData });
  };

  const handleDelete = (id: string) => {
    const product = products.find(p => p.id === id);
    setConfirmDialogData({
      title: "Confirmar eliminación",
      message: `¿Estás seguro de eliminar el producto "${product?.name}"? Se eliminarán todos sus combos.`,
      onConfirm: () => {
        deleteMutation.mutate(id);
        setIsConfirmDialogOpen(false);
      }
    });
    setIsConfirmDialogOpen(true);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      category_id: product.category_id,
      name: product.name,
      size: product.size,
      price: product.price,
      diameter: product.diameter || '',
      shape: product.shape || '',
      nail_type: product.nail_type || '',
      display_order: product.display_order
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const handlePriceUpdate = () => {
    if (!priceUpdateData.categoryId || priceUpdateData.percentage === 0) {
      toast({ 
        title: "Error", 
        description: "Selecciona una categoría y un porcentaje válido", 
        variant: "destructive" 
      });
      return;
    }

    const category = categories.find(c => c.id === priceUpdateData.categoryId);
    const affectedProducts = products.filter(p => p.category_id === priceUpdateData.categoryId);
    
    if (affectedProducts.length === 0) {
      toast({ 
        title: "Advertencia", 
        description: "No hay productos en esta categoría", 
        variant: "destructive" 
      });
      return;
    }

    const action = priceUpdateData.percentage > 0 ? 'aumentar' : 'reducir';
    const absPercentage = Math.abs(priceUpdateData.percentage);
    
    setConfirmDialogData({
      title: "Confirmar actualización de precios",
      message: `¿Estás seguro de ${action} los precios de "${category?.name}" en ${absPercentage}%? Se afectarán ${affectedProducts.length} productos.`,
      onConfirm: () => {
        updatePricesMutation.mutate({
          categoryId: priceUpdateData.categoryId,
          percentage: priceUpdateData.percentage
        });
        setIsConfirmDialogOpen(false);
      }
    });
    setIsConfirmDialogOpen(true);
  };

  const getCategoryType = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.type || 'estribos';
  };

  const getProductsByCategory = () => {
    const grouped = products.reduce((acc, product) => {
      const categoryName = product.category?.name || 'Sin categoría';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
    
    // Ordenar productos dentro de cada categoría por diámetro y medida
    Object.keys(grouped).forEach(categoryName => {
      grouped[categoryName].sort((a, b) => {
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
    
    return grouped;
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

  const productsByCategory = getProductsByCategory();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Gestión de Productos</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={isPriceUpdateOpen} onOpenChange={setIsPriceUpdateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Percent className="h-4 w-4 mr-2" />
                  Actualizar Precios
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Actualización Masiva de Precios</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoría</label>
                    <Select 
                      value={priceUpdateData.categoryId} 
                      onValueChange={(value) => setPriceUpdateData({...priceUpdateData, categoryId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Porcentaje de cambio (+ para aumentar, - para reducir)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 5 (aumenta 5%), -10 (reduce 10%)"
                      value={priceUpdateData.percentage === 0 ? '' : priceUpdateData.percentage}
                      onChange={(e) => setPriceUpdateData({
                        ...priceUpdateData, 
                        percentage: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handlePriceUpdate} 
                      disabled={!priceUpdateData.categoryId || priceUpdateData.percentage === 0 || updatePricesMutation.isPending}
                      className="flex-1"
                    >
                      {updatePricesMutation.isPending ? 'Actualizando...' : 'Actualizar Precios'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsPriceUpdateOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCostManagerOpen} onOpenChange={setIsCostManagerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Calculator className="h-4 w-4 mr-2" />
                  Costos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-5xl h-[85vh] sm:h-[80vh] flex flex-col overflow-hidden rounded-xl border-0 p-0">
                <DialogHeader className="px-4 sm:px-6 py-3 border-b bg-background rounded-t-xl flex-shrink-0">
                  <DialogTitle className="text-base sm:text-lg">Gestión de Costos</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="space-y-4">
                    <CostManager products={products} />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button onClick={() => setIsCreating(true)} disabled={isCreating} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario de creación */}
        {isCreating && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({...formData, category_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Nombre del producto"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              
              <Input
                placeholder="Medida/Tamaño"
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
              />
              
              <Input
                type="number"
                step="0.01"
                placeholder="Precio unitario (ej: 150.50)"
                value={formData.price === 0 ? '' : formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
              />

              {formData.category_id && getCategoryType(formData.category_id) === 'estribos' && (
                <>
                  <Input
                    placeholder="Diámetro (ej: 4.2, 6)"
                    value={formData.diameter}
                    onChange={(e) => setFormData({...formData, diameter: e.target.value})}
                  />
                  <Select 
                    value={formData.shape} 
                    onValueChange={(value) => setFormData({...formData, shape: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Forma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cuadrado">Cuadrado</SelectItem>
                      <SelectItem value="Rectangular">Rectangular</SelectItem>
                      <SelectItem value="Triangular">Triangular</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              {formData.category_id && getCategoryType(formData.category_id) === 'clavos' && (
                <Input
                  placeholder="Tipo de clavo"
                  value={formData.nail_type}
                  onChange={(e) => setFormData({...formData, nail_type: e.target.value})}
                />
              )}
              
              <Input
                type="number"
                placeholder="Orden de visualización (ej: 1, 2, 3)"
                value={formData.display_order === 0 ? '' : formData.display_order}
                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button onClick={handleCreate} disabled={!formData.name || !formData.category_id} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Crear
              </Button>
              <Button variant="outline" onClick={cancelEdit} className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de productos por categoría */}
        <Accordion type="multiple" className="w-full">
          {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
            <AccordionItem key={categoryName} value={categoryName}>
              <AccordionTrigger>
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-medium">{categoryName}</span>
                  <span className="text-muted-foreground text-sm">
                    {categoryProducts.length} productos
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {categoryProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      {editingId === product.id ? (
                        <div className="flex-1 mr-4">
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                            <Input
                              placeholder="Nombre del producto"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                            <Input
                              placeholder="Medida/Tamaño"
                              value={formData.size}
                              onChange={(e) => setFormData({...formData, size: e.target.value})}
                            />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Precio unitario"
                              value={formData.price}
                              onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                            />
                            <Input
                              type="number"
                              placeholder="Orden de visualización"
                              value={formData.display_order}
                              onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                            />
                          </div>

                          {/* Campos específicos para estribos en edición */}
                          {product.category?.type === 'estribos' && (
                            <div className="grid gap-4 md:grid-cols-2">
                              <Input
                                placeholder="Diámetro (ej: 4.2, 6)"
                                value={formData.diameter}
                                onChange={(e) => setFormData({...formData, diameter: e.target.value})}
                              />
                              <Select 
                                value={formData.shape} 
                                onValueChange={(value) => setFormData({...formData, shape: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Forma" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Cuadrado">Cuadrado</SelectItem>
                                  <SelectItem value="Rectangular">Rectangular</SelectItem>
                                  <SelectItem value="Triangular">Triangular</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Campos específicos para clavos en edición */}
                          {product.category?.type === 'clavos' && (
                            <div className="grid gap-4 md:grid-cols-1">
                              <Input
                                placeholder="Tipo de clavo"
                                value={formData.nail_type}
                                onChange={(e) => setFormData({...formData, nail_type: e.target.value})}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.size} • {formatPrice(product.price)}
                            {product.diameter && ` • Ø${product.diameter}mm`}
                            {product.shape && ` • ${product.shape}`}
                            {product.nail_type && ` • ${product.nail_type}`}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {editingId === product.id ? (
                          <>
                            <Button size="sm" onClick={() => handleUpdate(product)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Diálogo de confirmación personalizado */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="sm:max-w-sm max-w-[90vw] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <DialogHeader>
              <DialogTitle className="text-lg">{confirmDialogData.title}</DialogTitle>
            </DialogHeader>
            <div className="py-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {confirmDialogData.message}
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDialogData.onConfirm}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              >
                Aceptar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProductManager;