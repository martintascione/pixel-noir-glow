
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PriceTable from '@/components/PriceTable';
import { RectangleHorizontal, Square } from 'lucide-react';

const Index = () => {
  useEffect(() => {
    // Cambiar el título del documento
    document.title = "Hierros Tascione - Lista de Precios";
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <motion.main 
        className="flex-grow py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container-custom">
          {/* Banner Section */}
          <div className="mb-12 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 text-white p-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold">Estribos de Hierro de Alta Calidad</h2>
                <p className="text-slate-200">
                  Fabricamos estribos a medida para todo tipo de construcciones.
                  Nuestros productos son de la más alta calidad y resistencia.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                    <Square size={16} />
                    <span>Formatos Cuadrados</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                    <RectangleHorizontal size={16} />
                    <span>Formatos Rectangulares</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-32 h-32 md:w-40 md:h-40 relative">
                  <div className="absolute inset-0 border-8 border-white/20 rounded-xl transform rotate-45"></div>
                </div>
              </div>
            </div>
          </div>

          <PriceTable />
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Index;
