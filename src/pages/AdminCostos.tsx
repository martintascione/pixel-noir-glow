import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, History, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
  peso_por_metro_lineal_38?: number | null;
  costo_por_kilo_38?: number | null;
  peso_por_metro_lineal_55?: number | null;
  costo_por_kilo_55?: number | null;
  created_at: string;
}

interface CostCalculation {
  id: string;
  batch_id: string;
  medida_nombre: string;
  metros_por_unidad: number;
  costo_por_unidad: number;
  diametro_real?: number | null;
}

type DiametroReal = 3.8 | 5.5;

interface MedidaInput {
  medida_nombre: string;
  metros_por_unidad: string;
  product_id?: string;
  diametro_real: DiametroReal;
}

// Mapea el diámetro comercial del producto al diámetro real del hierro
const inferDiametroReal = (diameterStr?: string): DiametroReal => {
  const d = parseFloat((diameterStr || '').replace(',', '.'));
  if (!isFinite(d) || d <= 0) return 3.8;
  // Ø ≤ 4.5mm comercial → hierro real 3.8mm; resto → 5.5mm
  return d <= 4.5 ? 3.8 : 5.5;
};

const ACTIVE_BATCH_KEY = 'active_cost_batch_id';

const dedupeProductCostUpdates = <T extends { product_id: string }>(updates: T[]): T[] =>
  Array.from(new Map(updates.map(update => [update.product_id, update])).values());

const normalizeMedida = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();

const matchEstribo = (medidaNombre: string, estribos: { id: string; name: string; size: string; diameter?: string }[]) => {
  const target = normalizeMedida(medidaNombre);
  return estribos.find(e => {
    const diamStr = e.diameter ? String(e.diameter).replace(/mm/i, '').trim() : '';
    const candidates = [
      `${e.name} - ${e.size}${diamStr ? ` - Ø${diamStr}mm` : ''}`,
      `${e.name} - ${e.size}`,
    ].map(normalizeMedida);
    return candidates.includes(target);
  });
};


