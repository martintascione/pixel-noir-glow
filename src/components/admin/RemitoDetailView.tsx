import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { getRemitoById, SavedRemito } from '@/services/remitosHistoryService';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { generateRemitoJPG, downloadFile } from '@/services/remitoService';

export const RemitoDetailView = () => {
  const { remitoId } = useParams<{ remitoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [remito, setRemito] = useState<SavedRemito | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    if (remitoId) {
      loadRemito();
    }
  }, [remitoId]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/clientes/${remito.client_id}/remitos`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalle del Remito</h1>
            <p className="text-muted-foreground">Remito N° {remito.numero}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadImage}
            disabled={generatingImage}
          >
            <Download className="h-4 w-4 mr-2" />
            {generatingImage ? 'Generando...' : 'Descargar'}
          </Button>
        </div>
      </div>

      {/* Remito Preview - Misma estructura que en RemitosGenerator */}
      <div className="flex justify-center">
        <div className="w-full max-w-[420px] mx-auto">
          <div id="remito-detail-view" className="w-[420px] bg-white shadow-xl border border-gray-200" style={{
            width: '420px',
            maxWidth: '420px',
            minWidth: '420px'
          }}>
            {/* Header Section */}
            <div className="bg-slate-900 text-white p-6">
              <div className="flex justify-between items-start gap-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-light tracking-widest mb-3">REMITO</h1>
                  <div className="space-y-1">
                    <p className="text-slate-300 text-xs">Nro de remito: <span className="text-white font-medium">{remito.numero}</span></p>
                    <p className="text-sm text-slate-300">Fecha: <span className="text-white font-medium">{new Date(remito.fecha).toLocaleDateString('es-AR')}</span></p>
                  </div>
                </div>
                <div className="border-l border-slate-500 h-20"></div>
                <div className="flex-1 text-left text-xs text-slate-300 whitespace-nowrap">
                  <p className="font-bold text-white mb-1 whitespace-nowrap">HIERROS TASCIONE</p>
                  <p className="mb-1 whitespace-nowrap">LUIS MARIA TASCIONE</p>
                  <p className="mb-1 whitespace-nowrap">CUIT: 20-21856308-3</p>
                  <p className="mb-1 whitespace-nowrap">TUCUMAN 396</p>
                  <p className="whitespace-nowrap">30 DE AGOSTO</p>
                </div>
              </div>
            </div>

            {/* Client Section */}
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cliente:</h3>
              <div className="space-y-1">
                <h4 className="text-lg font-semibold text-slate-900">{remito.client?.name}</h4>
                <p className="text-sm text-slate-600">{remito.client?.company_name}</p>
                <p className="text-sm text-slate-500">CUIT: {remito.client?.cuit}</p>
              </div>
            </div>

            {/* Products Section */}
            <div className="p-6">
              {/* Table Header */}
              <div className="grid grid-cols-10 gap-6 mb-4 pb-3 border-b-2 border-slate-900">
                <div className="col-span-4 text-xs font-bold text-slate-900 uppercase text-left">DESCRIPCIÓN</div>
                <div className="col-span-2 text-xs font-bold text-slate-900 uppercase text-center">CANT.</div>
                <div className="col-span-2 text-xs font-bold text-slate-900 uppercase text-center">PRECIO UNIT.</div>
                <div className="col-span-2 text-xs font-bold text-slate-900 uppercase text-center">TOTAL</div>
              </div>

              {/* Products List */}
              <div className="space-y-3">
                {remito.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-10 gap-6 py-3 border-b border-slate-100">
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
                ))}
              </div>
            </div>

            {/* Total Section */}
            <div className="p-6 pt-4 bg-slate-50">
              <div className="flex justify-center">
                <div className="w-72">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center py-2 border-t-2 border-slate-900">
                      <span className="text-base font-bold text-slate-900">TOTAL:</span>
                      <span className="text-xl font-bold text-slate-900">${remito.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};