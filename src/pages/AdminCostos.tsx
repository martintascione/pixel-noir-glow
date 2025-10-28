import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, History } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProducts } from "@/services/supabaseService";

interface EstribosProduct {
  id: string;
  name: string;
  size: string;
  shape?: string;
  diameter?: string;
}

interface CostBatch {
  id: string;
  nombre: string;
  descripcion: string | null;
  peso_por_metro_lineal: number;
  costo_por_kilo: number;
  created_at: string;
}

interface CostCalculation {
  id: string;
  batch_id: string;
  medida_nombre: string;
  metros_por_unidad: number;
  costo_por_unidad: number;
}

interface MedidaInput {
  medida_nombre: string;
  metros_por_unidad: string;
}

const AdminCostos = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("nueva-tanda");
  const [estribosDisponibles, setEstribosDisponibles] = useState<EstribosProduct[]>([]);
  
  // Form state para nueva tanda
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pesoMetroLineal, setPesoMetroLineal] = useState("");
  const [costoPorKilo, setCostoPorKilo] = useState("");
  const [medidaDoblez, setMedidaDoblez] = useState("6"); // Medida del doblez en cm
  const [medidas, setMedidas] = useState<MedidaInput[]>([
    { medida_nombre: "", metros_por_unidad: "" }
  ]);

  // Función para calcular metros lineales a partir del tamaño
  const calcularMetrosLineales = (size: string, shape?: string): number => {
    // Extraer números del tamaño en cm (ej: "20x35" o "20X35" -> [20, 35])
    const numerosCm = size.toLowerCase().split('x').map(n => parseFloat(n.trim()));
    
    if (numerosCm.length === 0 || numerosCm.some(isNaN)) return 0;

    let centimetrosTotales = 0;

    if (shape?.toLowerCase().includes('cuadrado') || numerosCm.length === 1) {
      // Cuadrado: 4 lados iguales
      // Ejemplo: 20x20 = 20 + 20 + 20 + 20 = 80cm
      centimetrosTotales = 4 * numerosCm[0];
    } else if (shape?.toLowerCase().includes('rectangular') || numerosCm.length === 2) {
      // Rectangular: cada medida aparece 2 veces
      // Ejemplo: 20x35 = 20 + 20 + 35 + 35 = 110cm
      centimetrosTotales = 2 * (numerosCm[0] + numerosCm[1]);
    } else if (shape?.toLowerCase().includes('triangular') || numerosCm.length === 3) {
      // Triangular: suma de los 3 lados
      centimetrosTotales = numerosCm[0] + numerosCm[1] + numerosCm[2];
    } else {
      // Por defecto, rectangular
      centimetrosTotales = numerosCm.length === 2 ? 2 * (numerosCm[0] + numerosCm[1]) : 0;
    }
    
    // Agregar 2 dobleces
    // Ejemplo con doblez de 6cm: 110cm + 6cm + 6cm = 122cm
    const doblezCm = parseFloat(medidaDoblez) || 0;
    centimetrosTotales += 2 * doblezCm;
    
    // Convertir a metros al final
    return centimetrosTotales / 100;
  };

  // Cargar productos de estribos desde Supabase
  useEffect(() => {
    const cargarEstribos = async () => {
      try {
        const productos = await getProducts();
        // Filtrar productos de categorías tipo "estribos"
        const estribos = productos
          .filter(p => p.category?.type === 'estribos')
          .map(p => ({
            id: p.id,
            name: p.name,
            size: p.size || '',
            shape: p.shape,
            diameter: p.diameter
          }));
        setEstribosDisponibles(estribos);
      } catch (error) {
        console.error("Error al cargar estribos:", error);
        toast.error("No se pudieron cargar las medidas de estribos");
      }
    };
    cargarEstribos();
  }, []);

  // Fetch tandas históricas
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['cost-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_batches' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as CostBatch[];
    }
  });

  // Fetch cálculos de una tanda específica
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const { data: calculations = [] } = useQuery({
    queryKey: ['cost-calculations', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const { data, error } = await supabase
        .from('cost_calculations' as any)
        .select('*')
        .eq('batch_id', selectedBatchId)
        .order('medida_nombre');
      
      if (error) throw error;
      return data as unknown as CostCalculation[];
    },
    enabled: !!selectedBatchId
  });

  // Mutación para crear nueva tanda
  const createBatchMutation = useMutation({
    mutationFn: async (batchData: { 
      nombre: string; 
      descripcion: string; 
      peso_por_metro_lineal: number; 
      costo_por_kilo: number;
      medidas: { medida_nombre: string; metros_por_unidad: number }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Crear batch
      const { data: batch, error: batchError } = await supabase
        .from('cost_batches' as any)
        .insert({
          nombre: batchData.nombre,
          descripcion: batchData.descripcion,
          peso_por_metro_lineal: batchData.peso_por_metro_lineal,
          costo_por_kilo: batchData.costo_por_kilo,
          user_id: user.id
        })
        .select()
        .single();

      if (batchError || !batch) throw batchError || new Error("Error al crear batch");

      // Crear cálculos
      const calculations = batchData.medidas.map(m => {
        const costoPorUnidad = batchData.peso_por_metro_lineal * m.metros_por_unidad * batchData.costo_por_kilo;
        return {
          batch_id: (batch as any).id,
          medida_nombre: m.medida_nombre,
          metros_por_unidad: m.metros_por_unidad,
          costo_por_unidad: costoPorUnidad
        };
      });

      const { error: calcError } = await supabase
        .from('cost_calculations' as any)
        .insert(calculations);

      if (calcError) throw calcError;

      return batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-batches'] });
      toast.success("Tanda guardada exitosamente");
      // Reset form
      setNombre("");
      setDescripcion("");
      setPesoMetroLineal("");
      setCostoPorKilo("");
      setMedidas([{ medida_nombre: "", metros_por_unidad: "" }]);
      setActiveTab("historial");
    },
    onError: (error) => {
      toast.error("Error al guardar la tanda: " + error.message);
    }
  });

  const agregarMedida = () => {
    setMedidas([...medidas, { medida_nombre: "", metros_por_unidad: "" }]);
  };

  const seleccionarEstribo = (index: number, estribosId: string) => {
    const estribo = estribosDisponibles.find(e => e.id === estribosId);
    if (estribo) {
      const metrosLineales = calcularMetrosLineales(estribo.size, estribo.shape);
      const nuevasMedidas = [...medidas];
      nuevasMedidas[index] = {
        medida_nombre: `${estribo.name} - ${estribo.size}`,
        metros_por_unidad: metrosLineales.toFixed(4)
      };
      setMedidas(nuevasMedidas);
    }
  };

  const eliminarMedida = (index: number) => {
    setMedidas(medidas.filter((_, i) => i !== index));
  };

  const actualizarMedida = (index: number, field: keyof MedidaInput, value: string) => {
    const nuevasMedidas = [...medidas];
    nuevasMedidas[index][field] = value;
    setMedidas(nuevasMedidas);
  };

  const calcularCostoPorUnidad = (metrosPorUnidad: number): number => {
    const peso = parseFloat(pesoMetroLineal) || 0;
    const costo = parseFloat(costoPorKilo) || 0;
    return peso * metrosPorUnidad * costo;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const peso = parseFloat(pesoMetroLineal);
    const costo = parseFloat(costoPorKilo);
    
    if (!nombre || !peso || !costo) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }

    const medidasValidas = medidas.filter(m => 
      m.medida_nombre.trim() && parseFloat(m.metros_por_unidad) > 0
    );

    if (medidasValidas.length === 0) {
      toast.error("Agregue al menos una medida válida");
      return;
    }

    createBatchMutation.mutate({
      nombre,
      descripcion,
      peso_por_metro_lineal: peso,
      costo_por_kilo: costo,
      medidas: medidasValidas.map(m => ({
        medida_nombre: m.medida_nombre,
        metros_por_unidad: parseFloat(m.metros_por_unidad)
      }))
    });
  };

  const verDetalles = (batchId: string) => {
    setSelectedBatchId(batchId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Cálculo de Costos por Unidad</h1>
            <p className="text-muted-foreground">Gestiona tandas de cálculo y consulta históricos</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nueva-tanda">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Tanda
            </TabsTrigger>
            <TabsTrigger value="historial">
              <History className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Nueva Tanda */}
          <TabsContent value="nueva-tanda" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Tanda de Cálculo</CardTitle>
                <CardDescription>
                  Ingresa los datos de la materia prima y las medidas de estribos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información general */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre de la Tanda *</Label>
                      <Input
                        id="nombre"
                        placeholder="Ej: Proveedor A - Hierro 4,2mm"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        placeholder="Ej: Proveedor X, diámetro 8mm, enero 2025"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        rows={1}
                      />
                    </div>
                  </div>

                  {/* Datos de materia prima */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="peso">Peso por Metro Lineal (kg/m) *</Label>
                      <Input
                        id="peso"
                        type="number"
                        step="0.0001"
                        placeholder="Ej: 0.395"
                        value={pesoMetroLineal}
                        onChange={(e) => setPesoMetroLineal(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="costo">Costo por Kilo ($/kg) *</Label>
                      <Input
                        id="costo"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 1500.00"
                        value={costoPorKilo}
                        onChange={(e) => setCostoPorKilo(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Medida del Doblez */}
                  <div className="space-y-2">
                    <Label htmlFor="medida-doblez">Medida del Doblez (cm)</Label>
                    <Input
                      id="medida-doblez"
                      type="number"
                      step="0.1"
                      placeholder="6"
                      value={medidaDoblez}
                      onChange={(e) => setMedidaDoblez(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cada estribo tiene 2 dobleces. Se agregarán automáticamente al cálculo.
                    </p>
                  </div>

                  {/* Medidas */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Medidas de Estribos</Label>
                      <Button type="button" variant="outline" size="sm" onClick={agregarMedida}>
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Medida
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {medidas.map((medida, index) => {
                        const metros = parseFloat(medida.metros_por_unidad) || 0;
                        const costoCalculado = calcularCostoPorUnidad(metros);
                        
                        return (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="grid gap-4 md:grid-cols-5 items-end">
                                <div className="space-y-2">
                                  <Label>Seleccionar Medida</Label>
                                  <Select onValueChange={(value) => seleccionarEstribo(index, value)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Elegir de la lista" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background z-50">
                                      {estribosDisponibles.map((estribo) => (
                                        <SelectItem key={estribo.id} value={estribo.id}>
                                          {estribo.name} - {estribo.size} - Ø{estribo.diameter}mm
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Nombre/Medida</Label>
                                  <Input
                                    placeholder="Ej: 15x20, 20x30, etc."
                                    value={medida.medida_nombre}
                                    onChange={(e) => actualizarMedida(index, 'medida_nombre', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Metros por Unidad</Label>
                                  <Input
                                    type="number"
                                    step="0.0001"
                                    placeholder="Ej: 0.70"
                                    value={medida.metros_por_unidad}
                                    onChange={(e) => actualizarMedida(index, 'metros_por_unidad', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Costo por Unidad</Label>
                                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                                    <span className="text-sm font-mono">
                                      ${costoCalculado.toFixed(6)}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => eliminarMedida(index)}
                                  disabled={medidas.length === 1}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createBatchMutation.isPending}
                  >
                    {createBatchMutation.isPending ? "Guardando..." : "Guardar Tanda"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historial */}
          <TabsContent value="historial" className="space-y-6">
            {batches.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay tandas guardadas aún. Crea tu primera tanda de cálculo.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {batches.map((batch) => (
                  <Card key={batch.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{batch.nombre}</CardTitle>
                          <CardDescription>
                            {batch.descripcion || "Sin descripción"}
                          </CardDescription>
                          <p className="text-xs text-muted-foreground mt-2">
                            Creado: {new Date(batch.created_at).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => verDetalles(batch.id)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Peso/m:</span>{" "}
                          <span className="font-medium">{batch.peso_por_metro_lineal} kg/m</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Costo/kg:</span>{" "}
                          <span className="font-medium">${batch.costo_por_kilo.toFixed(2)}</span>
                        </div>
                      </div>

                      {selectedBatchId === batch.id && calculations.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="font-semibold mb-3">Cálculos Detallados</h4>
                          <div className="space-y-2">
                            {calculations.map((calc) => (
                              <div key={calc.id} className="grid grid-cols-3 gap-4 text-sm bg-muted/50 p-3 rounded">
                                <div>
                                  <span className="text-muted-foreground">Medida:</span>{" "}
                                  <span className="font-medium">{calc.medida_nombre}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Metros/unidad:</span>{" "}
                                  <span className="font-medium">{calc.metros_por_unidad.toFixed(4)} m</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Costo/unidad:</span>{" "}
                                  <span className="font-medium font-mono">${calc.costo_por_unidad.toFixed(6)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminCostos;
