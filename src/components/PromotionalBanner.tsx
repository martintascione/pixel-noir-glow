
import React from 'react';
import { motion } from 'framer-motion';
import { BadgePercent } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const PromotionalBanner = () => {
  return (
    <motion.div 
      className="bg-green-500 text-white p-4 rounded-xl mb-8 relative overflow-hidden"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute -right-6 -top-6 opacity-10">
        <BadgePercent size={120} />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BadgePercent size={24} className="text-white" />
          <div>
            <h3 className="font-bold text-lg">¡OFERTA ESPECIAL!</h3>
            <p className="text-white/90">En todos nuestros productos</p>
          </div>
        </div>
        
        <div className="text-right">
          <Badge className="bg-white text-green-600 font-bold mb-1 px-2 py-1">5% OFF</Badge>
          <p className="text-sm">Pago en efectivo contra entrega</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PromotionalBanner;
