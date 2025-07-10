-- Crear tabla de configuración de venta
CREATE TABLE public.sec_configuracion_venta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  margen_ganancia NUMERIC NOT NULL DEFAULT 90,
  iva NUMERIC NOT NULL DEFAULT 21,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de estribos
CREATE TABLE public.sec_estribos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medida TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de proveedores
CREATE TABLE public.sec_proveedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio_por_kg NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de pesos de estribos
CREATE TABLE public.sec_estribo_pesos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estribo_id UUID NOT NULL,
  proveedor_id UUID NOT NULL,
  peso NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (estribo_id) REFERENCES public.sec_estribos(id) ON DELETE CASCADE,
  FOREIGN KEY (proveedor_id) REFERENCES public.sec_proveedores(id) ON DELETE CASCADE
);

-- Crear tabla de precios por unidad
CREATE TABLE public.sec_precios_por_unidad (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estribo_id UUID NOT NULL,
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (estribo_id) REFERENCES public.sec_estribos(id) ON DELETE CASCADE
);

-- Habilitar Row Level Security
ALTER TABLE public.sec_configuracion_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sec_estribos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sec_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sec_estribo_pesos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sec_precios_por_unidad ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para usuarios autenticados
CREATE POLICY "Authenticated users can manage sec_configuracion_venta" 
ON public.sec_configuracion_venta 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sec_estribos" 
ON public.sec_estribos 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sec_proveedores" 
ON public.sec_proveedores 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sec_estribo_pesos" 
ON public.sec_estribo_pesos 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sec_precios_por_unidad" 
ON public.sec_precios_por_unidad 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Crear triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_sec_configuracion_venta_updated_at
  BEFORE UPDATE ON public.sec_configuracion_venta
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sec_estribos_updated_at
  BEFORE UPDATE ON public.sec_estribos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sec_proveedores_updated_at
  BEFORE UPDATE ON public.sec_proveedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sec_estribo_pesos_updated_at
  BEFORE UPDATE ON public.sec_estribo_pesos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sec_precios_por_unidad_updated_at
  BEFORE UPDATE ON public.sec_precios_por_unidad
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar configuración inicial
INSERT INTO public.sec_configuracion_venta (margen_ganancia, iva) 
VALUES (90, 21);