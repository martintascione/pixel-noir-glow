
import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchProducts } from '@/services/api';
import { Product } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Settings, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Index = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const products = Array.isArray(data?.data) ? data.data : [];

  // Agrupar productos por categoría
  const groupedProducts = products.reduce((acc: Record<string, Product[]>, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  const getProductSubtitle = (product: Product) => {
    let subtitle = '';
    if (product.subcategory) subtitle += product.subcategory;
    if (product.shape) subtitle += (subtitle ? ' - ' : '') + product.shape;
    return subtitle;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Hierros Tascione
              </h1>
              <p className="text-gray-600 mt-1">Lista de Precios</p>
            </div>
            <Link to="/admin/productos">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Administrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Cargando productos...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-lg text-red-600">
              Error al cargar los productos
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600 mb-4">
              No hay productos cargados
            </div>
            <Link to="/admin/productos">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Primer Producto
              </Button>
            </Link>
          </div>
        ) : (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-2xl">{category}</CardTitle>
                  <CardDescription>
                    {categoryProducts.length} producto{categoryProducts.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {categoryProducts.map((product) => (
                      <div key={product.id}>
                        <h4 className="text-lg font-semibold mb-2">
                          {product.name}
                          {getProductSubtitle(product) && (
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              ({getProductSubtitle(product)})
                            </span>
                          )}
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medida</TableHead>
                              <TableHead className="text-right">Precio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.sizes.map((size, index) => (
                              <TableRow key={index}>
                                <TableCell>{size.size}</TableCell>
                                <TableCell className="text-right font-medium">
                                  ${size.price.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2024 Hierros Tascione - Lista de Precios</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
