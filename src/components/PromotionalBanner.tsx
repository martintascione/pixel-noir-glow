import React from 'react';
import { motion } from 'framer-motion';
import { BadgePercent } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface Promo {
  discount: string;
  text: string;
}

const promos: Promo[] = [
  { discount: "5% OFF", text: "En más de 2.000u" },
  { discount: "10% OFF", text: "En más de 3.000u" }
];

const PromotionalBanner = ({ discount, text }: Promo) => {
  return (
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
          <Badge className="bg-white text-green-600 font-bold px-2 py-1">
            {discount}
          </Badge>
          <p className="text-sm">{text}</p>
        </div>
      </div>
    </motion.div>
  );
};

const PromoSection = () => {
  return (
    <div className="space-y-4">
      {promos.map((promo, index) => (
        <PromotionalBanner 
          key={index} 
          discount={promo.discount} 
          text={promo.text} 
        />
      ))}
    </div>
  );
};

export default PromoSection;