const AdminCostos = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("nueva-tanda");
  const [estribosDisponibles, setEstribosDisponibles] = useState<EstribosProduct[]>([]);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_BATCH_KEY)
  );
  
  // Form state para nueva tanda
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pesoMetroLineal38, setPesoMetroLineal38] = useState("");
  const [costoPorKilo38, setCostoPorKilo38] = useState("");
  const [pesoMetroLineal55, setPesoMetroLineal55] = useState("");
  const [costoPorKilo55, setCostoPorKilo55] = useState("");
  const [medidaDoblez, setMedidaDoblez] = useState("6"); // Medida del doblez en cm
  const [medidas, setMedidas] = useState<MedidaInput[]>([
    { medida_nombre: "", metros_por_unidad: "", diametro_real: 3.8 }
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

  // Helpers para obtener peso/costo del diámetro real
  const getPesoForDiam = (d: DiametroReal): number =>
    parseFloat(d === 3.8 ? pesoMetroLineal38 : pesoMetroLineal55) || 0;
  const getCostoForDiam = (d: DiametroReal): number =>
    parseFloat(d === 3.8 ? costoPorKilo38 : costoPorKilo55) || 0;

  // Mutación para crear/actualizar tanda
  const saveBatchMutation = useMutation({
    mutationFn: async (batchData: {
      nombre: string;
      descripcion: string;
      peso_por_metro_lineal_38: number;
      costo_por_kilo_38: number;
      peso_por_metro_lineal_55: number;
      costo_por_kilo_55: number;
      medidas: { medida_nombre: string; metros_por_unidad: number; product_id?: string; diametro_real: DiametroReal }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const costoFor = (d: DiametroReal, metros: number) => {
        const peso = d === 3.8 ? batchData.peso_por_metro_lineal_38 : batchData.peso_por_metro_lineal_55;
        const costo = d === 3.8 ? batchData.costo_por_kilo_38 : batchData.costo_por_kilo_55;
        return peso * metros * costo;
      };

      const buildCalcs = (batchId: string) => batchData.medidas.map(m => ({
        batch_id: batchId,
        medida_nombre: m.medida_nombre,
        metros_por_unidad: m.metros_por_unidad,
        costo_por_unidad: costoFor(m.diametro_real, m.metros_por_unidad),
        diametro_real: m.diametro_real,
        product_id: m.product_id ?? null,
      }));

      let batchId: string;

      // Compatibilidad: mantenemos peso_por_metro_lineal/costo_por_kilo legacy con los valores de 3.8mm
      const legacyPayload = {
        peso_por_metro_lineal: batchData.peso_por_metro_lineal_38,
        costo_por_kilo: batchData.costo_por_kilo_38,
        peso_por_metro_lineal_38: batchData.peso_por_metro_lineal_38,
        costo_por_kilo_38: batchData.costo_por_kilo_38,
        peso_por_metro_lineal_55: batchData.peso_por_metro_lineal_55,
        costo_por_kilo_55: batchData.costo_por_kilo_55,
      };

      if (editingBatchId) {
        const { error: batchError } = await supabase
          .from('cost_batches' as any)
          .update({
            nombre: batchData.nombre,
            descripcion: batchData.descripcion,
            ...legacyPayload,
          })
          .eq('id', editingBatchId);
        if (batchError) throw batchError;

        const { error: deleteError } = await supabase
          .from('cost_calculations' as any)
          .delete()
          .eq('batch_id', editingBatchId);
        if (deleteError) throw deleteError;

        batchId = editingBatchId;
      } else {
        const { data: batch, error: batchError } = await supabase
          .from('cost_batches' as any)
          .insert({
            nombre: batchData.nombre,
            descripcion: batchData.descripcion,
            ...legacyPayload,
            user_id: user.id,
          })
          .select()
          .single();
        if (batchError || !batch) throw batchError || new Error("Error al crear batch");
        batchId = (batch as any).id;
      }

      const { error: calcError } = await supabase
        .from('cost_calculations' as any)
        .insert(buildCalcs(batchId));
      if (calcError) throw calcError;

      // Determinar si esta tanda es la activa (o lo será si es la primera)
      const currentActive = localStorage.getItem(ACTIVE_BATCH_KEY);
      const willBeActive = !currentActive || currentActive === batchId;
      if (!currentActive) {
        localStorage.setItem(ACTIVE_BATCH_KEY, batchId);
      }

      // Sincronizar costos a Gestión de Productos (product_costs) SOLO si es la tanda activa
      const updates = dedupeProductCostUpdates(batchData.medidas
        .filter(m => m.product_id)
        .map(m => ({
          product_id: m.product_id!,
          production_cost: costoFor(m.diametro_real, m.metros_por_unidad),
          profit_margin: 0
        })));

      let syncedCount = 0;
      if (willBeActive && updates.length > 0) {
        // Preservar profit_margin existente
        const productIds = updates.map(u => u.product_id);
        const { data: existing } = await supabase
          .from('product_costs')
          .select('product_id, profit_margin')
          .in('product_id', productIds);

        const marginMap = new Map((existing || []).map((e: any) => [e.product_id, e.profit_margin]));
        const finalUpdates = updates.map(u => ({
          ...u,
          profit_margin: marginMap.get(u.product_id) ?? 0
        }));

        const { error: upsertError } = await supabase
          .from('product_costs')
          .upsert(finalUpdates, { onConflict: 'product_id' });
        if (upsertError) throw upsertError;
        syncedCount = finalUpdates.length;
      }

      return { id: batchId, syncedCount, willBeActive };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['cost-batches'] });
      setActiveBatchId(localStorage.getItem(ACTIVE_BATCH_KEY));
      const baseMsg = editingBatchId ? "Tanda actualizada exitosamente" : "Tanda guardada exitosamente";
      const syncMsg = result.syncedCount > 0
        ? ` · ${result.syncedCount} costo(s) sincronizado(s) con Productos`
        : (!result.willBeActive ? ' · (no es la tanda activa, no se sincronizó)' : '');
      toast.success(baseMsg + syncMsg);
      resetForm();
      setActiveTab("historial");
    },
    onError: (error) => {
      toast.error("Error al guardar la tanda: " + error.message);
    }
  });

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setPesoMetroLineal38("");
    setCostoPorKilo38("");
    setPesoMetroLineal55("");
    setCostoPorKilo55("");
    setMedidaDoblez("6");
    setMedidas([{ medida_nombre: "", metros_por_unidad: "", diametro_real: 3.8 }]);
    setEditingBatchId(null);
  };

  const agregarMedida = () => {
    setMedidas([...medidas, { medida_nombre: "", metros_por_unidad: "", diametro_real: 3.8 }]);
  };

  const seleccionarEstribo = (index: number, estribosId: string) => {
    const estribo = estribosDisponibles.find(e => e.id === estribosId);
    if (estribo) {
      const metrosLineales = calcularMetrosLineales(estribo.size, estribo.shape);
      const diamSuffix = estribo.diameter ? ` - Ø${estribo.diameter}mm` : '';
      const nuevasMedidas = [...medidas];
      nuevasMedidas[index] = {
        medida_nombre: `${estribo.name} - ${estribo.size}${diamSuffix}`,
        metros_por_unidad: metrosLineales.toFixed(4),
        product_id: estribo.id,
        diametro_real: inferDiametroReal(estribo.diameter),
      };
      setMedidas(nuevasMedidas);
    }
  };

  const eliminarMedida = (index: number) => {
    setMedidas(medidas.filter((_, i) => i !== index));
  };

  const actualizarMedida = (index: number, field: 'medida_nombre' | 'metros_por_unidad', value: string) => {
    const nuevasMedidas = [...medidas];
    nuevasMedidas[index] = { ...nuevasMedidas[index], [field]: value };
    setMedidas(nuevasMedidas);
  };

  const cambiarDiametroMedida = (index: number, d: DiametroReal) => {
    const nuevasMedidas = [...medidas];
    nuevasMedidas[index] = { ...nuevasMedidas[index], diametro_real: d };
    setMedidas(nuevasMedidas);
  };

  const calcularCostoPorUnidad = (metrosPorUnidad: number, diametro: DiametroReal): number => {
    return getPesoForDiam(diametro) * metrosPorUnidad * getCostoForDiam(diametro);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const peso38 = parseFloat(pesoMetroLineal38);
    const costo38 = parseFloat(costoPorKilo38);
    const peso55 = parseFloat(pesoMetroLineal55);
    const costo55 = parseFloat(costoPorKilo55);

    if (!nombre || !peso38 || !costo38 || !peso55 || !costo55) {
      toast.error("Complete todos los campos obligatorios (peso y costo para ambos diámetros)");
      return;
    }

    const medidasValidas = medidas.filter(m =>
      m.medida_nombre.trim() && parseFloat(m.metros_por_unidad) > 0
    );

    if (medidasValidas.length === 0) {
      toast.error("Agregue al menos una medida válida");
      return;
    }

    saveBatchMutation.mutate({
      nombre,
      descripcion,
      peso_por_metro_lineal_38: peso38,
      costo_por_kilo_38: costo38,
      peso_por_metro_lineal_55: peso55,
      costo_por_kilo_55: costo55,
      medidas: medidasValidas.map(m => ({
        medida_nombre: m.medida_nombre,
        metros_por_unidad: parseFloat(m.metros_por_unidad),
        product_id: m.product_id,
        diametro_real: m.diametro_real,
      }))
    });
  };

  const cargarTandaParaEditar = async (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    // Cargar cálculos de la tanda
    const { data: calcs, error } = await supabase
      .from('cost_calculations' as any)
      .select('*')
      .eq('batch_id', batchId);

    if (error) {
      toast.error("Error al cargar la tanda");
      return;
    }

    // Llenar el formulario (fallback a campo legacy si los nuevos no están)
    setEditingBatchId(batchId);
    setNombre(batch.nombre);
    setDescripcion(batch.descripcion || "");
    setPesoMetroLineal38((batch.peso_por_metro_lineal_38 ?? batch.peso_por_metro_lineal).toString());
    setCostoPorKilo38((batch.costo_por_kilo_38 ?? batch.costo_por_kilo).toString());
    setPesoMetroLineal55((batch.peso_por_metro_lineal_55 ?? batch.peso_por_metro_lineal).toString());
    setCostoPorKilo55((batch.costo_por_kilo_55 ?? batch.costo_por_kilo).toString());

    if (calcs && calcs.length > 0) {
      setMedidas(calcs.map((calc: any) => {
        const matched = matchEstribo(calc.medida_nombre, estribosDisponibles);
        const diametro_real: DiametroReal =
          calc.diametro_real === 5.5 ? 5.5
          : calc.diametro_real === 3.8 ? 3.8
          : inferDiametroReal(matched?.diameter);
        return {
          medida_nombre: calc.medida_nombre,
          metros_por_unidad: calc.metros_por_unidad.toString(),
          product_id: matched?.id,
          diametro_real,
        };
      }));
    }

    setActiveTab("nueva-tanda");
    toast.success("Tanda cargada para edición");
  };

  const verDetalles = (batchId: string) => {
    setSelectedBatchId(batchId);
  };

  // Activar una tanda: la marca como "activa" y sincroniza sus costos a product_costs
  const activarTanda = async (batchId: string) => {
    try {
      const batch = batches.find(b => b.id === batchId);
      if (!batch) return;

      // Cargar cálculos de la tanda
      const { data: calcs, error } = await supabase
        .from('cost_calculations' as any)
        .select('*')
        .eq('batch_id', batchId);

      if (error) throw error;

      // Resolver product_id: prioridad al guardado en cost_calculations.product_id, fallback al match por nombre
      const mapped = (calcs || []).map((calc: any) => {
        const directId: string | null = calc.product_id ?? null;
        const matched = directId
          ? estribosDisponibles.find(e => e.id === directId) ?? null
          : matchEstribo(calc.medida_nombre, estribosDisponibles) ?? null;
        return { calc, matched, productId: directId ?? matched?.id ?? null };
      });
      const unmatched = mapped.filter(m => !m.productId).map(m => m.calc.medida_nombre);
      if (unmatched.length > 0) {
        console.warn('[activarTanda] Medidas sin match con productos:', unmatched);
      }
      const updates = dedupeProductCostUpdates(
        mapped
          .filter(m => m.productId)
          .map(m => ({
            product_id: m.productId as string,
            production_cost: m.calc.costo_por_unidad,
          }))
      );

      let syncedCount = 0;
      if (updates.length > 0) {
        // Preservar profit_margin existente
        const productIds = updates.map(u => u.product_id);
        const { data: existing } = await supabase
          .from('product_costs')
          .select('product_id, profit_margin')
          .in('product_id', productIds);

        const marginMap = new Map((existing || []).map((e: any) => [e.product_id, e.profit_margin]));
        const finalUpdates = updates.map(u => ({
          ...u,
          profit_margin: marginMap.get(u.product_id) ?? 0
        }));

        const { error: upsertError } = await supabase
          .from('product_costs')
          .upsert(finalUpdates, { onConflict: 'product_id' });
        if (upsertError) throw upsertError;
        syncedCount = finalUpdates.length;
        if (unmatched.length > 0) {
          toast.warning(`${unmatched.length} medida(s) sin producto asociado`, {
            description: unmatched.slice(0, 3).join(', ') + (unmatched.length > 3 ? '…' : ''),
          });
        }
      }

      localStorage.setItem(ACTIVE_BATCH_KEY, batchId);
      setActiveBatchId(batchId);
      toast.success(`Tanda "${batch.nombre}" activada · ${syncedCount} costo(s) sincronizado(s)`);
    } catch (err: any) {
      toast.error("Error al activar la tanda: " + err.message);
    }
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Cálculo de Costos por Unidad</h1>
            <p className="text-sm md:text-base text-muted-foreground">Gestiona tandas de cálculo y consulta históricos</p>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{editingBatchId ? "Editar Tanda de Cálculo" : "Crear Nueva Tanda de Cálculo"}</CardTitle>
                    <CardDescription>
                      {editingBatchId ? "Modifica los datos de la tanda existente" : "Ingresa los datos de la materia prima y las medidas de estribos"}
                    </CardDescription>
                  </div>
                  {editingBatchId && (
                    <Button variant="outline" onClick={resetForm}>
                      Cancelar Edición
                    </Button>
                  )}
                </div>
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

                  {/* Datos de materia prima – Hierro 3.8mm (comercial 4.2mm) */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-sm">Hierro Ø3.8mm <span className="text-muted-foreground font-normal">(comercial 4.2mm)</span></h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="peso-38">Peso por Metro Lineal (kg/m) *</Label>
                        <Input
                          id="peso-38"
                          type="number"
                          step="0.0001"
                          placeholder="Ej: 0.088"
                          value={pesoMetroLineal38}
                          onChange={(e) => setPesoMetroLineal38(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="costo-38">Costo por Kilo ($/kg) *</Label>
                        <Input
                          id="costo-38"
                          type="number"
                          step="0.01"
                          placeholder="Ej: 1500.00"
                          value={costoPorKilo38}
                          onChange={(e) => setCostoPorKilo38(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Datos de materia prima – Hierro 5.5mm (comercial 6mm) */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-sm">Hierro Ø5.5mm <span className="text-muted-foreground font-normal">(comercial 6mm)</span></h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="peso-55">Peso por Metro Lineal (kg/m) *</Label>
                        <Input
                          id="peso-55"
                          type="number"
                          step="0.0001"
                          placeholder="Ej: 0.187"
                          value={pesoMetroLineal55}
                          onChange={(e) => setPesoMetroLineal55(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="costo-55">Costo por Kilo ($/kg) *</Label>
                        <Input
                          id="costo-55"
                          type="number"
                          step="0.01"
                          placeholder="Ej: 1500.00"
                          value={costoPorKilo55}
                          onChange={(e) => setCostoPorKilo55(e.target.value)}
                          required
                        />
                      </div>
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
                        const costoCalculado = calcularCostoPorUnidad(metros, medida.diametro_real);

                        return (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="grid gap-4 md:grid-cols-6 items-end">
                                 <div className="space-y-2">
                                   <Label>Seleccionar Medida</Label>
                                   <Select onValueChange={(value) => {
                                     if (value === "manual") {
                                       const nuevasMedidas = [...medidas];
                                       nuevasMedidas[index] = { medida_nombre: "", metros_por_unidad: "", diametro_real: medida.diametro_real };
                                       setMedidas(nuevasMedidas);
                                     } else {
                                       seleccionarEstribo(index, value);
                                     }
                                   }}>
                                     <SelectTrigger>
                                       <SelectValue placeholder="Elegir de la lista o manual" />
                                     </SelectTrigger>
                                     <SelectContent className="bg-background z-50">
                                       <SelectItem value="manual" className="font-semibold text-primary">
                                         ✏️ Ingresar manualmente
                                       </SelectItem>
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
                                  <Label>Diámetro Hierro</Label>
                                  <Select
                                    value={String(medida.diametro_real)}
                                    onValueChange={(v) => cambiarDiametroMedida(index, parseFloat(v) as DiametroReal)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background z-50">
                                      <SelectItem value="3.8">Ø3.8mm (com. 4.2)</SelectItem>
                                      <SelectItem value="5.5">Ø5.5mm (com. 6)</SelectItem>
                                    </SelectContent>
                                  </Select>
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
                    disabled={saveBatchMutation.isPending}
                  >
                    {saveBatchMutation.isPending ? "Guardando..." : (editingBatchId ? "Actualizar Tanda" : "Guardar Tanda")}
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
                  <Card key={batch.id} className={activeBatchId === batch.id ? "border-primary border-2" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle>{batch.nombre}</CardTitle>
                            {activeBatchId === batch.id && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3" /> Activa
                              </span>
                            )}
                          </div>
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
                          <label className="flex items-center gap-2 mt-3 cursor-pointer text-sm">
                            <Checkbox
                              checked={activeBatchId === batch.id}
                              onCheckedChange={(checked) => {
                                if (checked) activarTanda(batch.id);
                              }}
                              disabled={activeBatchId === batch.id}
                            />
                            <span>Usar esta lista de precios para los cálculos</span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cargarTandaParaEditar(batch.id)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verDetalles(batch.id)}
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div className="rounded border p-2">
                          <div className="font-semibold mb-1">Ø3.8mm <span className="text-muted-foreground font-normal">(com. 4.2)</span></div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <div><span className="text-muted-foreground">Peso/m:</span> <span className="font-medium">{(batch.peso_por_metro_lineal_38 ?? batch.peso_por_metro_lineal)} kg/m</span></div>
                            <div><span className="text-muted-foreground">Costo/kg:</span> <span className="font-medium">${Number(batch.costo_por_kilo_38 ?? batch.costo_por_kilo).toFixed(2)}</span></div>
                          </div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="font-semibold mb-1">Ø5.5mm <span className="text-muted-foreground font-normal">(com. 6)</span></div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <div><span className="text-muted-foreground">Peso/m:</span> <span className="font-medium">{(batch.peso_por_metro_lineal_55 ?? batch.peso_por_metro_lineal)} kg/m</span></div>
                            <div><span className="text-muted-foreground">Costo/kg:</span> <span className="font-medium">${Number(batch.costo_por_kilo_55 ?? batch.costo_por_kilo).toFixed(2)}</span></div>
                          </div>
                        </div>
                      </div>

                      {selectedBatchId === batch.id && calculations.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="font-semibold mb-3">Cálculos Detallados</h4>
                          <div className="space-y-2">
                            {calculations.map((calc) => (
                              <div key={calc.id} className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/50 p-3 rounded">
                                <div>
                                  <span className="text-muted-foreground">Medida:</span>{" "}
                                  <span className="font-medium">{calc.medida_nombre}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Ø Hierro:</span>{" "}
                                  <span className="font-medium">{calc.diametro_real ? `Ø${calc.diametro_real}mm` : '—'}</span>
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
