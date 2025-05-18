import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ChevronDown, Square, RectangleHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { fetchProductById } from '@/services/api';
import { ProductSize } from '@/types/products';

interface DiameterOption {
  value: string;
  label: string;
}

interface PriceTableProps {
  productId?: string;
}

const PriceTable = ({ productId = '4' }: PriceTableProps) => {
  const { toast } = useToast();
  const [selectedDiameter, setSelectedDiameter] = useState<string>("4.2");
  const [priceData, setPriceData] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [openSpecial, setOpenSpecial] = useState(false);
  const [openDelivery, setOpenDelivery] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openBilling, setOpenBilling] = useState(false);

  const diameterOptions: DiameterOption[] = [
    { value: "4.2", label: "4.2 mm" },
    { value: "6", label: "6 mm" },
  ];

  // Función para cargar datos desde la API según el diámetro seleccionado
  const loadProductDataByDiameter = async (diameter: string) => {
    setLoading(true);
    
    try {
      // Aquí pasamos tanto el ID del producto como el diámetro seleccionado
      // Nuestra API debería filtrar los resultados según el diámetro
      const { data, error } = await fetchProductById(productId, diameter);
      
      if (error) {
        toast({
          title: "Error al cargar datos",
          description: error,
          variant: "destructive",
        });
        // Datos de respaldo en caso de error, adaptados según el diámetro
        if (diameter === "4.2") {
          setPriceData([
            { size: "10x10", price: 150 },
            { size: "15x15", price: 170 },
            { size: "20x20", price: 190 },
            { size: "10x20", price: 180 },
          ]);
        } else {
          setPriceData([
            { size: "10x10", price: 180 },
            { size: "15x15", price: 200 },
            { size: "20x20", price: 220 },
            { size: "20x30", price: 230 },
            { size: "30x30", price: 240 },
          ]);
        }
      } else if (data.sizes && data.sizes.length > 0) {
        setPriceData(data.sizes);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del producto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando cambia el productId o el diámetro
  useEffect(() => {
    loadProductDataByDiameter(selectedDiameter);
  }, [productId, selectedDiameter, toast]);

  // Manejador para cuando el usuario selecciona un diámetro diferente
  const handleDiameterSelect = (diameter: string) => {
    setSelectedDiameter(diameter);
  };

  const handleContactClick = () => {
    toast({
      title: "Contacto iniciado",
      description: "Redirigiendo a WhatsApp...",
    });
    // En un caso real, aquí se redigiría a WhatsApp
    window.open("https://wa.me/+5491112345678", "_blank");
  };

  const handleQuoteClick = () => {
    toast({
      title: "Solicitud de presupuesto",
      description: "Procesando su solicitud...",
    });
    // En un caso real, aquí se redigiría a WhatsApp u otro método de contacto
    window.open("https://wa.me/+5491112345678?text=Hola,%20quiero%20un%20presupuesto%20personalizado", "_blank");
  };

  const handleAvailabilityClick = () => {
    toast({
      title: "Consultando disponibilidad",
      description: "Verificando stock...",
    });
    // En un caso real, aquí se redigiría a WhatsApp u otro método de contacto
    window.open("https://wa.me/+5491112345678?text=Hola,%20quiero%20consultar%20la%20disponibilidad%20de%20estribos", "_blank");
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const squareMeasurements = priceData.filter(item => 
    item.size.split('x')[0] === item.size.split('x')[1]
  );
  
  const rectangularMeasurements = priceData.filter(item => 
    item.size.split('x')[0] !== item.size.split('x')[1]
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Lista de Precios - Estribos</h2>
        <p className="text-muted-foreground text-sm">
          Precios actualizados al {new Date().toLocaleDateString('es-AR', {day: 'numeric', month: 'long', year: 'numeric'})}
        </p>
      </div>

      {/* Tabla unificada con separación visual */}
      <motion.div 
        className="overflow-hidden rounded-xl border border-border bg-white mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={`price-table-${selectedDiameter}`} // Add key to trigger animation on diameter change
      >
        <div className="px-6 py-4 border-b border-border bg-white">
          <div className="grid grid-cols-2">
            <div className="font-medium">Medida (cm)</div>
            <div className="font-medium">Precio Unitario</div>
          </div>
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando precios...</div>
        ) : (
          <div className="divide-y divide-border">
            {/* Sección de Medidas Cuadradas */}
            <div className="bg-white px-6 py-3 flex items-center gap-2 border-b border-border">
              <Square size={16} className="text-primary" />
              <h3 className="font-medium">Medidas Cuadradas</h3>
            </div>
            
            {squareMeasurements.length > 0 ? (
              squareMeasurements.map((item, index) => (
                <motion.div 
                  key={`square-${index}-${selectedDiameter}`}
                  className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200 bg-white"
                  variants={itemVariants}
                >
                  <div>{item.size}</div>
                  <div>${item.price}</div>
                </motion.div>
              ))
            ) : (
              <div className="px-6 py-4 text-muted-foreground">No hay medidas cuadradas disponibles</div>
            )}

            {/* Separador */}
            <div className="bg-white px-6 py-3 flex items-center gap-2 border-b border-border">
              <RectangleHorizontal size={16} className="text-primary" />
              <h3 className="font-medium">Medidas Rectangulares</h3>
            </div>
            
            {/* Sección de Medidas Rectangulares */}
            {rectangularMeasurements.length > 0 ? (
              rectangularMeasurements.map((item, index) => (
                <motion.div 
                  key={`rectangular-${index}-${selectedDiameter}`}
                  className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200 bg-white"
                  variants={itemVariants}
                >
                  <div>{item.size}</div>
                  <div>${item.price}</div>
                </motion.div>
              ))
            ) : (
              <div className="px-6 py-4 text-muted-foreground">No hay medidas rectangulares disponibles</div>
            )}
          </div>
        )}
      </motion.div>

      <div className="mt-8 flex justify-center">
        <Button 
          onClick={handleContactClick}
          className="rounded-xl py-6 px-6 bg-green-500 hover:bg-green-600 flex gap-2 items-center"
        >
          <MessageSquare size={24} className="text-white" />
          Consultar o hacer pedido por WhatsApp
        </Button>
      </div>

      <div className="mt-16">
        <Collapsible
          open={openSpecial}
          onOpenChange={setOpenSpecial}
          className="w-full"
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex justify-between items-center border border-border rounded-xl p-4 bg-white hover:bg-muted/30 transition-all">
              <h3 className="text-xl font-bold">Medidas Especiales / Personalizadas</h3>
              <ChevronDown className={`transition-transform duration-200 ${openSpecial ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-x border-b border-border rounded-b-xl p-6 bg-white animate-slide-down">
            <p className="mb-4 text-muted-foreground">
              Fabricamos estribos a medida según tus necesidades. Tiempo estimado de producción: 24 a 48 hs. 
              Consultanos por WhatsApp para obtener tu presupuesto personalizado.
            </p>
            <div className="flex justify-center mt-6">
              <Button 
                onClick={handleQuoteClick}
                variant="outline"
                className="rounded-xl bg-white flex gap-2 items-center"
              >
                <MessageSquare className="text-green-500" />
                Solicitar presupuesto personalizado
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="mt-8">
        <Collapsible
          open={openDelivery}
          onOpenChange={setOpenDelivery}
          className="w-full"
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex justify-between items-center border border-border rounded-xl p-4 bg-white hover:bg-muted/30 transition-all">
              <h3 className="text-xl font-bold">Condiciones de Entrega y Retiro</h3>
              <ChevronDown className={`transition-transform duration-200 ${openDelivery ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-x border-b border-border rounded-b-xl p-6 bg-white animate-slide-down">
            <p className="mb-4 text-muted-foreground">
              Podés retirar sin costo en nuestro depósito o coordinar envío. Los plazos de entrega varían según la medida y
              cantidad. Consultanos por disponibilidad.
            </p>
            <div className="flex justify-center mt-6">
              <Button 
                onClick={handleAvailabilityClick}
                variant="outline"
                className="rounded-xl bg-white flex gap-2 items-center"
              >
                <MessageSquare className="text-green-500" />
                Consultar disponibilidad
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="mt-8">
        <Collapsible
          open={openPayment}
          onOpenChange={setOpenPayment}
          className="w-full"
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex justify-between items-center border border-border rounded-xl p-4 bg-white hover:bg-muted/30 transition-all">
              <h3 className="text-xl font-bold">Condiciones de Pago</h3>
              <ChevronDown className={`transition-transform duration-200 ${openPayment ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-x border-b border-border rounded-b-xl p-6 bg-white animate-slide-down">
            <p className="mb-4 text-muted-foreground">
              Los pagos pueden realizarse en efectivo, transferencia bancaria o con cheque a 15 días. 
              Para pagos con otros medios, consultar condiciones.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="mt-8">
        <Collapsible
          open={openBilling}
          onOpenChange={setOpenBilling}
          className="w-full"
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex justify-between items-center border border-border rounded-xl p-4 bg-white hover:bg-muted/30 transition-all">
              <h3 className="text-xl font-bold">Condiciones de Facturación</h3>
              <ChevronDown className={`transition-transform duration-200 ${openBilling ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-x border-b border-border rounded-b-xl p-6 bg-white animate-slide-down">
            <p className="mb-4 text-muted-foreground">
              Todos los precios incluyen IVA. Se emiten facturas A o B según corresponda. 
              En caso de requerir factura A, se solicitará el CUIT correspondiente.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default PriceTable;
