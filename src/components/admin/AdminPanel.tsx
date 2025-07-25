import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calculator } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface AdminPanelData {
  valorTotal: number;
  costoTotal: number;
  gananciaReal: number;
  ivaVenta: number;
}

interface AdminPanelProps {
  data: AdminPanelData;
  showCostNote?: boolean;
  title?: string;
}

export const AdminPanel = ({ data, showCostNote = true, title = "Panel de Administración" }: AdminPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-sm sm:text-base">
          <Calculator className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Valor Total de la Venta */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className="font-medium text-sm sm:text-base">Valor Total de la Venta:</span>
            <span className="font-bold text-lg">{formatCurrency(data.valorTotal)}</span>
          </div>
          
          <div className="border-t pt-3 space-y-3">
            {/* Costo Total del Pedido */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <span className="font-medium text-red-600 text-sm sm:text-base">Costo Total del Pedido:</span>
              <span className="font-bold text-red-600 text-lg sm:text-base">{formatCurrency(data.costoTotal)}</span>
            </div>
            
            {/* Ganancia Real */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <span className="font-medium text-green-600 text-sm sm:text-base">Ganancia Real:</span>
              <span className="font-bold text-green-600 text-lg sm:text-base">{formatCurrency(data.gananciaReal)}</span>
            </div>
            
            <Separator />
            
            {/* IVA de la Venta */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="font-medium text-blue-600 text-sm sm:text-base">IVA de la Venta:</span>
              <span className="font-bold text-blue-600 text-lg sm:text-base">{formatCurrency(data.ivaVenta)}</span>
            </div>
            
            {/* Nota informativa */}
            {showCostNote && data.costoTotal === 0 && (
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
  );
};