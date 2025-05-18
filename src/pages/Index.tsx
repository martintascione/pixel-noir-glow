
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PriceTable from '@/components/PriceTable';
import PromotionalBanner from '@/components/PromotionalBanner';
import { Product } from '@/types/products';
import { fetchProductById } from '@/services/api';

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState('Estribos');
  const [selectedProductId, setSelectedProductId] = useState('1'); // Cambiado a 1 para Estribos inicialmente
  
  useEffect(() => {
    // Cambiar el título del documento
    document.title = `Hierros Tascione - ${selectedProduct}`;
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
          <PriceTable productId={selectedProductId} />
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Index;
