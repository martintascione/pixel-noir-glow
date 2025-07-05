
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PriceTable from '@/components/PriceTable';
import PromotionalBanner from '@/components/PromotionalBanner';
import { Button } from '@/components/ui/button';
import { getPublicData } from '@/services/supabaseService';
import { useQuery } from '@tanstack/react-query';

const Index = () => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['public-data'],
    queryFn: getPublicData,
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hierros Tascione</h1>
          <Link to="/admin">
            <Button variant="outline">Dashboard Admin</Button>
          </Link>
        </div>
      </div>
      
      <motion.main 
        className="flex-grow py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4">
          <PromotionalBanner />
          
          {isLoading ? (
            <div className="text-center py-8">Cargando productos...</div>
          ) : (
            <div className="grid gap-8">
              {categories.map((category: any) => (
                <div key={category.id} className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">{category.name}</h2>
                  <PriceTable 
                    productId={category.id}
                    productName={category.name}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Index;
