
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PriceTable from '@/components/PriceTable';
import PromotionalBanner from '@/components/PromotionalBanner';
import { ProductCategory } from '@/types/supabase';
import { getPublicData } from '@/services/supabaseService';
import { useQuery } from '@tanstack/react-query';

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState('Estribos');
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Usar React Query para obtener los datos de Supabase
  const { data: categories = [], refetch } = useQuery({
    queryKey: ['public-data'],
    queryFn: getPublicData,
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
    
    // Si las categorías están cargadas, buscar la categoría por nombre para obtener su ID
    if (categories && Array.isArray(categories) && categories.length > 0) {
      console.log("Buscando categoría por nombre:", selectedProduct);
      console.log("Categorías disponibles en Index:", categories);
      
      const categoryData = categories.find((c: any) => c.name === selectedProduct);
      
      if (categoryData) {
        console.log("Categoría encontrada:", categoryData);
        setSelectedProductId(categoryData.id);
      } else {
        console.log("Categoría no encontrada con nombre:", selectedProduct);
        // Si no se encuentra la categoría seleccionada, usar la primera disponible
        if (categories.length > 0) {
          console.log("Seleccionando la primera categoría disponible:", categories[0]);
          setSelectedProduct(categories[0].name);
          setSelectedProductId(categories[0].id);
        }
      }
    }
  }, [selectedProduct, categories]);

  const handleSelectProduct = (category: any) => {
    console.log("Categoría seleccionada en Index:", category);
    setSelectedProduct(category.name);
    setSelectedProductId(category.id);
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
