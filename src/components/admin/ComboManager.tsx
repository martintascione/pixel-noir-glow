import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, ProductCombo, CreateProductCombo } from '@/types/supabase';
import { createCombo, updateCombo, deleteCombo } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Pencil, Trash2, Save, X, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComboManagerProps {
  products: Product[];
  combos: ProductCombo[];
}

const ComboManager = ({ products, combos }: ComboManagerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProductCombo>({
    product_id: '',
    name: '',
    quantity: 0,
    price: 0,
    discount_percentage: 0,
    display_order: 0
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCombo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      setIsCreating(false);
      resetForm();
      toast({ title: "Éxito", description: "Combo creado correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo crear el combo", variant: "destructive" });
      console.error(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<CreateProductCombo> }) =>
      updateCombo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      setEditingId(null);
      toast({ title: "Éxito", description: "Combo actualizado correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo actualizar el combo", variant: "destructive" });
      console.error(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCombo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      toast({ title: "Éxito", description: "Combo eliminado correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo eliminar el combo", variant: "destructive" });
      console.error(error);
    }
  });

  const resetForm = () => {
    setFormData({
      product_id: '',
      name: '',
      quantity: 0,
      price: 0,
      discount_percentage: 0,
      display_order: 0
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = (combo: ProductCombo) => {
    const cleanData = { ...formData };
    delete cleanData.product_id; // No cambiar producto en update
    
    updateMutation.mutate({ id: combo.id, updates: cleanData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este combo?')) {
      deleteMutation.mutate(id);
    }
  };

  const startEdit = (combo: ProductCombo) => {
    setEditingId(combo.id);
    setFormData({
      product_id: combo.product_id,
      name: combo.name,
      quantity: combo.quantity,
      price: combo.price,
      discount_percentage: combo.discount_percentage,
      display_order: combo.display_order
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const calculateSuggestedPrice = (productId: string, quantity: number, discount: number = 5) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    
    const totalPrice = product.price * quantity;
    const discountAmount = (totalPrice * discount) / 100;
    return totalPrice - discountAmount;
  };

  const autoFillPrice = () => {
    if (formData.product_id && formData.quantity > 0) {
      const suggestedPrice = calculateSuggestedPrice(formData.product_id, formData.quantity, formData.discount_percentage);
      setFormData({...formData, price: suggestedPrice});
    }
  };

  const getCombosByProduct = () => {
    const grouped = combos.reduce((acc, combo) => {
      const productName = combo.product?.name || 'Sin producto';
      if (!acc[productName]) acc[productName] = [];
      acc[productName].push(combo);
      return acc;
    }, {} as Record<string, ProductCombo[]>);
    
    return grouped;
  };

  const combosByProduct = getCombosByProduct();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gestión de Combos y Cajas</CardTitle>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Combo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario de creación */}
        {isCreating && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select 
                value={formData.product_id} 
                onValueChange={(value) => setFormData({...formData, product_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Nombre del combo (ej: Caja 100u)"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              
              <Input
                type="number"
                placeholder="Cantidad de unidades (ej: 100)"
                value={formData.quantity === 0 ? '' : formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
              />
              
              <Input
                type="number"
                step="0.01"
                placeholder="Precio total del combo"
                value={formData.price === 0 ? '' : formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
              />

              <Input
                type="number"
                step="0.01"
                placeholder="% Descuento opcional"
                value={formData.discount_percentage === 0 ? '' : formData.discount_percentage}
                onChange={(e) => setFormData({...formData, discount_percentage: parseFloat(e.target.value) || 0})}
              />
              
              <Input
                type="number"
                placeholder="Orden de visualización"
                value={formData.display_order === 0 ? '' : formData.display_order}
                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate} disabled={!formData.name || !formData.product_id}>
                <Save className="h-4 w-4 mr-2" />
                Crear
              </Button>
              <Button variant="outline" onClick={autoFillPrice} disabled={!formData.product_id || !formData.quantity}>
                <Package className="h-4 w-4 mr-2" />
                Calcular Precio
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de combos por producto */}
        <Accordion type="multiple" className="w-full">
          {Object.entries(combosByProduct).map(([productName, productCombos]) => (
            <AccordionItem key={productName} value={productName}>
              <AccordionTrigger>
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-medium">{productName}</span>
                  <span className="text-muted-foreground text-sm">
                    {productCombos.length} combos
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {productCombos.map((combo) => (
                    <div key={combo.id} className="flex items-center justify-between p-3 border rounded-lg">
                      {editingId === combo.id ? (
                        <div className="flex-1 grid gap-4 md:grid-cols-2 lg:grid-cols-4 mr-4">
                          <Input
                            placeholder="Nombre del combo"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                          <Input
                            type="number"
                            placeholder="Cantidad"
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Precio total"
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="% Descuento opcional"
                            value={formData.discount_percentage === 0 ? '' : formData.discount_percentage}
                            onChange={(e) => setFormData({...formData, discount_percentage: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="font-medium">{combo.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {combo.quantity} unidades • ${combo.price}
                            {combo.discount_percentage > 0 && ` • ${combo.discount_percentage}% desc.`}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {editingId === combo.id ? (
                          <>
                            <Button size="sm" onClick={() => handleUpdate(combo)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(combo)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(combo.id)}>
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
      </CardContent>
    </Card>
  );
};

export default ComboManager;