import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Calculator } from 'lucide-react';
import { getRemitoById, SavedRemito } from '@/services/remitosHistoryService';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { generateRemitoJPG, downloadFile } from '@/services/remitoService';
import { supabase } from '@/integrations/supabase/client';

export const RemitoDetailView = () => {
  const { remitoId } = useParams<{ remitoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [remito, setRemito] = useState<SavedRemito | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [costData, setCostData] = useState<any>(null);

  useEffect(() => {
    if (remitoId) {
      loadRemito();
    }
  }, [remitoId]);

  useEffect(() => {
    if (remito) {
      fetchConfig();
    }
  }, [remito]);

  const fetchConfig = async () => {
    try {
      // Obtener configuración de IVA
      const { data: configData } = await supabase
        .from('general_config')
        .select('iva_rate')
        .maybeSingle();

      // Obtener costos de productos
      const { data: costsData } = await supabase
        .from('product_costs')
        .select('*');

      // Obtener todos los productos para mapear por medida (size)
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, size');

      setCostData({
        ivaRate: configData?.iva_rate || 21,
        productCosts: costsData || [],
        products: productsData || []
      });
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const calculateBusinessAnalysis = () => {
    if (!remito || !costData) {
      return {
        costoTotal: 0,
        gananciaReal: 0,
        ivaCredito: 0,
        ivaDebito: 0,
        ivaNeto: 0
      };
    }

    let costoTotal = 0;
    let ivaDebito = 0;

    // Calcular el costo total del pedido y IVA débito
    remito.items.forEach(item => {
      // Buscar el producto por medida (size) como lo hace RemitosGenerator
      const product = costData.products.find((p: any) => p.size === item.medida);
      
      if (product) {
        // Buscar el costo usando el ID del producto encontrado
        const productCost = costData.productCosts.find((cost: any) => 
          cost.product_id === product.id
        );
        
        if (productCost) {
          const costoTotalItem = productCost.production_cost * item.cantidad;
          costoTotal += costoTotalItem;
          
          // Calcular IVA débito (IVA contenido en el costo)
          const ivaDebitoItem = costoTotalItem * (costData.ivaRate / 100) / (1 + costData.ivaRate / 100);
          ivaDebito += ivaDebitoItem;
        }
      }
    });

    const totalVenta = remito.total;
    const gananciaReal = totalVenta - costoTotal;
    
    // Calcular IVA Crédito (IVA contenido en la venta)
    const ivaCredito = totalVenta * (costData.ivaRate / 100) / (1 + costData.ivaRate / 100);
    
    // IVA Neto = IVA Crédito - IVA Débito
    const ivaNeto = ivaCredito - ivaDebito;

    return {
      costoTotal,
      gananciaReal,
      ivaCredito,
      ivaDebito,
      ivaNeto
    };
  };

  const businessAnalysis = calculateBusinessAnalysis();

  const loadRemito = async () => {
    try {
      setLoading(true);
      const data = await getRemitoById(remitoId!);
      setRemito(data);
    } catch (error) {
      console.error('Error loading remito:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el remito",
        variant: "destructive",
      });
      navigate('/admin/clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    try {
      setGeneratingImage(true);
      const blob = await generateRemitoJPG('remito-detail-view');
      downloadFile(blob, `remito-${remito?.numero}.jpg`);
      toast({
        title: "Éxito",
        description: "Imagen del remito descargada correctamente",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen del remito",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando remito...</p>
        </div>
      </div>
    );
  }

  if (!remito) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Remito no encontrado</h3>
        <p className="text-muted-foreground mb-4">El remito solicitado no existe o fue eliminado</p>
        <Button onClick={() => navigate('/admin/clientes')}>
          Volver a Clientes
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/clientes/${remito.client_id}/remitos`)}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold">Detalle del Remito</h1>
              <p className="text-muted-foreground text-sm sm:text-base truncate">Remito N° {remito.numero}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadImage}
              disabled={generatingImage}
              size="sm"
              className="whitespace-nowrap"
            >
              <Download className="h-4 w-4 mr-2" />
              {generatingImage ? 'Generando...' : 'Descargar'}
            </Button>
          </div>
        </div>

        {/* Remito Preview - Responsive */}
        <div className="w-full overflow-hidden">
          <div className="w-full max-w-md mx-auto">
            <div id="remito-detail-view" className="w-full bg-white shadow-xl border border-gray-200 text-xs sm:text-sm">
              {/* Header Section */}
              <div className="bg-slate-900 text-white p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-6">
                  <div className="flex-1">
                    <h1 className="text-lg sm:text-2xl font-light tracking-widest mb-2 sm:mb-3">REMITO</h1>
                    <div className="space-y-1">
                      <p className="text-slate-300 text-xs">Nro de remito: <span className="text-white font-medium">{remito.numero}</span></p>
                      <p className="text-xs sm:text-sm text-slate-300">Fecha: <span className="text-white font-medium">{new Date(remito.fecha).toLocaleDateString('es-AR')}</span></p>
                    </div>
                  </div>
                  <div className="hidden sm:block border-l border-slate-500 h-20"></div>
                  <div className="text-left text-xs text-slate-300">
                    <p className="font-bold text-white mb-1">HIERROS TASCIONE</p>
                    <p className="mb-1">LUIS MARIA TASCIONE</p>
                    <p className="mb-1">CUIT: 20-21856308-3</p>
                    <p className="mb-1">TUCUMAN 396</p>
                    <p>30 DE AGOSTO</p>
                  </div>
                </div>
              </div>

              {/* Client Section */}
              <div className="p-3 sm:p-6 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Cliente:</h3>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-lg font-semibold text-slate-900">{remito.client?.name}</h4>
                  <p className="text-xs sm:text-sm text-slate-600">{remito.client?.company_name}</p>
                  <p className="text-xs sm:text-sm text-slate-500">CUIT: {remito.client?.cuit}</p>
                </div>
              </div>

              {/* Products Section */}
              <div className="p-3 sm:p-6">
                {/* Table Header - Hidden on mobile, using cards instead */}
                <div className="hidden sm:grid sm:grid-cols-10 gap-6 mb-4 pb-3 border-b-2 border-slate-900">
                  <div className="col-span-4 text-xs font-bold text-slate-900 uppercase text-left">DESCRIPCIÓN</div>
                  <div className="col-span-2 text-xs font-bold text-slate-900 uppercase text-center">CANT.</div>
                  <div className="col-span-2 text-xs font-bold text-slate-900 uppercase text-center">PRECIO UNIT.</div>
                  <div className="col-span-2 text-xs font-bold text-slate-900 uppercase text-center">TOTAL</div>
                </div>

                {/* Products List */}
                <div className="space-y-2 sm:space-y-3">
                  {remito.items.map((item, index) => (
                    <div key={index}>
                      {/* Desktop view */}
                      <div className="hidden sm:grid sm:grid-cols-10 gap-6 py-3 border-b border-slate-100">
                        <div className="col-span-4 text-left">
                          <p className="text-sm font-semibold text-slate-900 mb-1">{item.medida}</p>
                          <p className="text-xs text-slate-600">{item.producto}</p>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-900">
                            {item.cantidad}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <p className="text-sm font-medium text-slate-900">${item.precio_unitario.toFixed(2)}</p>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <p className="text-sm font-bold text-slate-900">${item.precio_total.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Mobile view */}
                      <div className="sm:hidden border-b border-slate-100 pb-2 mb-2">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{item.medida}</p>
                            <p className="text-xs text-slate-600 truncate">{item.producto}</p>
                          </div>
                          <div className="text-right ml-2 flex-shrink-0">
                            <p className="text-xs font-bold text-slate-900">${item.precio_total.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Cant: {item.cantidad}</span>
                          <span>Unit: ${item.precio_unitario.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Section */}
              <div className="p-3 sm:p-6 pt-2 sm:pt-4 bg-slate-50">
                <div className="flex justify-center">
                  <div className="w-full max-w-xs sm:w-72">
                    <div className="space-y-2 mb-2 sm:mb-4">
                      <div className="flex justify-between items-center py-2 border-t-2 border-slate-900">
                        <span className="text-sm sm:text-base font-bold text-slate-900">TOTAL:</span>
                        <span className="text-lg sm:text-xl font-bold text-slate-900">${remito.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Administración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Panel de Administración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Valor Total de la Venta */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="font-medium text-sm sm:text-base">Valor Total de la Venta:</span>
                <span className="font-bold text-lg">{formatCurrency(remito.total)}</span>
              </div>
              
              <div className="border-t pt-3 space-y-3">
                {/* Costo Total del Pedido */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="font-medium text-red-600 text-sm sm:text-base">Costo Total del Pedido:</span>
                  <span className="font-bold text-red-600 text-lg sm:text-base">{formatCurrency(businessAnalysis.costoTotal)}</span>
                </div>
                
                {/* Ganancia Real */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="font-medium text-green-600 text-sm sm:text-base">Ganancia Real:</span>
                  <span className="font-bold text-green-600 text-lg sm:text-base">{formatCurrency(businessAnalysis.gananciaReal)}</span>
                </div>
                
                <Separator />
                
                {/* Análisis de IVA */}
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-600 text-sm sm:text-base">Análisis de IVA:</h4>
                  
                  {/* IVA Crédito */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="pl-2 text-xs sm:text-sm">IVA Crédito (venta):</span>
                    <span className="text-blue-600 text-sm font-medium">{formatCurrency(businessAnalysis.ivaCredito)}</span>
                  </div>
                  
                  {/* IVA Débito */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="pl-2 text-xs sm:text-sm">IVA Débito (costo):</span>
                    <span className="text-orange-600 text-sm font-medium">{formatCurrency(businessAnalysis.ivaDebito)}</span>
                  </div>
                  
                  {/* IVA Neto */}
                  <div className="flex flex-col sm:flex-row sm:justify-between border-t pt-2 gap-1 sm:gap-0">
                    <span className="font-medium text-xs sm:text-sm">IVA Neto (Crédito - Débito):</span>
                    <span className={`font-bold text-sm ${businessAnalysis.ivaNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(businessAnalysis.ivaNeto)}
                    </span>
                  </div>
                </div>
                
                {/* Nota informativa */}
                {(!costData || businessAnalysis.costoTotal === 0) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700">
                      <strong>Nota:</strong> Para ver cálculos precisos, asegúrate de haber configurado los costos de producción en la sección "Gestión de Costos" del panel de administración.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};