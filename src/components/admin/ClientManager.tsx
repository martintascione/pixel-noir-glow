import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Eye, Phone, Mail, Building, FileText, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  company_legal_name: string;
  company_cuit: string;
  whatsapp_number: string;
  requires_invoice_a: boolean;
  accepts_notifications: boolean;
  created_at: string;
  updated_at: string;
}

const ClientManager = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Cargando clientes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Registrados
          </CardTitle>
          <Badge variant="secondary" className="w-fit">
            {clients.length} cliente{clients.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay clientes registrados aún
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {client.first_name} {client.last_name}
                      </h3>
                      {client.requires_invoice_a && (
                        <Badge variant="outline" className="text-xs">
                          Factura A
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {client.company_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        CUIT: {client.company_cuit}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {client.whatsapp_number || 'No especificado'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Registrado: {formatDate(client.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl text-center">
                          Información Completa del Cliente
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Datos Personales */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Datos Personales
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Nombre:</span>
                              <p className="text-muted-foreground">{client.first_name}</p>
                            </div>
                            <div>
                              <span className="font-medium">Apellido:</span>
                              <p className="text-muted-foreground">{client.last_name}</p>
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
                            <div>
                              <span className="font-medium">Razón Social:</span>
                              <p className="text-muted-foreground">{client.company_legal_name}</p>
                            </div>
                            <div>
                              <span className="font-medium">CUIT:</span>
                              <p className="text-muted-foreground font-mono">{client.company_cuit}</p>
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

                        {/* Preferencias */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Preferencias y Configuración
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              {client.requires_invoice_a ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">
                                {client.requires_invoice_a 
                                  ? 'Requiere factura A' 
                                  : 'No requiere factura A'
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {client.accepts_notifications ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">
                                {client.accepts_notifications 
                                  ? 'Acepta notificaciones' 
                                  : 'No acepta notificaciones'
                                }
                              </span>
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