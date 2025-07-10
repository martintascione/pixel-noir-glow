import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Proveedor {
  id: string;
  nombre: string;
  precioPorKg: number;
}

export interface Estribo {
  id: string;
  medida: string;
  pesosPorProveedor: { [proveedorId: string]: number };
}

export interface ConfiguracionVenta {
  margenGanancia: number;
  iva: number;
}

export interface PrecioPorUnidad {
  id: string;
  estriboPrecioId: string;
  medida: string;
  precioUnitario: number;
}

export interface CalculoDetallado {
  estribo: Estribo & { peso: number };
  proveedor: Proveedor;
  costoBase: number;
  costoConMargen: number;
  precioFinalSinIva: number;
  precioFinalConIva: number;
  ivaAmount: number;
}

export const useEstribosData = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [estribos, setEstribos] = useState<Estribo[]>([]);
  const [preciosPorUnidad, setPreciosPorUnidad] = useState<PrecioPorUnidad[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionVenta>({
    margenGanancia: 90,
    iva: 21
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar proveedores
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from('sec_proveedores')
        .select('*')
        .order('nombre');

      if (proveedoresError) throw proveedoresError;

      // Cargar estribos con sus pesos
      const { data: estribosData, error: estribosError } = await supabase
        .from('sec_estribos')
        .select(`
          *,
          sec_estribo_pesos (
            proveedor_id,
            peso
          )
        `)
        .order('medida');

      if (estribosError) throw estribosError;

      // Cargar precios por unidad
      const { data: preciosData, error: preciosError } = await supabase
        .from('sec_precios_por_unidad')
        .select(`
          *,
          sec_estribos (medida)
        `);

      if (preciosError) throw preciosError;

      // Cargar configuración
      const { data: configData, error: configError } = await supabase
        .from('sec_configuracion_venta')
        .select('*')
        .limit(1)
        .single();

      if (configError && configError.code !== 'PGRST116') throw configError;

      // Transformar datos
      setProveedores(proveedoresData?.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precioPorKg: p.precio_por_kg
      })) || []);

      setEstribos(estribosData?.map(e => ({
        id: e.id,
        medida: e.medida,
        pesosPorProveedor: e.sec_estribo_pesos.reduce((acc: any, peso: any) => {
          acc[peso.proveedor_id] = peso.peso;
          return acc;
        }, {})
      })) || []);

      setPreciosPorUnidad(preciosData?.map(p => ({
        id: p.id,
        estriboPrecioId: p.estribo_id,
        medida: p.sec_estribos?.medida || '',
        precioUnitario: p.precio_unitario
      })) || []);

      if (configData) {
        setConfiguracion({
          margenGanancia: configData.margen_ganancia,
          iva: configData.iva
        });
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const agregarProveedor = async (proveedor: Omit<Proveedor, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('sec_proveedores')
        .insert({
          nombre: proveedor.nombre,
          precio_por_kg: proveedor.precioPorKg
        })
        .select()
        .single();

      if (error) throw error;

      const nuevoProveedor = {
        id: data.id,
        nombre: data.nombre,
        precioPorKg: data.precio_por_kg
      };

      setProveedores(prev => [...prev, nuevoProveedor]);
      toast({
        title: "Éxito",
        description: "Proveedor agregado correctamente",
      });
    } catch (error) {
      console.error('Error agregando proveedor:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el proveedor",
        variant: "destructive",
      });
    }
  };

  const eliminarProveedor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sec_proveedores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProveedores(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Éxito",
        description: "Proveedor eliminado correctamente",
      });
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el proveedor",
        variant: "destructive",
      });
    }
  };

  const agregarEstribo = async (estribo: Omit<Estribo, 'id'>) => {
    try {
      const { data: estriboData, error: estriboError } = await supabase
        .from('sec_estribos')
        .insert({ medida: estribo.medida })
        .select()
        .single();

      if (estriboError) throw estriboError;

      // Insertar pesos por proveedor
      const pesosInsert = Object.entries(estribo.pesosPorProveedor).map(([proveedorId, peso]) => ({
        estribo_id: estriboData.id,
        proveedor_id: proveedorId,
        peso
      }));

      if (pesosInsert.length > 0) {
        const { error: pesosError } = await supabase
          .from('sec_estribo_pesos')
          .insert(pesosInsert);

        if (pesosError) throw pesosError;
      }

      const nuevoEstribo = {
        id: estriboData.id,
        medida: estriboData.medida,
        pesosPorProveedor: estribo.pesosPorProveedor
      };

      setEstribos(prev => [...prev, nuevoEstribo]);
      toast({
        title: "Éxito",
        description: "Estribo agregado correctamente",
      });
    } catch (error) {
      console.error('Error agregando estribo:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el estribo",
        variant: "destructive",
      });
    }
  };

  const eliminarEstribo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sec_estribos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEstribos(prev => prev.filter(e => e.id !== id));
      toast({
        title: "Éxito",
        description: "Estribo eliminado correctamente",
      });
    } catch (error) {
      console.error('Error eliminando estribo:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el estribo",
        variant: "destructive",
      });
    }
  };

  const actualizarConfiguracion = async (nuevaConfig: ConfiguracionVenta) => {
    try {
      const { error } = await supabase
        .from('sec_configuracion_venta')
        .upsert({
          margen_ganancia: nuevaConfig.margenGanancia,
          iva: nuevaConfig.iva
        });

      if (error) throw error;

      setConfiguracion(nuevaConfig);
      toast({
        title: "Éxito",
        description: "Configuración actualizada correctamente",
      });
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    }
  };

  const actualizarPrecioPorUnidad = async (estriboPrecioId: string, precio: number) => {
    try {
      const { error } = await supabase
        .from('sec_precios_por_unidad')
        .upsert({
          estribo_id: estriboPrecioId,
          precio_unitario: precio
        });

      if (error) throw error;

      await cargarDatos(); // Recargar datos
      toast({
        title: "Éxito",
        description: "Precio por unidad actualizado correctamente",
      });
    } catch (error) {
      console.error('Error actualizando precio por unidad:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el precio por unidad",
        variant: "destructive",
      });
    }
  };

  const calcularDatos = (): CalculoDetallado[] => {
    const resultados: CalculoDetallado[] = [];

    estribos.forEach(estribo => {
      proveedores.forEach(proveedor => {
        const peso = estribo.pesosPorProveedor[proveedor.id];
        if (peso) {
          const costoBase = peso * proveedor.precioPorKg;
          const costoConMargen = costoBase * (1 + configuracion.margenGanancia / 100);
          const ivaAmount = costoConMargen * (configuracion.iva / 100);
          const precioFinalConIva = costoConMargen + ivaAmount;

          resultados.push({
            estribo: { ...estribo, peso },
            proveedor,
            costoBase,
            costoConMargen,
            precioFinalSinIva: costoConMargen,
            precioFinalConIva,
            ivaAmount
          });
        }
      });
    });

    return resultados;
  };

  const calcularDatosPorUnidad = () => {
    return preciosPorUnidad.map(precio => {
      const ivaAmount = precio.precioUnitario * (configuracion.iva / 100);
      return {
        ...precio,
        precioSinIva: precio.precioUnitario,
        precioConIva: precio.precioUnitario + ivaAmount,
        ivaAmount
      };
    });
  };

  const calcularSimulacionVentas = () => {
    const calculos = calcularDatos();
    return calculos.map(calculo => ({
      ...calculo,
      ventasPorDia: Math.floor(Math.random() * 10) + 1,
      ingresosDiarios: calculo.precioFinalConIva * (Math.floor(Math.random() * 10) + 1)
    }));
  };

  const calcularSimulacionVentasPorUnidad = () => {
    const calculos = calcularDatosPorUnidad();
    return calculos.map(calculo => ({
      ...calculo,
      ventasPorDia: Math.floor(Math.random() * 5) + 1,
      ingresosDiarios: calculo.precioConIva * (Math.floor(Math.random() * 5) + 1)
    }));
  };

  return {
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
  };
};