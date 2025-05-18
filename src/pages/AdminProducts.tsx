
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { Product } from '@/types/products';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/services/api';
import { Button } from '@/components/ui/button';
import { 
  Collapsible,
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import ProductForm from '@/components/admin/ProductForm';
import ProductList from '@/components/admin/ProductList';

const AdminProducts = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Éxito",
        description: "Producto creado correctamente",
      });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, product }: { id: string, product: Partial<Product> }) => 
      updateProduct(id, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      });
      setEditingProduct(null);
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  });

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmitProduct = (product: Omit<Product, "id"> | Product) => {
    if ("id" in product && editingProduct) {
      updateMutation.mutate({ 
        id: product.id, 
        product: product 
      });
    } else {
      createMutation.mutate(product as Omit<Product, "id">);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Administración de Productos</h1>
        </div>
      </div>

      <div className="mb-6">
        <Collapsible
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          className="w-full border rounded-md"
        >
          <div className="flex items-center justify-between p-4 bg-muted/50">
            <h2 className="text-lg font-medium">
              {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isFormOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="p-4 border-t">
            <ProductForm 
              initialData={editingProduct} 
              onSubmit={handleSubmitProduct} 
              onCancel={handleCancelEdit} 
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {!isFormOpen && (
        <Button 
          className="mb-6" 
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Producto
        </Button>
      )}

      {isLoading ? (
        <div className="text-center p-8">Cargando productos...</div>
      ) : error ? (
        <div className="text-center p-8 text-red-500">
          Error al cargar los productos. Intente nuevamente.
        </div>
      ) : (
        <ProductList 
          products={data?.data || []} 
          onEdit={handleEditProduct} 
          onDelete={handleDeleteProduct} 
        />
      )}
    </div>
  );
};

export default AdminProducts;
