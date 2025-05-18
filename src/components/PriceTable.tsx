
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";

// Tipos para los datos de la tabla
interface PriceItem {
  size: string;
  price: number;
}

interface DiameterOption {
  value: string;
  label: string;
}

const PriceTable = () => {
  const { toast } = useToast();
  const [selectedDiameter, setSelectedDiameter] = useState<string>("4.2");
  const [priceData, setPriceData] = useState<PriceItem[]>([
    { size: "10x10", price: 150 },
    { size: "15x15", price: 170 },
    { size: "20x30", price: 195 },
    { size: "30x30", price: 210 },
  ]);

  const handleContactClick = () => {
    toast({
      title: "Contacto iniciado",
      description: "Redirigiendo a WhatsApp...",
    });
  };

  const handleQuoteClick = () => {
    toast({
      title: "Solicitud de presupuesto",
      description: "Procesando su solicitud...",
    });
  };

  const handleAvailabilityClick = () => {
    toast({
      title: "Consultando disponibilidad",
      description: "Verificando stock...",
    });
  };

  const diameterOptions: DiameterOption[] = [
    { value: "4.2", label: "4.2 mm" },
    { value: "6", label: "6 mm" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Lista de Precios - Estribos de Hierro</h2>
        <p className="text-muted-foreground text-sm">
          Precios actualizados al {new Date().toLocaleDateString('es-AR', {day: 'numeric', month: 'long', year: 'numeric'})}
        </p>
      </div>

      <div className="mb-8">
        <label className="block mb-2 font-medium">
          Seleccioná el diámetro:
        </label>
        <div className="grid grid-cols-2 gap-3">
          {diameterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedDiameter(option.value)}
              className={`py-3 px-4 rounded-md transition-all duration-200 ${
                selectedDiameter === option.value
                  ? "bg-accent text-foreground border-primary border"
                  : "bg-secondary text-secondary-foreground hover:bg-accent/60"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div 
        className="overflow-hidden rounded-lg border border-border"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="bg-card px-6 py-4 border-b border-border">
          <div className="grid grid-cols-2">
            <div className="font-medium">Medida (cm)</div>
            <div className="font-medium">Precio Unitario</div>
          </div>
        </div>
        
        <div className="divide-y divide-border">
          {priceData.map((item, index) => (
            <motion.div 
              key={index}
              className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200"
              variants={item}
            >
              <div>{item.size}</div>
              <div>${item.price}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="mt-8 flex justify-center">
        <button 
          onClick={handleContactClick}
          className="btn-primary"
        >
          Consultar o hacer pedido por WhatsApp
        </button>
      </div>

      <div className="mt-16">
        <h3 className="text-xl font-bold mb-4">Medidas Especiales / Personalizadas</h3>
        <p className="mb-4 text-muted-foreground">
          Fabricamos estribos a medida según tus necesidades. Tiempo estimado de producción: 24 a 48 hs. 
          Consultanos por WhatsApp para obtener tu presupuesto personalizado.
        </p>
        <div className="flex justify-center mt-6">
          <button 
            onClick={handleQuoteClick}
            className="btn-outline"
          >
            Solicitar presupuesto personalizado
          </button>
        </div>
      </div>

      <div className="mt-16">
        <h3 className="text-xl font-bold mb-4">Condiciones de Entrega y Retiro</h3>
        <p className="mb-4 text-muted-foreground">
          Podés retirar sin costo en nuestro depósito o coordinar envío. Los plazos de entrega varían según la medida y
          cantidad. Consultanos por disponibilidad.
        </p>
        <div className="flex justify-center mt-6">
          <button 
            onClick={handleAvailabilityClick}
            className="btn-outline"
          >
            Consultar disponibilidad
          </button>
        </div>
      </div>

      <div className="mt-16">
        <h3 className="text-xl font-bold mb-4">Condiciones de Pago</h3>
        <p className="mb-4 text-muted-foreground">
          Los pagos pueden realizarse en efectivo, transferencia bancaria o con cheque a 15 días. 
          Para pagos con otros medios, consultar condiciones.
        </p>
      </div>

      <div className="mt-16">
        <h3 className="text-xl font-bold mb-4">Condiciones de Facturación</h3>
        <p className="mb-4 text-muted-foreground">
          Todos los precios incluyen IVA. Se emiten facturas A o B según corresponda. 
          En caso de requerir factura A, se solicitará el CUIT correspondiente.
        </p>
      </div>
    </div>
  );
};

export default PriceTable;
