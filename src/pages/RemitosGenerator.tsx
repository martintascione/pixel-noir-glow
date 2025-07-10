import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Calculator, Download, MessageCircle, UserPlus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getProducts } from '@/services/supabaseService';
import { getClients, createClient, deleteClient, type Client } from '@/services/clientsService';
import { generateRemitoPDF, generateRemitoJPG, sendToWhatsApp, downloadFile, type RemitoData } from '@/services/remitoService';
import { saveImageToGallery, isNativeApp } from '@/services/galleryService';
import { formatCurrency, formatNumber, formatPrice } from '@/utils/formatters';

interface RemitoItem {
  id: string;
  cantidad: number;
  medida: string;
  producto: string;
  precioUnitario: number;
  precioTotal: number;
}

const RemitosGenerator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const remitoRef = useRef<HTMLDivElement>(null);
  
  // Estados del remito
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [manualClient, setManualClient] = useState({
    name: '',
    company_name: '',
    cuit: '',
    whatsapp_number: ''
  });
  const [items, setItems] = useState<RemitoItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    cantidad: '',
    medida: '',
    producto: '',
    precioUnitario: 0
  });
  
  // Estados para nuevo cliente
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    company_name: '',
    company_legal_name: '',
    cuit: '',
    whatsapp_number: ''
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  // Obtener medidas únicas agrupadas por tipo
  const medidasGrouped = React.useMemo(() => {
    const allMedidas = products.map(product => ({
      size: product.size,
      diameter: product.diameter || '',
      shape: product.shape || ''
    }));
    
    const uniqueMedidas = allMedidas.filter((medida, index, self) => 
      index === self.findIndex(m => m.size === medida.size)
    );
    
    const grouped = {
      '4mm': uniqueMedidas.filter(m => m.diameter && (m.diameter.startsWith('4') || m.diameter === '4.2')),
      '6mm': uniqueMedidas.filter(m => m.diameter && m.diameter.startsWith('6')),
      'triangular': uniqueMedidas.filter(m => m.shape?.toLowerCase().includes('triangular')),
      'otros': uniqueMedidas.filter(m => !m.diameter || (!m.diameter.startsWith('4') && !m.diameter.startsWith('6') && !m.shape?.toLowerCase().includes('triangular')))
    };
    
    return grouped;
  }, [products]);

  // Mutation para crear cliente
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowNewClientDialog(false);
      setNewClient({
        name: '',
        company_name: '',
        company_legal_name: '',
        cuit: '',
        whatsapp_number: ''
      });
      toast({
        title: "Éxito",
        description: "Cliente creado correctamente"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al crear cliente: " + error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para eliminar cliente
  const deleteClientMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Éxito",
        description: "Cliente eliminado correctamente"
      });
    }
  });

  // Actualizar producto cuando cambia la medida
  useEffect(() => {
    if (currentItem.medida) {
      const selectedProduct = products.find(p => p.size === currentItem.medida);
      if (selectedProduct) {
        setCurrentItem(prev => ({
          ...prev,
          producto: selectedProduct.name,
          precioUnitario: selectedProduct.price
        }));
      }
    }
  }, [currentItem.medida, products]);

  const addItem = () => {
    if (!currentItem.cantidad || !currentItem.medida || !currentItem.producto) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    const newItem: RemitoItem = {
      id: Date.now().toString(),
      cantidad: parseInt(currentItem.cantidad),
      medida: currentItem.medida,
      producto: currentItem.producto,
      precioUnitario: currentItem.precioUnitario,
      precioTotal: parseInt(currentItem.cantidad) * currentItem.precioUnitario
    };

    setItems([...items, newItem]);
    setCurrentItem({
      cantidad: '',
      medida: '',
      producto: '',
      precioUnitario: 0
    });

    toast({
      title: "Éxito",
      description: "Producto agregado al remito"
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalVenta = items.reduce((sum, item) => sum + item.precioTotal, 0);

  const getCurrentClientData = () => {
    if (selectedClient) {
      return {
        name: selectedClient.name,
        company_name: selectedClient.company_name,
        cuit: selectedClient.cuit,
        whatsapp_number: selectedClient.whatsapp_number
      };
    }
    return manualClient;
  };

  const generateRemitoData = (): RemitoData => {
    return {
      cliente: getCurrentClientData(),
      items,
      total: totalVenta,
      fecha: new Date().toLocaleDateString('es-AR'),
      numero: `R${Date.now().toString().slice(-6)}`
    };
  };

  const handleGeneratePDF = async () => {
    try {
      const remitoData = generateRemitoData();
      const pdfBlob = await generateRemitoPDF(remitoData);
      downloadFile(pdfBlob, `remito_${remitoData.numero}.pdf`);
      toast({
        title: "Éxito",
        description: "PDF generado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar PDF",
        variant: "destructive"
      });
    }
  };

  const handleGenerateJPG = async () => {
    try {
      const jpgBlob = await generateRemitoJPG('remito-preview');
      const remitoData = generateRemitoData();
      downloadFile(jpgBlob, `remito_${remitoData.numero}.jpg`);
      toast({
        title: "Éxito",
        description: "JPG generado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar JPG",
        variant: "destructive"
      });
    }
  };

  const handleSendWhatsApp = async () => {
    const clientData = getCurrentClientData();
    if (!clientData.whatsapp_number) {
      toast({
        title: "Error",
        description: "El cliente no tiene número de WhatsApp",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generar JPG del remito
      const jpgBlob = await generateRemitoJPG('remito-preview');
      const remitoData = generateRemitoData();
      
      // Verificar si estamos en una app nativa (iOS/Android)
      if (isNativeApp()) {
        // Guardar en galería del dispositivo
        await saveImageToGallery(jpgBlob);
        
        // Preparar mensaje para app nativa
        const nativeMessage = `Hola ${clientData.name}, te envío el remito N° ${remitoData.numero} por un total de ${formatCurrency(remitoData.total)}. 

📋 *DETALLE DEL PEDIDO:*
${remitoData.items.map(item => `• ${item.cantidad} x ${item.medida} - ${item.producto} - ${formatCurrency(item.precioTotal)}`).join('\n')}

💰 *TOTAL: ${formatCurrency(remitoData.total)}*

La imagen del remito se guardó en tu galería. Adjúntala desde ahí.

¡Gracias por tu compra! 🙏`;
        
        // Abrir WhatsApp con el mensaje
        sendToWhatsApp(clientData.whatsapp_number, nativeMessage);
        
        toast({
          title: "¡Éxito! 📱",
          description: "Imagen guardada en galería. WhatsApp abierto con mensaje.",
          duration: 5000
        });
      } else {
        // Descargar para navegador web
        downloadFile(jpgBlob, `remito_${remitoData.numero}.jpg`);
        
        // Preparar mensaje para navegador
        const webMessage = `Hola ${clientData.name}, te envío el remito N° ${remitoData.numero} por un total de ${formatCurrency(remitoData.total)}. 

📋 *DETALLE DEL PEDIDO:*
${remitoData.items.map(item => `• ${item.cantidad} x ${item.medida} - ${item.producto} - ${formatCurrency(item.precioTotal)}`).join('\n')}

💰 *TOTAL: ${formatCurrency(remitoData.total)}*

La imagen del remito se descargó automáticamente. Por favor adjúntala a este mensaje.

¡Gracias por tu compra! 🙏`;
        
        // Abrir WhatsApp con el mensaje
        sendToWhatsApp(clientData.whatsapp_number, webMessage);
        
        toast({
          title: "Éxito",
          description: "Imagen descargada y WhatsApp abierto. Adjunta manualmente la imagen descargada.",
          duration: 5000
        });
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: isNativeApp() ? "Error al guardar en galería" : "Error al generar la imagen del remito",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="container mx-auto px-3 py-6 max-w-6xl">
      <div className="mb-6 flex items-center">
        <Link to="/admin" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Generador de Remitos</h1>
      </div>

      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">Generar Remito</TabsTrigger>
          <TabsTrigger value="clients">Gestión de Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Formulario de Remito */}
            <Card>
              <CardHeader>
                <CardTitle>Datos del Remito</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selección de Cliente */}
                <div>
                  <Label>Cliente</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedClient?.id || 'manual'}
                      onValueChange={(value) => {
                        if (value === 'manual') {
                          setSelectedClient(null);
                        } else {
                          const client = clients.find(c => c.id === value);
                          setSelectedClient(client || null);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Ingresar manualmente</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nuevo Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="new-name">Nombre</Label>
                            <Input
                              id="new-name"
                              value={newClient.name}
                              onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-company">Empresa</Label>
                            <Input
                              id="new-company"
                              value={newClient.company_name}
                              onChange={(e) => setNewClient(prev => ({ ...prev, company_name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-legal">Razón Social</Label>
                            <Input
                              id="new-legal"
                              value={newClient.company_legal_name}
                              onChange={(e) => setNewClient(prev => ({ ...prev, company_legal_name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-cuit">CUIT</Label>
                            <Input
                              id="new-cuit"
                              value={newClient.cuit}
                              onChange={(e) => setNewClient(prev => ({ ...prev, cuit: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-whatsapp">WhatsApp</Label>
                            <Input
                              id="new-whatsapp"
                              value={newClient.whatsapp_number}
                              onChange={(e) => setNewClient(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                              placeholder="+54 9 11 1234-5678"
                            />
                          </div>
                          <Button 
                            onClick={() => createClientMutation.mutate(newClient)}
                            disabled={!newClient.name || !newClient.company_name || !newClient.cuit}
                            className="w-full"
                          >
                            Guardar Cliente
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Datos del Cliente (Manual o Seleccionado) */}
                {!selectedClient ? (
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="manual-name">Nombre del Cliente</Label>
                      <Input
                        id="manual-name"
                        value={manualClient.name}
                        onChange={(e) => setManualClient(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ingrese el nombre del cliente"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-company">Empresa</Label>
                      <Input
                        id="manual-company"
                        value={manualClient.company_name}
                        onChange={(e) => setManualClient(prev => ({ ...prev, company_name: e.target.value }))}
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-cuit">CUIT</Label>
                      <Input
                        id="manual-cuit"
                        value={manualClient.cuit}
                        onChange={(e) => setManualClient(prev => ({ ...prev, cuit: e.target.value }))}
                        placeholder="00-00000000-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-whatsapp">WhatsApp</Label>
                      <Input
                        id="manual-whatsapp"
                        value={manualClient.whatsapp_number}
                        onChange={(e) => setManualClient(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                        placeholder="+54 9 11 1234-5678"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded">
                    <h4 className="font-medium">{selectedClient.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedClient.company_name}</p>
                    <p className="text-sm text-muted-foreground">CUIT: {selectedClient.cuit}</p>
                    {selectedClient.whatsapp_number && (
                      <p className="text-sm text-muted-foreground">WhatsApp: {selectedClient.whatsapp_number}</p>
                    )}
                  </div>
                )}

                {/* Agregar Productos */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Agregar Producto</h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cantidad">Cantidad</Label>
                        <Input
                          id="cantidad"
                          type="number"
                          value={currentItem.cantidad}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, cantidad: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="medida">Medida del Estribo</Label>
                        <Select
                          value={currentItem.medida}
                          onValueChange={(value) => setCurrentItem(prev => ({ ...prev, medida: value }))}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Seleccionar medida" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50 max-h-80 overflow-y-auto">
                            {/* Medidas 4mm */}
                            {medidasGrouped['4mm'].length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                  Ø4.2mm
                                </div>
                                {medidasGrouped['4mm'].map((medida) => (
                                  <SelectItem key={`4mm-${medida.size}`} value={medida.size} className="pl-4">
                                    {medida.size} (Ø4.2mm)
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            
                            {/* Separador */}
                            {medidasGrouped['4mm'].length > 0 && medidasGrouped['6mm'].length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            
                            {/* Medidas 6mm */}
                            {medidasGrouped['6mm'].length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                  Ø6mm
                                </div>
                                {medidasGrouped['6mm'].map((medida) => (
                                  <SelectItem key={`6mm-${medida.size}`} value={medida.size} className="pl-4">
                                    {medida.size} (Ø6mm)
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            
                            {/* Separador */}
                            {(medidasGrouped['4mm'].length > 0 || medidasGrouped['6mm'].length > 0) && medidasGrouped['triangular'].length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            
                            {/* Medidas triangulares */}
                            {medidasGrouped['triangular'].length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                  Triangulares
                                </div>
                                {medidasGrouped['triangular'].map((medida) => (
                                  <SelectItem key={`triangular-${medida.size}`} value={medida.size} className="pl-4">
                                    {medida.size}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            
                            {/* Separador */}
                            {(medidasGrouped['4mm'].length > 0 || medidasGrouped['6mm'].length > 0 || medidasGrouped['triangular'].length > 0) && medidasGrouped['otros'].length > 0 && (
                              <div className="border-t my-1" />
                            )}
                            
                            {/* Otros productos */}
                            {medidasGrouped['otros'].length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                  Clavos y Otros
                                </div>
                                {medidasGrouped['otros'].map((medida) => (
                                  <SelectItem key={`otros-${medida.size}`} value={medida.size} className="pl-4">
                                    {medida.size}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Producto (autocompletado)</Label>
                      <Input
                        value={currentItem.producto}
                        disabled
                        placeholder="Se autocompletará al seleccionar medida"
                        className="bg-muted"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Precio Unitario</Label>
                        <Input
                          value={formatCurrency(currentItem.precioUnitario)}
                          disabled
                        />
                      </div>
                      <div>
                        <Label>Precio Total</Label>
                        <Input
                          value={formatCurrency(parseInt(currentItem.cantidad || '0') * currentItem.precioUnitario)}
                          disabled
                        />
                      </div>
                    </div>
                    <Button onClick={addItem} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar al Remito
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview y Acciones */}
            <div className="space-y-6">
              {/* Lista de Productos */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos en el Remito</CardTitle>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No hay productos agregados
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-card">
                          <div className="flex-1">
                            <p className="font-medium">{item.producto}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.cantidad} x {item.medida} - {formatCurrency(item.precioUnitario)} c/u
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{formatCurrency(item.precioTotal)}</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preview del Remito */}
              {items.length > 0 && (
                <div className="w-full max-w-full mx-0 px-0 overflow-hidden">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="px-2 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900">Preview del Remito</h3>
                    </div>
                    <div className="p-0 m-0">
                      {/* Container responsivo para la preview */}
                      <div className="flex justify-center items-center w-full h-auto m-0 p-0">
                        <div className="transform-gpu transition-transform duration-300 scale-[0.5] sm:scale-[0.6] md:scale-[0.7] lg:scale-[0.8] xl:scale-[0.9] origin-center">
                          <div id="remito-preview" ref={remitoRef} className="w-full bg-white shadow-xl border border-gray-200" style={{width: '420px', minWidth: '420px', height: 'auto'}}>
                          {/* Header Section */}
                          <div className="bg-slate-900 text-white p-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h1 className="text-2xl font-light tracking-widest mb-3">REMITO</h1>
                                <div className="space-y-1">
                                  <p className="text-sm text-slate-300">Nro de remito: <span className="text-white font-medium">{generateRemitoData().numero}</span></p>
                                  <p className="text-sm text-slate-300">Fecha: <span className="text-white font-medium">{generateRemitoData().fecha}</span></p>
                                </div>
                              </div>
                              <div className="text-right text-xs text-slate-300">
                                <p className="font-bold text-white text-sm mb-1">HIERROS TASCIONE</p>
                                <p className="mb-1">LUIS MARIA TASCIONE</p>
                                <p>CUIT: 20-21856308-3</p>
                              </div>
                            </div>
                          </div>

                          {/* Client Section */}
                          <div className="p-6 border-b border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cliente:</h3>
                            <div className="space-y-1">
                              <h4 className="text-lg font-semibold text-slate-900">{getCurrentClientData().name}</h4>
                              <p className="text-sm text-slate-600">{getCurrentClientData().company_name}</p>
                              <p className="text-sm text-slate-500">CUIT: {getCurrentClientData().cuit}</p>
                            </div>
                          </div>

                          {/* Products Section */}
                          <div className="p-6">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-2 mb-4 pb-3 border-b-2 border-slate-900">
                              <div className="col-span-1 text-xs font-bold text-slate-900 uppercase text-center">#</div>
                              <div className="col-span-4 text-xs font-bold text-slate-900 uppercase">Descripción</div>
                              <div className="col-span-2 text-xs font-bold text-slate-900 uppercase text-center">Cant.</div>
                              <div className="col-span-2 text-xs font-bold text-slate-900 uppercase text-center">Precio Unit.</div>
                              <div className="col-span-3 text-xs font-bold text-slate-900 uppercase text-center">Total</div>
                            </div>

                            {/* Products List */}
                            <div className="space-y-3">
                              {items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 py-3 border-b border-slate-100">
                                  <div className="col-span-1 text-sm text-slate-600 font-medium text-center">
                                    {String(index + 1).padStart(2, '0')}
                                  </div>
                                  <div className="col-span-4">
                                    <p className="text-sm font-semibold text-slate-900 mb-1">{item.medida}</p>
                                    <p className="text-xs text-slate-600">{item.producto}</p>
                                  </div>
                                  <div className="col-span-2 text-center">
                                    <span className="inline-block bg-slate-100 text-slate-900 px-2 py-1 rounded text-sm font-medium">
                                      {item.cantidad}
                                    </span>
                                  </div>
                                  <div className="col-span-2 text-center">
                                    <p className="text-sm font-medium text-slate-900">${formatPrice(item.precioUnitario)}</p>
                                  </div>
                                  <div className="col-span-3 text-center">
                                    <p className="text-sm font-bold text-slate-900">${formatPrice(item.precioTotal)}</p>
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
                                  <div className="flex justify-between py-2">
                                    <span className="text-sm text-slate-600">Subtotal:</span>
                                    <span className="text-sm font-medium text-slate-900">${formatPrice(totalVenta)}</span>
                                  </div>
                                </div>
                                <div className="border-t-2 border-slate-900 pt-4">
                                  <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-slate-900 uppercase">Total:</span>
                                    <span className="text-xl font-bold text-slate-900">${formatPrice(totalVenta)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="p-6 pt-4 text-center border-t border-slate-200">
                            <p className="text-xs text-slate-500">Precios con IVA incluido</p>
                          </div>
                          </div>
                        </div>
                      </div>

                      {/* Botón de Acción */}
                      <div className="flex justify-center py-2">
                        <Button 
                          onClick={handleSendWhatsApp} 
                          disabled={items.length === 0 || !getCurrentClientData().whatsapp_number}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Enviar por WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel de Administración */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Panel de Administración
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Valor Total de la Venta:</span>
                      <span className="font-bold text-lg">{formatCurrency(totalVenta)}</span>
                    </div>
                    <div className="border-t pt-3 space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Gastos de la Venta:</span>
                        <span>$0.00 *</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ganancia:</span>
                        <span>$0.00 *</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IVA Neto (Crédito - Débito):</span>
                        <span>$0.00 *</span>
                      </div>
                      <p className="text-xs mt-2">
                        * Los cálculos detallados se implementarán con información adicional de la base de datos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay clientes registrados
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {clients.map((client) => (
                      <div key={client.id} className="flex justify-between items-center p-4 border rounded">
                        <div>
                          <h4 className="font-medium">{client.name}</h4>
                          <p className="text-sm text-muted-foreground">{client.company_name}</p>
                          <p className="text-xs text-muted-foreground">CUIT: {client.cuit}</p>
                          {client.whatsapp_number && (
                            <p className="text-xs text-muted-foreground">WhatsApp: {client.whatsapp_number}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteClientMutation.mutate(client.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default RemitosGenerator;