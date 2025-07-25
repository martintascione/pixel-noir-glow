import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEstribosData } from "@/hooks/useEstribosData";
import { FormularioProveedores } from "@/components/costos/FormularioProveedores";
import { FormularioEstribos } from "@/components/costos/FormularioEstribos";
import { ConfiguracionVenta } from "@/components/costos/ConfiguracionVenta";
import { PreciosPorUnidad } from "@/components/costos/PreciosPorUnidad";
import { ComparacionPrecios } from "@/components/costos/ComparacionPrecios";
import { SimulacionVentas } from "@/components/costos/SimulacionVentas";

const AdminCostos = () => {
  const {
    proveedores,
    estribos,
    preciosPorUnidad,
    configuracion,
    loading,
    setConfiguracion,
    agregarProveedor,
    agregarEstribo,
    eliminarProveedor,
    eliminarEstribo,
    actualizarConfiguracion,
    actualizarPrecioPorUnidad,
    calcularDatos,
    calcularDatosPorUnidad,
    calcularSimulacionVentas,
    calcularSimulacionVentasPorUnidad
  } = useEstribosData();

  const calculosDetallados = calcularDatos();
  const calculosDetalladosPorUnidad = calcularDatosPorUnidad();
  const simulacionVentas = calcularSimulacionVentas();
  const simulacionVentasPorUnidad = calcularSimulacionVentasPorUnidad();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-3">
                <Calculator className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">
                  Análisis de Costos de Estribos
                </h1>
              </div>
              <p className="text-muted-foreground">
                Gestiona proveedores, estribos y analiza precios de venta
              </p>
            </div>
          </div>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="proveedores" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
            <TabsTrigger value="estribos">Estribos</TabsTrigger>
            <TabsTrigger value="configuracion">Configuración</TabsTrigger>
            <TabsTrigger value="precios-unidad">Precios por Unidad</TabsTrigger>
            <TabsTrigger value="comparacion">Comparación</TabsTrigger>
            <TabsTrigger value="simulacion">Simulación</TabsTrigger>
          </TabsList>

          <TabsContent value="proveedores" className="space-y-6">
            <FormularioProveedores
              proveedores={proveedores}
              onAgregarProveedor={agregarProveedor}
              onEliminarProveedor={eliminarProveedor}
            />
          </TabsContent>

          <TabsContent value="estribos" className="space-y-6">
            <FormularioEstribos
              estribos={estribos}
              proveedores={proveedores}
              onAgregarEstribo={agregarEstribo}
              onEliminarEstribo={eliminarEstribo}
            />
          </TabsContent>

          <TabsContent value="configuracion" className="space-y-6">
            <ConfiguracionVenta
              configuracion={configuracion}
              onActualizar={actualizarConfiguracion}
            />
          </TabsContent>

          <TabsContent value="precios-unidad" className="space-y-6">
            <PreciosPorUnidad
              preciosPorUnidad={preciosPorUnidad}
              estribos={estribos}
              onActualizar={actualizarPrecioPorUnidad}
            />
          </TabsContent>

          <TabsContent value="comparacion" className="space-y-6">
            <ComparacionPrecios
              calculos={calculosDetallados}
              calculosPorUnidad={calculosDetalladosPorUnidad}
            />
          </TabsContent>

          <TabsContent value="simulacion" className="space-y-6">
            <SimulacionVentas
              simulacion={simulacionVentas}
              simulacionPorUnidad={simulacionVentasPorUnidad}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminCostos;