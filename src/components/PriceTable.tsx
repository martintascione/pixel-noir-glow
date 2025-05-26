
import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ChevronDown, Square, RectangleHorizontal, Triangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchProductById, fetchLastUpdateDate } from '@/services/api';
import { ProductSize } from '@/types/products';

interface DiameterOption {
  value: string;
  label: string;
}

interface PriceTableProps {
  productId?: string;
  productName?: string;
}

const PriceTable = ({ productId = '1', productName = 'Estribos' }: PriceTableProps) => {
  const { toast } = useToast();
  const [selectedDiameter, setSelectedDiameter] = useState<string>("4.2");
  const [selectedNailType, setSelectedNailType] = useState<string>("1"); // Punta París by default
  const [priceData, setPriceData] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdateDate, setLastUpdateDate] = useState<Date>(new Date());
  const [showDiameters, setShowDiameters] = useState<boolean>(true);
  const [showNailTypes, setShowNailTypes] = useState<boolean>(false);
  
  const [openSpecial, setOpenSpecial] = useState(false);
  const [openDelivery, setOpenDelivery] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openBilling, setOpenBilling] = useState(false);

  const diameterOptions: DiameterOption[] = [
    { value: "4.2", label: "4.2 mm" },
    { value: "6", label: "6 mm" },
  ];

  const nailTypeOptions = [
    { value: "1", label: "Punta París" },
    { value: "2", label: "De Techo" },
  ];

  // Cargar la fecha de última actualización
  useEffect(() => {
    const loadLastUpdateDate = async () => {
      try {
        const { data, error } = await fetchLastUpdateDate();
        if (!error && data.updateDate) {
          setLastUpdateDate(new Date(data.updateDate));
        }
      } catch (error) {
        console.error("Error loading last update date:", error);
      }
    };
    
    loadLastUpdateDate();
  }, []);

  // Determinar qué filtros mostrar según el producto seleccionado
  useEffect(() => {
    // Mostrar selector de diámetros solo para Estribos
    if (productId === '1') { // Estribos
      setShowDiameters(true);
      setShowNailTypes(false);
    } 
    // Mostrar selector de tipos de clavos para Clavos
    else if (productId === '2') { // Clavos
      setShowDiameters(false);
      setShowNailTypes(true);
    }
    // No mostrar filtros para otros productos
    else {
      setShowDiameters(false);
      setShowNailTypes(false);
    }
  }, [productId]);

  // Cargar datos desde la API según los filtros seleccionados
  const loadProductData = async () => {
    setLoading(true);
    
    try {
      // Construir parámetros para la API
      let params = {};
      if (productId === '1' && selectedDiameter) { // Estribos
        params = { diameter: selectedDiameter };
      } 
      else if (productId === '2' && selectedNailType) { // Clavos
        params = { nailType: selectedNailType };
      }
      
      // Llamada a la API
      const { data, error } = await fetchProductById(productId, params);
      
      if (error) {
        toast({
          title: "Error al cargar datos",
          description: error,
          variant: "destructive",
        });
        
        // Datos de respaldo adaptados según el tipo de producto
        if (productId === '1') { // Estribos
          setPriceData(getMockEstriboData(selectedDiameter));
        } 
        else if (productId === '2') { // Clavos
          setPriceData(getMockClavoData(selectedNailType));
        }
        else if (productId === '3') { // Alambres
          setPriceData([
            { size: "Alambre 17/15 Acindar", price: 2000 },
            { size: "Alambre 19/17 Corralero", price: 2200 },
            { size: "Alta resistencia Bragado", price: 2400 },
            { size: "Bagual clásico", price: 2300 },
          ]);
        }
        else if (productId === '4') { // Torniquetes
          setPriceData([
            { size: "Doble liviana", price: 300 },
            { size: "Doble reforzada", price: 350 },
            { size: "N° 3 zincada", price: 250 },
          ]);
        }
        else if (productId === '5') { // Tranquerones
          setPriceData([
            { size: "Barral tranquerón (solo)", price: 400 },
            { size: "Contratranquerón de 1,2 (solo)", price: 350 },
            { size: "Crique (solo)", price: 300 },
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

  // Datos de respaldo para estribos según diámetro
  const getMockEstriboData = (diameter: string) => {
    if (diameter === "4.2") {
      return [
        // Cuadrados
        { size: "10x10", price: 150, shape: "Cuadrado" },
        { size: "15x15", price: 170, shape: "Cuadrado" },
        { size: "20x20", price: 190, shape: "Cuadrado" },
        // Rectangulares
        { size: "10x20", price: 180, shape: "Rectangular" },
        { size: "15x25", price: 200, shape: "Rectangular" },
        // Triangulares
        { size: "10x10x10", price: 160, shape: "Triangular" },
        { size: "15x15x15", price: 180, shape: "Triangular" },
      ];
    } else {
      return [
        // Cuadrados
        { size: "10x10", price: 180, shape: "Cuadrado" },
        { size: "15x15", price: 200, shape: "Cuadrado" },
        { size: "20x20", price: 220, shape: "Cuadrado" },
        // Rectangulares
        { size: "20x30", price: 230, shape: "Rectangular" },
        { size: "30x40", price: 250, shape: "Rectangular" },
        // Triangulares
        { size: "10x10x10", price: 190, shape: "Triangular" },
        { size: "15x15x15", price: 210, shape: "Triangular" },
        { size: "20x20x20", price: 230, shape: "Triangular" },
      ];
    }
  };

  // Datos de respaldo para clavos según tipo
  const getMockClavoData = (nailType: string) => {
    if (nailType === "1") { // Punta París
      return [
        { size: "1.5 pulgadas", price: 80 },
        { size: "2 pulgadas", price: 100 },
        { size: "2.5 pulgadas", price: 120 },
      ];
    } else { // De Techo
      return [
        { size: "3 pulgadas", price: 130 },
        { size: "4 pulgadas", price: 150 },
      ];
    }
  };

  // Cargar datos cuando cambia el productId, el diámetro o el tipo de clavo
  useEffect(() => {
    loadProductData();
  }, [productId, selectedDiameter, selectedNailType, toast]);

  // Manejador para cuando el usuario selecciona un diámetro diferente
  const handleDiameterSelect = (diameter: string) => {
    setSelectedDiameter(diameter);
  };

  // Manejador para cuando el usuario selecciona un tipo de clavo diferente
  const handleNailTypeSelect = (nailType: string) => {
    setSelectedNailType(nailType);
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

  // Formatear fecha de última actualización
  const formattedUpdateDate = lastUpdateDate.toLocaleDateString('es-AR', {
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  });
  
  // Filtrar datos según el tipo de producto
  const renderPriceTable = () => {
    // Caso especial para Estribos: separar por formas
    if (productId === '1') {
      const cuadrados = priceData.filter(item => item.shape === "Cuadrado");
      const rectangulares = priceData.filter(item => item.shape === "Rectangular");
      const triangulares = priceData.filter(item => item.shape === "Triangular");
      
      return (
        <div className="divide-y divide-border">
          {/* Sección de Medidas Cuadradas */}
          <div className="bg-white px-6 py-3 flex items-center gap-2 border-b border-border">
            <Square size={16} className="text-primary" />
            <h3 className="font-medium">Medidas Cuadradas</h3>
          </div>
          
          {cuadrados.length > 0 ? (
            cuadrados.map((item, index) => (
              <motion.div 
                key={`square-${index}-${selectedDiameter}`}
                className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200 bg-white"
                variants={itemVariants}
              >
                <div>{item.size}</div>
                <div className="text-right">${item.price}</div>
              </motion.div>
            ))
          ) : (
            <div className="px-6 py-4 text-muted-foreground">No hay medidas cuadradas disponibles</div>
          )}

          {/* Sección de Medidas Rectangulares */}
          <div className="bg-white px-6 py-3 flex items-center gap-2 border-b border-border">
            <RectangleHorizontal size={16} className="text-primary" />
            <h3 className="font-medium">Medidas Rectangulares</h3>
          </div>
          
          {rectangulares.length > 0 ? (
            rectangulares.map((item, index) => (
              <motion.div 
                key={`rectangular-${index}-${selectedDiameter}`}
                className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200 bg-white"
                variants={itemVariants}
              >
                <div>{item.size}</div>
                <div className="text-right">${item.price}</div>
              </motion.div>
            ))
          ) : (
            <div className="px-6 py-4 text-muted-foreground">No hay medidas rectangulares disponibles</div>
          )}
          
          {/* Sección de Medidas Triangulares */}
          <div className="bg-white px-6 py-3 flex items-center gap-2 border-b border-border">
            <Triangle size={16} className="text-primary" />
            <h3 className="font-medium">Medidas Triangulares</h3>
          </div>
          
          {triangulares.length > 0 ? (
            triangulares.map((item, index) => (
              <motion.div 
                key={`triangular-${index}-${selectedDiameter}`}
                className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200 bg-white"
                variants={itemVariants}
              >
                <div>{item.size}</div>
                <div className="text-right">${item.price}</div>
              </motion.div>
            ))
          ) : (
            <div className="px-6 py-4 text-muted-foreground">No hay medidas triangulares disponibles</div>
          )}
        </div>
      );
    }
    
    // Para todos los demás productos, mostrar lista simple
    return (
      <div className="divide-y divide-border">
        {priceData.length > 0 ? (
          priceData.map((item, index) => (
            <motion.div 
              key={`item-${index}`}
              className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200 bg-white"
              variants={itemVariants}
            >
              <div>{item.size}</div>
              <div className="text-right">${item.price}</div>
            </motion.div>
          ))
        ) : (
          <div className="px-6 py-4 text-muted-foreground">No hay datos disponibles</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Lista de Precios - {productName}</h2>
        <div className="inline-block bg-gray-800 text-white px-3 py-1 rounded-lg">
          <p className="text-sm">
            Precios actualizados al {formattedUpdateDate}
          </p>
        </div>
      </div>
      
      {/* Selector de filtros según el tipo de producto */}
      {showDiameters && (
        <div className="mb-6 flex justify-center">
          <div className="bg-white rounded-lg p-2 border border-border shadow-sm">
            <ToggleGroup type="single" value={selectedDiameter} onValueChange={(value) => value && handleDiameterSelect(value)}>
              {diameterOptions.map((option) => (
                <ToggleGroupItem 
                  key={option.value} 
                  value={option.value}
                  variant="outline"
                  className="px-4"
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      )}
      
      {/* Selector de tipos de clavos */}
      {showNailTypes && (
        <div className="mb-6 flex justify-center">
          <div className="bg-white rounded-lg p-2 border border-border shadow-sm">
            <ToggleGroup type="single" value={selectedNailType} onValueChange={(value) => value && handleNailTypeSelect(value)}>
              {nailTypeOptions.map((option) => (
                <ToggleGroupItem 
                  key={option.value} 
                  value={option.value}
                  variant="outline"
                  className="px-4"
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      )}

      {/* Tabla de precios */}
      <motion.div 
        className="overflow-hidden rounded-xl border border-border bg-white mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={`price-table-${productId}-${selectedDiameter}-${selectedNailType}`}
      >
        <div className="px-6 py-4 border-b border-border bg-white">
          <div className="grid grid-cols-2">
            <div className="font-medium">Medida</div>
            <div className="font-medium text-right">Precio Unitario</div>
          </div>
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando precios...</div>
        ) : renderPriceTable()}
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
              Fabricamos productos a medida según tus necesidades. Tiempo estimado de producción: 24 a 48 hs. 
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
              Podés retirar por 30 de Agosto o coordinar envío. Los plazos de entrega varían según la medida y
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
              Los pagos se realizan al entregar el producto, pueden realizarse por transferencia bancaria, efectivo o con cheque a 15 días como maximo.
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
              Todos los precios incluyen IVA. Se emiten facturas A. En caso de requerir factura A, se solicitará el CUIT correspondiente.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default PriceTable;
