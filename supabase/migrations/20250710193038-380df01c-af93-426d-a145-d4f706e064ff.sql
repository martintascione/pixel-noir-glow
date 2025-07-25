-- Crear tabla para costos de productos
CREATE TABLE public.product_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  production_cost NUMERIC NOT NULL DEFAULT 0,
  profit_margin NUMERIC NOT NULL DEFAULT 0, -- Porcentaje de ganancia
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Habilitar RLS
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Authenticated users can manage product costs" 
ON public.product_costs 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_product_costs_updated_at
BEFORE UPDATE ON public.product_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();