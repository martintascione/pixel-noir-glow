
import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ChevronDown, Square, RectangleHorizontal, Triangle, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getProducts, getCombos } from '@/services/supabaseService';
import { Product, ProductCombo } from '@/types/supabase';

interface DiameterOption {
  value: string;
  label: string;
}

interface PriceTableProps {
  productId?: string;
  productName?: string;
}

const PriceTable = ({ productId = '', productName = 'Productos' }: PriceTableProps) => {
  const { toast } = useToast();
  const [selectedDiameter, setSelectedDiameter] = useState<string>("4.2");
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<ProductCombo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdateDate, setLastUpdateDate] = useState<Date>(new Date());
  const [showAllCombos, setShowAllCombos] = useState(false);
  
  const [openSpecial, setOpenSpecial] = useState(false);
  const [openDelivery, setOpenDelivery] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openBilling, setOpenBilling] = useState(false);

  const diameterOptions: DiameterOption[] = [
    { value: "4.2", label: "4.2 mm" },
    { value: "6", label: "6 mm" },
  ];

  // Cargar datos de Supabase
  useEffect(() => {
    const loadData = async () => {
      if (!productId) return;
      
      setLoading(true);
      try {
        // Cargar productos de la categoría
        const productsData = await getProducts(productId);
        setProducts(productsData);
        
        // Cargar combos de todos los productos de la categoría
        const combosData = await getCombos();
        const categoryCombosList = combosData.filter(combo => 
          productsData.some(product => product.id === combo.product_id)
        );
        setCombos(categoryCombosList);
        
        setLastUpdateDate(new Date());
      } catch (error: any) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [productId, toast]);

  // Manejador para cuando el usuario selecciona un diámetro diferente
  const handleDiameterSelect = (diameter: string) => {
    setSelectedDiameter(diameter);
  };

  const handleContactClick = () => {
    toast({
      title: "Contacto iniciado",
      description: "Redirigiendo a WhatsApp...",
    });
    window.open("https://wa.me/+5491112345678", "_blank");
  };

  const handleQuoteClick = () => {
    toast({
      title: "Solicitud de presupuesto",
      description: "Procesando su solicitud...",
    });
    window.open("https://wa.me/+5491112345678?text=Hola,%20quiero%20un%20presupuesto%20personalizado", "_blank");
  };

  const handleAvailabilityClick = () => {
    toast({
      title: "Consultando disponibilidad",
      description: "Verificando stock...",
    });
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
  
  // Filtrar productos según diámetro seleccionado
  const getFilteredProducts = () => {
    if (productName === 'Estribos') {
      return products.filter(product => product.diameter === selectedDiameter);
    }
    return products;
  };

  // Renderizar tabla de precios
  const renderPriceTable = () => {
    const filteredProducts = getFilteredProducts();
    
    // Caso especial para Estribos: separar por formas
    if (productName === 'Estribos') {
      const cuadrados = filteredProducts.filter(item => item.shape === "Cuadrado");
      const rectangulares = filteredProducts.filter(item => item.shape === "Rectangular");  
      const triangulares = filteredProducts.filter(item => item.shape === "Triangular");
      
      return (
        <div className="divide-y divide-border">
          {/* Sección de Medidas Cuadradas */}
          {cuadrados.length > 0 && (
            <>
              <div className="bg-white px-6 py-3 flex items-center gap-2 border-b border-border">
                <Square size={16} className="text-primary" />
                <h3 className="font-medium">Medidas Cuadradas</h3>
              </div>
              
              {cuadrados.map((item, index) => (
                <motion.div 
                  key={`square-${index}-${selectedDiameter}`}
                  className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200 bg-white"
                  variants={itemVariants}
                >
                  <div className="flex items-center gap-2">
                    <span>{item.size}</span>
                    <span className="text-muted-foreground text-sm">- Ø{item.diameter}mm</span>
                  </div>
                  <div className="text-right">{formatPrice(item.price)}</div>
                </motion.div>
              ))}
            </>
          )}

          {/* Sección de Medidas Rectangulares */}
          {rectangulares.length > 0 && (
            <>
              <div className="bg-white px-6 py-3 flex items-center gap-2 border-b border-border">
                <RectangleHorizontal size={16} className="text-primary" />
                <h3 className="font-medium">Medidas Rectangulares</h3>
              </div>
              
              {rectangulares.map((item, index) => (
                <motion.div 
                  key={`rectangular-${index}-${selectedDiameter}`}
                  className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200 bg-white"
                  variants={itemVariants}
                >
                  <div className="flex items-center gap-2">
                    <span>{item.size}</span>
                    <span className="text-muted-foreground text-sm">- Ø{item.diameter}mm</span>
                  </div>
                  <div className="text-right">{formatPrice(item.price)}</div>
                </motion.div>
              ))}
            </>
          )}
          
          {/* Sección de Medidas Triangulares */}
          {triangulares.length > 0 && (
            <>
              <div className="bg-white px-6 py-3 flex items-center gap-2 border-b border-border">
                <Triangle size={16} className="text-primary" />
                <h3 className="font-medium">Medidas Triangulares</h3>
              </div>
              
              {triangulares.map((item, index) => (
                <motion.div 
                  key={`triangular-${index}-${selectedDiameter}`}
                  className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200 bg-white"
                  variants={itemVariants}
                >
                  <div className="flex items-center gap-2">
                    <span>{item.size}</span>
                    <span className="text-muted-foreground text-sm">- Ø{item.diameter}mm</span>
                  </div>
                  <div className="text-right">{formatPrice(item.price)}</div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      );
    }
    
    // Para todos los demás productos, mostrar lista simple
    return (
      <div className="divide-y divide-border">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item, index) => (
            <motion.div 
              key={`item-${index}`}
              className="grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors duration-200 bg-white"
              variants={itemVariants}
            >
              <div>{item.size}</div>
              <div className="text-right">{formatPrice(item.price)}</div>
            </motion.div>
          ))
        ) : (
          <div className="px-6 py-4 text-muted-foreground">No hay datos disponibles</div>
        )}
      </div>
    );
  };

  // Renderizar combos
  const renderCombos = () => {
    const filteredProducts = getFilteredProducts();
    const productCombos = combos.filter(combo => 
      filteredProducts.some(product => product.id === combo.product_id)
    );

    if (productCombos.length === 0) return null;

    const combosToShow = showAllCombos ? productCombos : productCombos.slice(0, 3);

    const handleBuyClick = (combo: ProductCombo) => {
      const product = filteredProducts.find(p => p.id === combo.product_id);
      const message = `Hola, quiero comprar el combo "${combo.name}" - ${product?.name} ${product?.size} - Cantidad: ${combo.quantity} unidades - Precio: ${formatPrice(combo.price)}`;
      
      toast({
        title: "Redirigiendo a WhatsApp",
        description: "Procesando tu solicitud de compra...",
      });
      
      window.open(`https://wa.me/+5491112345678?text=${encodeURIComponent(message)}`, "_blank");
    };

    return (
      <div className="mb-16">
        <h3 className="text-2xl font-bold mb-8 text-center">Paquetes armados</h3>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combosToShow.map((combo, index) => {
            const product = filteredProducts.find(p => p.id === combo.product_id);
            return (
              <motion.div 
                key={`combo-${index}`}
                className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                variants={itemVariants}
                initial="hidden"
                animate="show"
              >
                {/* Imagen del producto */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <img 
                    src={combo.image_url || "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=400&fit=crop"} 
                    alt={combo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Contenido de la tarjeta */}
                <div className="p-3">
                  <h4 className="font-bold text-sm sm:text-lg mb-2">
                    {combo.name} - Ø{product?.diameter}mm
                  </h4>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg sm:text-2xl font-bold text-primary">{formatPrice(combo.price)}</span>
                      <div className="text-[10px] text-muted-foreground">
                        Sin imp. Nac. ${Math.round(combo.price / 1.21).toLocaleString('es-AR')}
                      </div>
                      {combo.discount_percentage > 0 && (
                        <div className="text-xs sm:text-sm text-green-600 font-medium">
                          {combo.discount_percentage}% OFF
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Botón de comprar */}
                  <Button 
                    onClick={() => handleBuyClick(combo)}
                    className="w-full bg-primary text-white hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base py-2"
                  >
                    <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
                    Comprar
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Botón Ver Más */}
        {productCombos.length > 3 && (
          <div className="flex justify-center mt-8">
            <Button 
              onClick={() => setShowAllCombos(!showAllCombos)}
              variant="outline"
              className="px-8 py-2"
            >
              {showAllCombos ? 'Ver menos' : `Ver más (${productCombos.length - 3} más)`}
            </Button>
          </div>
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
        <div className="flex items-center justify-center gap-2 mt-2">
          <Check className="w-5 h-5 text-green-500" />
          <p className="text-sm text-muted-foreground">
            Precios con IVA incluido
          </p>
        </div>
      </div>
      
      {/* Selector de diámetros solo para Estribos */}
      {productName === 'Estribos' && (
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

      {/* Tabla de precios unitarios */}
      <motion.div 
        className="overflow-hidden rounded-xl border border-border bg-white mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={`price-table-${productId}-${selectedDiameter}`}
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

      {/* Sección de Combos y Cajas - Formato Tarjeta */}
      {renderCombos()}

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
