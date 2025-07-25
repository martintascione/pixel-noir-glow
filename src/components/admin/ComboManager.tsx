import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, ProductCombo, CreateProductCombo } from '@/types/supabase';
import { createCombo, updateCombo, deleteCombo } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Pencil, Trash2, Save, X, Package, Image, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from "@/lib/utils";

interface ComboManagerProps {
  products: Product[];
  combos: ProductCombo[];
}

const ComboManager = ({ products, combos }: ComboManagerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<CreateProductCombo>({
    product_id: '',
    name: '',
    quantity: 0,
    price: 0,
    discount_percentage: 0,
    display_order: 0,
    image_url: ''
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
      display_order: 0,
      image_url: ''
    });
    setSelectedImage(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    
    setUploading(true);
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `combo-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('combo-images')
        .upload(filePath, selectedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('combo-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ 
        title: "Error", 
        description: "No se pudo subir la imagen", 
        variant: "destructive" 
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    let imageUrl = formData.image_url;
    
    if (selectedImage) {
      imageUrl = await uploadImage();
      if (!imageUrl) return; // Stop if image upload failed
    }
    
    createMutation.mutate({ ...formData, image_url: imageUrl });
  };

  const handleUpdate = async (combo: ProductCombo) => {
    const cleanData = { ...formData };
    delete cleanData.product_id; // No cambiar producto en update
    
    let imageUrl = cleanData.image_url;
    
    if (selectedImage) {
      imageUrl = await uploadImage();
      if (!imageUrl) return; // Stop if image upload failed
    }
    
    updateMutation.mutate({ id: combo.id, updates: { ...cleanData, image_url: imageUrl } });
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
      display_order: combo.display_order,
      image_url: combo.image_url || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setSelectedImage(null);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Gestión de Combos y Cajas</CardTitle>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating} className="w-full sm:w-auto">
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
                      {product.name} {product.diameter ? `- Ø${product.diameter}mm` : ''} {product.size ? `(${product.size})` : ''}
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
            
            {/* Campo de imagen */}
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                Imagen del combo (opcional)
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {selectedImage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {selectedImage.name}
                  </div>
                )}
              </div>
              {formData.image_url && (
                <div className="mt-2">
                  <img 
                    src={formData.image_url} 
                    alt="Vista previa" 
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button onClick={handleCreate} disabled={!formData.name || !formData.product_id || uploading} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {uploading ? 'Subiendo imagen...' : 'Crear'}
              </Button>
              <Button variant="outline" onClick={autoFillPrice} disabled={!formData.product_id || !formData.quantity} className="w-full sm:w-auto">
                <Package className="h-4 w-4 mr-2" />
                Calcular Precio
              </Button>
              <Button variant="outline" onClick={cancelEdit} className="w-full sm:w-auto">
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
                         <div className="flex-1 mr-4">
                           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
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
                           
                           {/* Campo de imagen en edición */}
                           <div className="space-y-2">
                             <label className="text-sm font-medium flex items-center gap-2">
                               <Image className="h-4 w-4" />
                               Cambiar imagen (opcional)
                             </label>
                             <div className="flex items-center gap-4">
                               <Input
                                 type="file"
                                 accept="image/*"
                                 onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                                 className="flex-1"
                               />
                               {selectedImage && (
                                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                   <Upload className="h-4 w-4" />
                                   {selectedImage.name}
                                 </div>
                               )}
                             </div>
                             {formData.image_url && (
                               <div className="mt-2">
                                 <img 
                                   src={formData.image_url} 
                                   alt="Vista previa" 
                                   className="w-20 h-20 object-cover rounded-lg border"
                                 />
                               </div>
                             )}
                           </div>
                         </div>
                       ) : (
                         <div className="flex-1 flex items-center gap-4">
                           {combo.image_url && (
                             <img 
                               src={combo.image_url} 
                               alt={combo.name} 
                               className="w-12 h-12 object-cover rounded-lg border"
                             />
                           )}
                           <div className="flex-1">
                              <div className="font-medium">
                                {combo.name} - Ø{combo.product?.diameter}mm
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {combo.quantity} unidades • {formatPrice(combo.price)}
                                {combo.discount_percentage > 0 && ` • ${combo.discount_percentage}% desc.`}
                              </div>
                           </div>
                         </div>
                       )}
                      
                      <div className="flex gap-2">
                        {editingId === combo.id ? (
                          <>
                             <Button size="sm" onClick={() => handleUpdate(combo)} disabled={uploading}>
                               <Save className="h-4 w-4" />
                               {uploading ? '...' : ''}
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