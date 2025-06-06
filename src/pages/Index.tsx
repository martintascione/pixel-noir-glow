
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
  const [selectedProduct, setSelectedProduct] = useState('Estribos');
  const [selectedProductId, setSelectedProductId] = useState('1');
  
  // Usar React Query para obtener los productos
  const { data, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60, // 1 minuto
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  
  // Refrescar datos cuando la página se activa
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  useEffect(() => {
    // Cambiar el título del documento
    document.title = `Hierros Tascione - ${selectedProduct}`;
    
    // Si los productos están cargados, buscar el producto por nombre para obtener su ID
    if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
      console.log("Buscando producto por nombre:", selectedProduct);
      console.log("Productos disponibles en Index:", data.data);
      
      const productData = data.data.find(p => p.name === selectedProduct);
      
      if (productData) {
        console.log("Producto encontrado:", productData);
        setSelectedProductId(productData.id);
      } else {
        console.log("Producto no encontrado con nombre:", selectedProduct);
        // Si no se encuentra el producto seleccionado, usar el primero disponible
        if (data.data.length > 0) {
          console.log("Seleccionando el primer producto disponible:", data.data[0]);
          setSelectedProduct(data.data[0].name);
          setSelectedProductId(data.data[0].id);
        }
      }
    }
  }, [selectedProduct, data?.data]);

  const handleSelectProduct = (product: Product) => {
    console.log("Producto seleccionado en Index:", product);
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
          <PriceTable 
            productId={selectedProductId} 
            productName={selectedProduct} 
            key={selectedProductId} // Agregar key para forzar recreación cuando cambia el producto
          />
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Index;
