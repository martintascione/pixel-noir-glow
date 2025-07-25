
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Plus, 
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
    queryFn: fetchProducts,
    staleTime: 0, // Siempre refrescar al volver a esta página
    refetchOnMount: true, // Refrescar al montar el componente
    refetchOnWindowFocus: true, // Refrescar al volver a la ventana
  });

  useEffect(() => {
    console.log("Productos cargados en AdminProducts:", data?.data);
  }, [data]);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      console.log("Producto creado:", data);
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
        description: "No se pudo crear el producto. Verifica la conexión a la base de datos.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, product }: { id: string, product: Partial<Product> }) => {
      console.log(`Enviando actualización para el producto ${id}:`, product);
      return updateProduct(id, product);
    },
    onSuccess: (data) => {
      console.log("Producto actualizado:", data);
      // Invalidar todas las consultas relacionadas con los productos
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
        description: "No se pudo actualizar el producto. Verifica la conexión a la base de datos.",
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
        description: "No se pudo eliminar el producto. Verifica la conexión a la base de datos.",
        variant: "destructive",
      });
    }
  });

  const handleEditProduct = (product: Product) => {
    console.log("Editando producto:", product);
    // Asegurarse de que estamos trabajando con un objeto de producto completo
    setEditingProduct({...product});
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmitProduct = (product: Omit<Product, "id"> | Product) => {
    console.log("Enviando producto:", product);
    
    if ("id" in product && editingProduct) {
      console.log("Modo edición detectado. ID del producto:", product.id);
      // Asegurar que todos los campos del producto original se mantengan
      // y que se actualice correctamente
      updateMutation.mutate({ 
        id: product.id, 
        product: product
      });
    } else {
      console.log("Modo creación detectado.");
      createMutation.mutate(product as Omit<Product, "id">);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  // Asegurarse de que tenemos productos para mostrar
  const products = Array.isArray(data?.data) ? data.data : [];

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
          <div className="mt-2 text-sm">
            {error instanceof Error ? error.message : "Error desconocido"}
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center p-8 text-amber-500">
          No hay productos cargados o no se pudo conectar a la base de datos.
          <div className="mt-2 text-sm">
            Se utilizarán datos de ejemplo para pruebas.
          </div>
        </div>
      ) : (
        <ProductList 
          products={products} 
          onEdit={handleEditProduct} 
          onDelete={handleDeleteProduct} 
        />
      )}
      
      <div className="mt-8 text-sm text-center text-muted-foreground">
        <p>Los datos de los productos se almacenan en la base de datos SQL.</p>
        <p>La última actualización de precios se realiza automáticamente cuando se modifican los productos.</p>
      </div>
    </div>
  );
};

export default AdminProducts;
