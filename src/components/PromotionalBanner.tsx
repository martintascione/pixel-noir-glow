import React from 'react';
import { motion } from 'framer-motion';
import { BadgePercent } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const PromotionalBanner = () => {
  return (
    <div className="space-y-4">
      {/* Promo 1 */}
      <motion.div 
        className="bg-green-500 text-white p-4 rounded-xl mb-6 relative overflow-hidden max-w-fit mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute -right-6 -top-6 opacity-10">
          <BadgePercent size={120} />
        </div>
        
        <div className="flex items-center space-x-3">
          <BadgePercent size={24} className="text-white" />
          <div className="flex items-center space-x-3">
            <Badge className="bg-white text-green-600 font-bold px-2 py-1">5% OFF</Badge>
            <p className="text-sm">En más de 2.000u</p>
          </div>
        </div>
      </motion.div>

      {/* Promo 2 */}
      <motion.div 
        className="bg-green-500 text-white p-4 rounded-xl mb-6 relative overflow-hidden max-w-fit mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="absolute -right-6 -top-6 opacity-10">
          <BadgePercent size={120} />
        </div>
        
        <div className="flex items-center space-x-3">
          <BadgePercent size={24} className="text-white" />
          <div className="flex items-center space-x-3">
            <Badge className="bg-white text-green-600 font-bold px-2 py-1">10% OFF</Badge>
            <p className="text-sm">En más de 3.000u</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PromotionalBanner;
