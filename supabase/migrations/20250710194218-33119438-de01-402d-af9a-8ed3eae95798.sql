-- Crear tabla para configuración de márgenes por categoría
CREATE TABLE public.category_margins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  profit_margin NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para configuración general (IVA)
CREATE TABLE public.general_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  iva_rate NUMERIC NOT NULL DEFAULT 21,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar configuración por defecto
INSERT INTO public.general_config (iva_rate) VALUES (21);

-- Enable Row Level Security
ALTER TABLE public.category_margins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_config ENABLE ROW LEVEL SECURITY;

-- Create policies for category_margins
CREATE POLICY "Authenticated users can manage category_margins" 
ON public.category_margins 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create policies for general_config
CREATE POLICY "Authenticated users can manage general_config" 
ON public.general_config 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_category_margins_updated_at
BEFORE UPDATE ON public.category_margins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_general_config_updated_at
BEFORE UPDATE ON public.general_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();