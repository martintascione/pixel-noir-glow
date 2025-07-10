import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Eye, Trash2, Calendar, DollarSign } from 'lucide-react';
import { getRemitosByClientId, deleteMultipleRemitos, SavedRemito } from '@/services/remitosHistoryService';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const ClientRemitoHistory = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [remitos, setRemitos] = useState<SavedRemito[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRemitos, setSelectedRemitos] = useState<string[]>([]);
  const [clientName, setClientName] = useState<string>('');

  useEffect(() => {
    if (clientId) {
      loadRemitos();
    }
  }, [clientId]);

  const loadRemitos = async () => {
    try {
      setLoading(true);
      const data = await getRemitosByClientId(clientId!);
      setRemitos(data);
      if (data.length > 0 && data[0].client) {
        setClientName(data[0].client.name);
      }
    } catch (error) {
      console.error('Error loading remitos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los remitos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRemito = (remitoId: string) => {
    setSelectedRemitos(prev => 
      prev.includes(remitoId) 
        ? prev.filter(id => id !== remitoId)
        : [...prev, remitoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRemitos.length === remitos.length) {
      setSelectedRemitos([]);
    } else {
      setSelectedRemitos(remitos.map(r => r.id));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteMultipleRemitos(selectedRemitos);
      setRemitos(prev => prev.filter(r => !selectedRemitos.includes(r.id)));
      setSelectedRemitos([]);
      toast({
        title: "Éxito",
        description: `${selectedRemitos.length} remito(s) eliminado(s) correctamente`,
      });
    } catch (error) {
      console.error('Error deleting remitos:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los remitos",
        variant: "destructive",
      });
    }
  };

  const handleViewRemito = (remito: SavedRemito) => {
    navigate(`/admin/remitos/view/${remito.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando historial...</p>
        </div>
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
            onClick={() => navigate('/admin/clientes')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Historial de Remitos</h1>
            <p className="text-muted-foreground">Cliente: {clientName}</p>
          </div>
        </div>

        {selectedRemitos.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Seleccionados ({selectedRemitos.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará permanentemente {selectedRemitos.length} remito(s) seleccionado(s). 
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {remitos.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectedRemitos.length === remitos.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">
            Seleccionar todos ({remitos.length} remitos)
          </span>
        </div>
      )}

      {remitos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No hay remitos</h3>
              <p className="text-muted-foreground mb-4">
                Este cliente aún no tiene remitos generados
              </p>
              <Button onClick={() => navigate('/admin/remitos')}>
                Crear Primer Remito
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {remitos.map((remito) => (
            <Card key={remito.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedRemitos.includes(remito.id)}
                      onCheckedChange={() => handleSelectRemito(remito.id)}
                    />
                    <div>
                      <CardTitle className="text-lg">Remito N° {remito.numero}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(remito.fecha).toLocaleDateString('es-AR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(remito.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {remito.items.length} artículo{remito.items.length !== 1 ? 's' : ''}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRemito(remito)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Artículos:</h4>
                  {remito.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.cantidad}x {item.medida}</span>
                      <span className="text-muted-foreground">{item.producto}</span>
                      <span className="font-semibold">{formatCurrency(item.precio_total)}</span>
                    </div>
                  ))}
                  {remito.items.length > 3 && (
                    <div className="text-sm text-muted-foreground text-center py-1">
                      +{remito.items.length - 3} artículo{remito.items.length - 3 !== 1 ? 's' : ''} más...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};