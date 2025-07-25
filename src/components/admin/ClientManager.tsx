import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Eye, Phone, Building, Calendar, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  user_id: string;
  name: string;
  company_name: string;
  company_legal_name?: string;
  cuit: string;
  whatsapp_number?: string;
  created_at: string;
  updated_at: string;
}

const ClientManager = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const navigate = useNavigate();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Client[];
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewHistory = (clientId: string) => {
    navigate(`/admin/clientes/${clientId}/remitos`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando clientes...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gestión de Clientes
        </CardTitle>
        <p className="text-muted-foreground">
          Total de clientes registrados: {clients.length}
        </p>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay clientes registrados</h3>
            <p className="text-muted-foreground">
              Los clientes aparecerán aquí cuando se registren nuevos usuarios en el sistema.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <div key={client.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.company_name}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Cliente
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">CUIT: {client.cuit}</span>
                  </div>
                  {client.whatsapp_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{client.whatsapp_number}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Registrado: {formatDate(client.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedClient(client)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Detalle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalles del Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Información Personal */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Información Personal
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Nombre:</span>
                              <p className="text-muted-foreground">{client.name}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Datos de Empresa */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Datos de la Empresa
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="font-medium">Nombre de la Empresa:</span>
                              <p className="text-muted-foreground">{client.company_name}</p>
                            </div>
                            {client.company_legal_name && (
                              <div>
                                <span className="font-medium">Razón Social:</span>
                                <p className="text-muted-foreground">{client.company_legal_name}</p>
                              </div>
                            )}
                            <div>
                              <span className="font-medium">CUIT:</span>
                              <p className="text-muted-foreground font-mono">{client.cuit}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Contacto */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Información de Contacto
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="font-medium">WhatsApp:</span>
                              <p className="text-muted-foreground">
                                {client.whatsapp_number || 'No especificado'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Fechas */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Historial
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Fecha de Registro:</span>
                              <p className="text-muted-foreground">{formatDate(client.created_at)}</p>
                            </div>
                            <div>
                              <span className="font-medium">Última Actualización:</span>
                              <p className="text-muted-foreground">{formatDate(client.updated_at)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewHistory(client.id)}
                  >
                    <History className="h-3 w-3 mr-1" />
                    Historial
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientManager;