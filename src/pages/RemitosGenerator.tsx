import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Calculator, Download, MessageCircle, UserPlus, Edit, Trash2, History, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getProducts } from '@/services/supabaseService';
import { supabase } from '@/integrations/supabase/client';
import { getClients, createClient, deleteClient, updateClient, type Client } from '@/services/clientsService';
import { generateRemitoPDF, generateRemitoJPG, sendToWhatsApp, downloadFile, type RemitoData } from '@/services/remitoService';
import { saveRemitoToDatabase } from '@/services/remitosHistoryService';
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
  const navigate = useNavigate();
  const location = useLocation();
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

  // Estados para editar cliente
  const [showEditClientDialog, setShowEditClientDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState({
    name: '',
    company_name: '',
    company_legal_name: '',
    cuit: '',
    whatsapp_number: ''
  });
  const {
    data: products = []
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts()
  });
  const {
    data: clients = []
  } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients
  });

  // Query para obtener datos de costos
  const { data: costData } = useQuery({
    queryKey: ['cost-data'],
    queryFn: async () => {
      // Obtener configuración de IVA
      const { data: generalConfig } = await supabase
        .from('general_config')
        .select('iva_rate')
        .limit(1)
        .single();

      // Obtener costos de productos
      const { data: productCosts } = await supabase
        .from('product_costs')
        .select('*');

      return {
        ivaRate: generalConfig?.iva_rate || 21,
        productCosts: productCosts || []
      };
    }
  });

  // Función para extraer el número de la medida para ordenamiento
  const extractMeasureNumber = (size: string) => {
    const match = size.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Función para detectar medidas triangulares (3 dimensiones, ej: 10x10x10)
  const isTriangularMeasure = (size: string) => {
    const dimensionCount = (size.match(/x/gi) || []).length;
    return dimensionCount >= 2; // 3 dimensiones = 2 "x"
  };

  // Obtener medidas únicas agrupadas por tipo
  const medidasGrouped = React.useMemo(() => {
    const allMedidas = products.map(product => ({
      size: product.size,
      diameter: product.diameter || '',
      shape: product.shape || ''
    }));
    
    // Filtrar únicos por combinación de size + diameter + shape
    const uniqueMedidas = allMedidas.filter((medida, index, self) => 
      index === self.findIndex(m => 
        m.size === medida.size && 
        m.diameter === medida.diameter && 
        m.shape === medida.shape
      )
    );

    // Separar medidas triangulares y especiales
    const triangularMedidas = uniqueMedidas.filter(m => isTriangularMeasure(m.size));
    const especialesMedidas = uniqueMedidas.filter(m => m.shape === "Medidas Especiales");
    const normalMedidas = uniqueMedidas.filter(m => !isTriangularMeasure(m.size) && m.shape !== "Medidas Especiales");

    // Agrupar y ordenar medidas normales
    const grouped = {
      '4mm': normalMedidas
        .filter(m => m.diameter && (m.diameter.startsWith('4') || m.diameter === '4.2'))
        .sort((a, b) => extractMeasureNumber(a.size) - extractMeasureNumber(b.size)),
      '6mm': normalMedidas
        .filter(m => m.diameter && (m.diameter.startsWith('6') || m.diameter === '6'))
        .sort((a, b) => extractMeasureNumber(a.size) - extractMeasureNumber(b.size)),
      'otros': normalMedidas
        .filter(m => !m.diameter || (!m.diameter.startsWith('4') && m.diameter !== '4.2' && !m.diameter.startsWith('6') && m.diameter !== '6'))
        .sort((a, b) => extractMeasureNumber(a.size) - extractMeasureNumber(b.size)),
      'triangular': triangularMedidas
        .sort((a, b) => {
          // Ordenar triangulares primero por diámetro (4.2, luego 6), luego por medida
          const diameterA = a.diameter || '999';
          const diameterB = b.diameter || '999';
          
          if (diameterA === '4.2' && diameterB !== '4.2') return -1;
          if (diameterB === '4.2' && diameterA !== '4.2') return 1;
          if (diameterA === '6' && diameterB !== '6' && diameterB !== '4.2') return -1;
          if (diameterB === '6' && diameterA !== '6' && diameterA !== '4.2') return 1;
          
          if (diameterA === diameterB) {
            return extractMeasureNumber(a.size) - extractMeasureNumber(b.size);
          }
          
          return diameterA.localeCompare(diameterB);
        }),
      'especiales': especialesMedidas
        .sort((a, b) => extractMeasureNumber(a.size) - extractMeasureNumber(b.size))
    };
    
    return grouped;
  }, [products]);

  // Mutation para crear cliente
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['clients']
      });
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
    onError: error => {
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
      queryClient.invalidateQueries({
        queryKey: ['clients']
      });
      toast({
        title: "Éxito",
        description: "Cliente eliminado correctamente"
      });
    }
  });

  // Mutation para actualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Client> }) => updateClient(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['clients']
      });
      setShowEditClientDialog(false);
      setEditingClient(null);
      toast({
        title: "Éxito",
        description: "Cliente actualizado correctamente"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al actualizar cliente: " + error.message,
        variant: "destructive"
      });
    }
  });

  // Función para abrir el diálogo de edición
  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setEditClient({
      name: client.name,
      company_name: client.company_name,
      company_legal_name: client.company_legal_name || '',
      cuit: client.cuit,
      whatsapp_number: client.whatsapp_number || ''
    });
    setShowEditClientDialog(true);
  };

  // Función para guardar cambios del cliente
  const handleSaveEditClient = () => {
    if (!editingClient) return;

    updateClientMutation.mutate({
      id: editingClient.id,
      updates: editClient
    });
  };

  // Actualizar producto cuando cambia la medida
  useEffect(() => {
    if (currentItem.medida) {
      // Verificar si la medida incluye información de diámetro
      if (currentItem.medida.includes('-Ø')) {
        // Formato: "12x12-Ø6mm" -> extraer size y diameter
        const [size, diameterPart] = currentItem.medida.split('-Ø');
        const diameter = diameterPart.replace('mm', '');
        
        // Buscar producto por size y diameter exactos
        const selectedProduct = products.find(p => 
          p.size === size && p.diameter === diameter
        );
        
        if (selectedProduct) {
          setCurrentItem(prev => ({
            ...prev,
            producto: selectedProduct.name,
            precioUnitario: selectedProduct.price
          }));
        }
      } else {
        // Para productos sin diámetro (clavos, etc.)
        const selectedProduct = products.find(p => p.size === currentItem.medida);
        if (selectedProduct) {
          setCurrentItem(prev => ({
            ...prev,
            producto: selectedProduct.name,
            precioUnitario: selectedProduct.price
          }));
        }
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

  // Calcular costo total y análisis de ganancia
  const calculateBusinessAnalysis = () => {
    if (!costData || items.length === 0) {
      return {
        costoTotal: 0,
        gananciaReal: 0,
        ivaVenta: 0
      };
    }

    let costoTotal = 0;

    items.forEach(item => {
      // Encontrar el producto correspondiente
      let product;
      if (item.medida.includes('-Ø')) {
        // Formato: "12x12-Ø6mm" -> extraer size y diameter
        const [size, diameterPart] = item.medida.split('-Ø');
        const diameter = diameterPart.replace('mm', '');
        product = products.find(p => p.size === size && p.diameter === diameter);
      } else {
        // Para productos sin diámetro (clavos, etc.)
        product = products.find(p => p.size === item.medida);
      }
      
      if (product) {
        // Obtener el costo de producción
        const productCost = costData.productCosts.find(c => c.product_id === product.id);
        if (productCost) {
          const costoTotalItem = productCost.production_cost * item.cantidad;
          costoTotal += costoTotalItem;
        }
      }
    });

    // Ganancia real = Total venta - Costo total
    const gananciaReal = totalVenta - costoTotal;
    
    // Calcular IVA de la venta
    const ivaVenta = totalVenta * (costData.ivaRate / 100) / (1 + costData.ivaRate / 100);

    return {
      costoTotal,
      gananciaReal,
      ivaVenta
    };
  };

  const businessAnalysis = calculateBusinessAnalysis();
  
  // Función para formatear la medida con diámetro
  const formatMedidaWithDiameter = (medida: string) => {
    if (medida.includes('-Ø')) {
      // Formato: "12x12-Ø6mm" -> mostrar como "12x12 Ø6mm"
      return medida.replace('-Ø', ' Ø');
    }
    return medida;
  };
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
  const handleShareRemito = async () => {
    try {
      const jpgBlob = await generateRemitoJPG('remito-preview');
      const remitoData = generateRemitoData();
      
      // Convertir el blob a un archivo
      const file = new File([jpgBlob], `remito_${remitoData.numero}.jpg`, { type: 'image/jpeg' });
      
      // Verificar si la Web Share API está disponible y soporta archivos
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Remito ${remitoData.numero}`,
          text: `Remito para ${getCurrentClientData().name} - Total: ${formatCurrency(remitoData.total)}`,
          files: [file]
        });
        
        toast({
          title: "Compartido exitosamente 📤",
          description: "La imagen del remito ha sido compartida"
        });
      } else {
        toast({
          title: "Compartir no disponible",
          description: "Tu navegador no soporta compartir archivos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sharing remito:', error);
      toast({
        title: "Error",
        description: "No se pudo compartir la imagen del remito",
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
      const remitoData = generateRemitoData();
      
      // Preparar mensaje para WhatsApp
      const message = `Hola ${clientData.name}, te envío el remito N° ${remitoData.numero} por un total de ${formatCurrency(remitoData.total)}.`;

      // Abrir WhatsApp con el mensaje (sin generar imagen)
      sendToWhatsApp(clientData.whatsapp_number, message);
      
      toast({
        title: "WhatsApp abierto 💬",
        description: "Chat abierto con el cliente. Adjunta manualmente la imagen si es necesario.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al abrir WhatsApp",
        variant: "destructive"
      });
    }
  };

  const handleSaveAndShareRemito = async () => {
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Debes seleccionar un cliente para guardar el remito",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Agrega al menos un producto al remito",
        variant: "destructive"
      });
      return;
    }

    try {
      // 1. Generar los datos del remito UNA SOLA VEZ
      const remitoData = generateRemitoData();
      console.log('Saving remito to database:', { remitoData, selectedClient });
      
      // 2. Actualizar temporalmente el preview con el número correcto
      const previewElement = document.querySelector('#remito-preview .text-white.font-medium');
      const originalNumber = previewElement?.textContent;
      if (previewElement) {
        previewElement.textContent = remitoData.numero;
      }
      
      // 3. Guardar remito en el historial de la base de datos
      const remitoId = await saveRemitoToDatabase(remitoData, selectedClient.id);
      console.log('Remito saved with ID:', remitoId);
      
      // 4. Generar imagen JPG (ahora con el número correcto)
      const jpgBlob = await generateRemitoJPG('remito-preview');
      
      // 5. Restaurar el preview original
      if (previewElement && originalNumber) {
        previewElement.textContent = originalNumber;
      }
      
      // 6. Intentar compartir la imagen directamente
      const file = new File([jpgBlob], `remito_${remitoData.numero}.jpg`, { type: 'image/jpeg' });
      
      // Verificar si la Web Share API está disponible y soporta archivos
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Remito ${remitoData.numero}`,
          text: `Hola ${getCurrentClientData().name}, te envío el remito N° ${remitoData.numero} por un total de ${formatCurrency(remitoData.total)}.`,
          files: [file]
        });
        
        toast({
          title: "¡Éxito! 💾📤",
          description: "Remito guardado en historial y compartido exitosamente",
          duration: 4000
        });
      } else {
        // Si no se puede compartir, solo notificar que se guardó en el historial
        toast({
          title: "¡Éxito! 💾",
          description: "Remito guardado en historial. Tu navegador no soporta compartir archivos.",
          duration: 4000
        });
      }
      
    } catch (error) {
      console.error('Error saving remito:', error);
      toast({
        title: "Error",
        description: "Error al guardar el remito: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };
  return <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="container mx-auto px-3 py-6 max-w-6xl">
      <div className="mb-6 flex items-center">
        <Link to="/admin" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Generador de Remitos</h1>
      </div>

      <Tabs defaultValue={location.state?.activeTab || "generator"} className="space-y-6">
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
                    <Select value={selectedClient?.id || 'manual'} onValueChange={value => {
                      if (value === 'manual') {
                        setSelectedClient(null);
                      } else {
                        const client = clients.find(c => c.id === value);
                        setSelectedClient(client || null);
                      }
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Ingresar manualmente</SelectItem>
                        {clients.map(client => <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.company_name}
                          </SelectItem>)}
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
                            <Input id="new-name" value={newClient.name} onChange={e => setNewClient(prev => ({
                              ...prev,
                              name: e.target.value
                            }))} />
                          </div>
                          <div>
                            <Label htmlFor="new-company">Empresa</Label>
                            <Input id="new-company" value={newClient.company_name} onChange={e => setNewClient(prev => ({
                              ...prev,
                              company_name: e.target.value
                            }))} />
                          </div>
                          <div>
                            <Label htmlFor="new-legal">Razón Social</Label>
                            <Input id="new-legal" value={newClient.company_legal_name} onChange={e => setNewClient(prev => ({
                              ...prev,
                              company_legal_name: e.target.value
                            }))} />
                          </div>
                          <div>
                            <Label htmlFor="new-cuit">CUIT</Label>
                            <Input id="new-cuit" value={newClient.cuit} onChange={e => setNewClient(prev => ({
                              ...prev,
                              cuit: e.target.value
                            }))} />
                          </div>
                          <div>
                            <Label htmlFor="new-whatsapp">WhatsApp</Label>
                            <Input id="new-whatsapp" value={newClient.whatsapp_number} onChange={e => setNewClient(prev => ({
                              ...prev,
                              whatsapp_number: e.target.value
                            }))} placeholder="+54 9 11 1234-5678" />
                          </div>
                          <Button onClick={() => createClientMutation.mutate(newClient)} disabled={!newClient.name || !newClient.company_name || !newClient.cuit} className="w-full">
                            Guardar Cliente
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Datos del Cliente (Manual o Seleccionado) */}
                {!selectedClient ? <div className="grid gap-4">
                    <div>
                      <Label htmlFor="manual-name">Nombre del Cliente</Label>
                      <Input id="manual-name" value={manualClient.name} onChange={e => setManualClient(prev => ({
                      ...prev,
                      name: e.target.value
                    }))} placeholder="Ingrese el nombre del cliente" />
                    </div>
                    <div>
                      <Label htmlFor="manual-company">Empresa</Label>
                      <Input id="manual-company" value={manualClient.company_name} onChange={e => setManualClient(prev => ({
                      ...prev,
                      company_name: e.target.value
                    }))} placeholder="Nombre de la empresa" />
                    </div>
                    <div>
                      <Label htmlFor="manual-cuit">CUIT</Label>
                      <Input id="manual-cuit" value={manualClient.cuit} onChange={e => setManualClient(prev => ({
                      ...prev,
                      cuit: e.target.value
                    }))} placeholder="00-00000000-0" />
                    </div>
                    <div>
                      <Label htmlFor="manual-whatsapp">WhatsApp</Label>
                      <Input id="manual-whatsapp" value={manualClient.whatsapp_number} onChange={e => setManualClient(prev => ({
                      ...prev,
                      whatsapp_number: e.target.value
                    }))} placeholder="+54 9 11 1234-5678" />
                    </div>
                  </div> : <div className="bg-muted p-4 rounded">
                    <h4 className="font-medium">{selectedClient.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedClient.company_name}</p>
                    <p className="text-sm text-muted-foreground">CUIT: {selectedClient.cuit}</p>
                    {selectedClient.whatsapp_number && <p className="text-sm text-muted-foreground">WhatsApp: {selectedClient.whatsapp_number}</p>}
                  </div>}

                {/* Agregar Productos */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Agregar Producto</h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cantidad">Cantidad</Label>
                        <Input id="cantidad" type="number" value={currentItem.cantidad} onChange={e => setCurrentItem(prev => ({
                          ...prev,
                          cantidad: e.target.value
                        }))} placeholder="0" />
                      </div>
                      <div>
                        <Label htmlFor="medida">Medida del Estribo</Label>
                        <Select value={currentItem.medida} onValueChange={value => setCurrentItem(prev => ({
                          ...prev,
                          medida: value
                        }))}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Seleccionar medida" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50 max-h-80 overflow-y-auto">
                            {/* Medidas 4mm */}
                            {medidasGrouped['4mm'].length > 0 && <>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                  Ø4.2mm
                                </div>
                                {medidasGrouped['4mm'].map(medida => {
                                  const displayValue = `${medida.size}-Ø${medida.diameter}mm`;
                                  return (
                                    <SelectItem key={`4mm-${medida.size}-${medida.diameter}`} value={displayValue} className="pl-4">
                                      {medida.size} (Ø{medida.diameter}mm)
                                    </SelectItem>
                                  );
                                })}
                              </>}
                            
                            {/* Separador */}
                            {medidasGrouped['4mm'].length > 0 && medidasGrouped['6mm'].length > 0 && <div className="border-t my-1" />}
                            
                            {/* Medidas 6mm */}
                            {medidasGrouped['6mm'].length > 0 && <>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                  Ø6mm
                                </div>
                                {medidasGrouped['6mm'].map(medida => {
                                  const displayValue = `${medida.size}-Ø${medida.diameter}mm`;
                                  return (
                                    <SelectItem key={`6mm-${medida.size}-${medida.diameter}`} value={displayValue} className="pl-4">
                                      {medida.size} (Ø{medida.diameter}mm)
                                    </SelectItem>
                                  );
                                })}
                              </>}
                            
                            {/* Separador */}
                            {(medidasGrouped['4mm'].length > 0 || medidasGrouped['6mm'].length > 0) && medidasGrouped['triangular'].length > 0 && <div className="border-t my-1" />}
                            
                            {/* Medidas triangulares */}
                            {medidasGrouped['triangular'].length > 0 && <>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                  Triangulares
                                </div>
                                {medidasGrouped['triangular'].map(medida => {
                                  const displayValue = medida.diameter ? `${medida.size}-Ø${medida.diameter}mm` : medida.size;
                                  return (
                                    <SelectItem key={`triangular-${medida.size}-${medida.diameter || 'no-diameter'}`} value={displayValue} className="pl-4">
                                      {medida.size}{medida.diameter ? ` (Ø${medida.diameter}mm)` : ''}
                                    </SelectItem>
                                  );
                                })}
                              </>}
                             
                            {/* Separador */}
                            {(medidasGrouped['4mm'].length > 0 || medidasGrouped['6mm'].length > 0 || medidasGrouped['triangular'].length > 0) && medidasGrouped['especiales'].length > 0 && <div className="border-t my-1" />}
                            
                            {/* Medidas Especiales */}
                            {medidasGrouped['especiales'].length > 0 && <>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                  Medidas Especiales
                                </div>
                                {medidasGrouped['especiales'].map(medida => {
                                  const displayValue = medida.diameter ? `${medida.size}-Ø${medida.diameter}mm` : medida.size;
                                  return (
                                    <SelectItem key={`especiales-${medida.size}-${medida.diameter || 'no-diameter'}`} value={displayValue} className="pl-4">
                                      {medida.size}{medida.diameter ? ` (Ø${medida.diameter}mm)` : ''}
                                    </SelectItem>
                                  );
                                })}
                              </>}
                            
                            {/* Separador */}
                            {(medidasGrouped['4mm'].length > 0 || medidasGrouped['6mm'].length > 0 || medidasGrouped['triangular'].length > 0 || medidasGrouped['especiales'].length > 0) && medidasGrouped['otros'].length > 0 && <div className="border-t my-1" />}
                            
                            {/* Otros productos */}
                            {medidasGrouped['otros'].length > 0 && <>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                  Clavos y Otros
                                </div>
                                {medidasGrouped['otros'].map(medida => <SelectItem key={`otros-${medida.size}`} value={medida.size} className="pl-4">
                                    {medida.size}
                                  </SelectItem>)}
                              </>}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Producto (autocompletado)</Label>
                      <Input value={currentItem.producto} disabled placeholder="Se autocompletará al seleccionar medida" className="bg-muted" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Precio Unitario</Label>
                        <Input value={formatCurrency(currentItem.precioUnitario)} disabled />
                      </div>
                      <div>
                        <Label>Precio Total</Label>
                        <Input value={formatCurrency(parseInt(currentItem.cantidad || '0') * currentItem.precioUnitario)} disabled />
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
                  {items.length === 0 ? <p className="text-muted-foreground text-center py-4">
                      No hay productos agregados
                    </p> : <div className="space-y-2">
                      {items.map(item => <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-card">
                          <div className="flex-1">
                            <p className="font-medium">{item.producto}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.cantidad} x {formatMedidaWithDiameter(item.medida)} - {formatCurrency(item.precioUnitario)} c/u
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{formatCurrency(item.precioTotal)}</span>
                            <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>
                              ×
                            </Button>
                          </div>
                        </div>)}
                    </div>}
                </CardContent>
              </Card>

              {/* Preview del Remito */}
              {items.length > 0 && <Card>
                  <CardHeader>
                    <CardTitle>Preview del Remito</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4">
                    {/* Container responsivo para la preview - Reducido visualmente */}
                    <div className="w-full overflow-hidden">
                      <div className="flex justify-center">
                        <div className="w-full max-w-[300px] mx-auto flex justify-center">
                          <div 
                            id="remito-preview" 
                            ref={remitoRef} 
                            className="w-[420px] bg-white shadow-xl border border-gray-200" 
                            style={{
                              width: '420px',
                              maxWidth: '420px',
                              minWidth: '420px',
                              transform: 'scale(0.71)',
                              transformOrigin: 'center center',
                              margin: '-60px auto'
                            }}
                          >
                          {/* Header Section */}
                          <div className="bg-slate-900 text-white p-6">
                            <div className="flex justify-between items-start gap-6">
                              <div className="flex-1">
                                <h1 className="text-2xl font-light tracking-widest mb-3">REMITO</h1>
                                <div className="space-y-1">
                                  <p className="text-slate-300 text-xs">Nro de remito: <span className="text-white font-medium">{generateRemitoData().numero}</span></p>
                                  <p className="text-sm text-slate-300">Fecha: <span className="text-white font-medium">{generateRemitoData().fecha}</span></p>
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
                              <h4 className="text-lg font-semibold text-slate-900">{getCurrentClientData().name}</h4>
                              <p className="text-sm text-slate-600">{getCurrentClientData().company_name}</p>
                              <p className="text-sm text-slate-500">CUIT: {getCurrentClientData().cuit}</p>
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
                              {items.map((item, index) => <div key={item.id} className="grid grid-cols-10 gap-6 py-3 border-b border-slate-100">
                                  <div className="col-span-4 text-left">
                                    <p className="text-sm font-semibold text-slate-900 mb-1">{formatMedidaWithDiameter(item.medida)}</p>
                                    <p className="text-xs text-slate-600">{item.producto}</p>
                                  </div>
                                  <div className="col-span-2 flex items-center justify-center">
                                    <span className="text-sm font-medium text-slate-900">
                                      {item.cantidad}
                                    </span>
                                  </div>
                                  <div className="col-span-2 flex items-center justify-center">
                                    <p className="text-sm font-medium text-slate-900">${formatPrice(item.precioUnitario)}</p>
                                  </div>
                                  <div className="col-span-2 flex items-center justify-center">
                                    <p className="text-sm font-bold text-slate-900">${formatPrice(item.precioTotal)}</p>
                                  </div>
                                </div>)}
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
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex flex-col gap-3 py-4">
                      <Button onClick={handleSaveAndShareRemito} disabled={items.length === 0 || !selectedClient} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Calculator className="h-4 w-4 mr-2" />
                        Guardar y Compartir
                      </Button>
                    </div>
                  </CardContent>
                </Card>}

              {/* Panel de Administración */}
              <AdminPanel 
                data={{
                  valorTotal: totalVenta,
                  costoTotal: businessAnalysis.costoTotal,
                  gananciaReal: businessAnalysis.gananciaReal,
                  ivaVenta: businessAnalysis.ivaVenta
                }}
                showCostNote={!costData || businessAnalysis.costoTotal === 0}
              />
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
                {clients.length === 0 ? <p className="text-center text-muted-foreground py-8">
                    No hay clientes registrados
                  </p> : <div className="grid gap-4">
                    {clients.map(client => <div key={client.id} className="flex justify-between items-start p-4 border rounded">
                        <div className="flex-1">
                          <h4 className="font-medium">{client.name}</h4>
                          <p className="text-sm text-muted-foreground">{client.company_name}</p>
                          <p className="text-xs text-muted-foreground">CUIT: {client.cuit}</p>
                          {client.whatsapp_number && <p className="text-xs text-muted-foreground">WhatsApp: {client.whatsapp_number}</p>}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {/* Fila superior: Botón de Historial */}
                          <div className="flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/admin/clientes/${client.id}/remitos`)}
                              className="w-28 h-8 text-xs"
                            >
                              <History className="h-4 w-4 mr-1" />
                              Ver Remitos
                            </Button>
                          </div>
                          {/* Fila inferior: Botones de Editar y Borrar */}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditClient(client)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteClientMutation.mutate(client.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>)}
                  </div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar cliente */}
      <Dialog open={showEditClientDialog} onOpenChange={setShowEditClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input 
                id="edit-name" 
                value={editClient.name} 
                onChange={e => setEditClient(prev => ({
                  ...prev,
                  name: e.target.value
                }))} 
              />
            </div>
            <div>
              <Label htmlFor="edit-company">Empresa</Label>
              <Input 
                id="edit-company" 
                value={editClient.company_name} 
                onChange={e => setEditClient(prev => ({
                  ...prev,
                  company_name: e.target.value
                }))} 
              />
            </div>
            <div>
              <Label htmlFor="edit-legal">Razón Social</Label>
              <Input 
                id="edit-legal" 
                value={editClient.company_legal_name} 
                onChange={e => setEditClient(prev => ({
                  ...prev,
                  company_legal_name: e.target.value
                }))} 
              />
            </div>
            <div>
              <Label htmlFor="edit-cuit">CUIT</Label>
              <Input 
                id="edit-cuit" 
                value={editClient.cuit} 
                onChange={e => setEditClient(prev => ({
                  ...prev,
                  cuit: e.target.value
                }))} 
              />
            </div>
            <div>
              <Label htmlFor="edit-whatsapp">WhatsApp</Label>
              <Input 
                id="edit-whatsapp" 
                value={editClient.whatsapp_number} 
                onChange={e => setEditClient(prev => ({
                  ...prev,
                  whatsapp_number: e.target.value
                }))} 
                placeholder="+54 9 11 1234-5678" 
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveEditClient} 
                disabled={!editClient.name || !editClient.company_name || !editClient.cuit || updateClientMutation.isPending} 
                className="flex-1"
              >
                {updateClientMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditClientDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>;
};
export default RemitosGenerator;