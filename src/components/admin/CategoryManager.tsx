import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductCategory, CreateProductCategory } from '@/types/supabase';
import { createCategory, updateCategory, deleteCategory } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CategoryManagerProps {
  categories: ProductCategory[];
}

const CategoryManager = ({ categories }: CategoryManagerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProductCategory>({
    name: '',
    type: '',
    display_order: 0
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreating(false);
      setFormData({ name: '', type: '', display_order: 0 });
      toast({ title: "Éxito", description: "Categoría creada correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo crear la categoría", variant: "destructive" });
      console.error(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<CreateProductCategory> }) =>
      updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingId(null);
      toast({ title: "Éxito", description: "Categoría actualizada correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo actualizar la categoría", variant: "destructive" });
      console.error(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: "Éxito", description: "Categoría eliminada correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo eliminar la categoría", variant: "destructive" });
      console.error(error);
    }
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = (category: ProductCategory) => {
    updateMutation.mutate({ 
      id: category.id, 
      updates: { 
        name: formData.name, 
        type: formData.type, 
        display_order: formData.display_order 
      } 
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría? Se eliminarán todos sus productos.')) {
      deleteMutation.mutate(id);
    }
  };

  const startEdit = (category: ProductCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      type: category.type,
      display_order: category.display_order
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '', type: '', display_order: 0 });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Gestión de Categorías</CardTitle>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario de creación */}
        {isCreating && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                placeholder="Nombre de la categoría"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <Input
                placeholder="Tipo de la categoría"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              />
              <Input
                type="number"
                placeholder="Orden de visualización (ej: 1, 2, 3)"
                value={formData.display_order === 0 ? '' : formData.display_order}
                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button onClick={handleCreate} disabled={!formData.name} className="w-full sm:w-auto">
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

        {/* Lista de categorías */}
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
              {editingId === category.id ? (
                <div className="flex-1 grid gap-4 md:grid-cols-3 mr-4">
                  <Input
                    placeholder="Nombre de la categoría"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  <Input
                    placeholder="Tipo de la categoría"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  />
                  <Input
                    type="number"
                    placeholder="Orden de visualización"
                    value={formData.display_order}
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Tipo: {category.type} • Orden: {category.display_order}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                {editingId === category.id ? (
                  <>
                    <Button size="sm" onClick={() => handleUpdate(category)}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryManager;