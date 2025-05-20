
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PriceTable from '@/components/PriceTable';
import PromotionalBanner from '@/components/PromotionalBanner';
import { Product } from '@/types/products';
import { fetchProducts } from '@/services/api';
import { useQuery } from '@tanstack/react-query';

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Obtener todos los productos
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
  
  const products = productsResponse?.data || [];
  
  // Establecer el producto inicial cuando se cargan los datos
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProduct(products[0].name);
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);
  
  useEffect(() => {
    // Cambiar el título del documento
    document.title = selectedProduct 
      ? `Hierros Tascione - ${selectedProduct}` 
      : 'Hierros Tascione';
  }, [selectedProduct]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product.name);
    setSelectedProductId(product.id);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onSelectProduct={handleSelectProduct} />
      
      <motion.main 
        className="flex-grow py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container-custom">
          <PromotionalBanner />
          
          {isLoading ? (
            <div className="text-center py-8">Cargando productos...</div>
          ) : selectedProductId ? (
            <PriceTable productId={selectedProductId} productName={selectedProduct} />
          ) : (
            <div className="text-center py-8 border rounded-lg p-6 bg-muted/20">
              <h2 className="text-xl font-medium mb-2">No hay productos en esta categoría</h2>
              <p className="text-muted-foreground">
                Aún no se han cargado productos para esta categoría. Por favor, seleccione otra categoría o acceda al panel de administración para agregar productos.
              </p>
            </div>
          )}
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Index;
