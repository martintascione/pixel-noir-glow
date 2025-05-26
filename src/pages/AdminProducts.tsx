
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { Product } from '@/types/products';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ProductForm from '@/components/admin/ProductForm';
import ProductList from '@/components/admin/ProductList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminProducts = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
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
      console.error("Error al crear producto:", error);
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
      console.error("Error al actualizar producto:", error);
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
      console.error("Error al eliminar producto:", error);
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

  const handleSubmitProduct = (productData: any) => {
    if (editingProduct) {
      updateMutation.mutate({ 
        id: editingProduct.id, 
        product: productData
      });
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  const products = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Administración de Productos</h1>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          <Plus className="mr-2 h-4 w-4" />
          {isFormOpen ? 'Cancelar' : 'Nuevo Producto'}
        </Button>
      </div>

      {isFormOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm 
              initialData={editingProduct} 
              onSubmit={handleSubmitProduct} 
              onCancel={handleCancelEdit} 
            />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center p-8">Cargando productos...</div>
      ) : error ? (
        <div className="text-center p-8 text-red-500">
          Error al cargar los productos: {error instanceof Error ? error.message : "Error desconocido"}
        </div>
      ) : (
        <ProductList 
          products={products} 
          onEdit={handleEditProduct} 
          onDelete={handleDeleteProduct} 
        />
      )}
    </div>
  );
};

export default AdminProducts;
