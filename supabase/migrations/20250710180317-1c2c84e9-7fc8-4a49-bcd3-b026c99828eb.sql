-- Crear tabla para almacenar remitos
CREATE TABLE public.remitos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  fecha DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para almacenar items de remitos
CREATE TABLE public.remito_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  remito_id UUID NOT NULL REFERENCES remitos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  medida TEXT NOT NULL,
  producto TEXT NOT NULL,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  precio_total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.remitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remito_items ENABLE ROW LEVEL SECURITY;

-- Políticas para tabla remitos
CREATE POLICY "Users can view their own remitos" 
ON public.remitos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own remitos" 
ON public.remitos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own remitos" 
ON public.remitos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own remitos" 
ON public.remitos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para tabla remito_items
CREATE POLICY "Users can view remito items through remitos" 
ON public.remito_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.remitos 
  WHERE remitos.id = remito_items.remito_id 
  AND remitos.user_id = auth.uid()
));

CREATE POLICY "Users can create remito items through remitos" 
ON public.remito_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.remitos 
  WHERE remitos.id = remito_items.remito_id 
  AND remitos.user_id = auth.uid()
));

CREATE POLICY "Users can update remito items through remitos" 
ON public.remito_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.remitos 
  WHERE remitos.id = remito_items.remito_id 
  AND remitos.user_id = auth.uid()
));

CREATE POLICY "Users can delete remito items through remitos" 
ON public.remito_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.remitos 
  WHERE remitos.id = remito_items.remito_id 
  AND remitos.user_id = auth.uid()
));

-- Crear trigger para actualizar updated_at en remitos
CREATE TRIGGER update_remitos_updated_at
BEFORE UPDATE ON public.remitos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_remitos_client_id ON public.remitos(client_id);
CREATE INDEX idx_remitos_user_id ON public.remitos(user_id);
CREATE INDEX idx_remitos_fecha ON public.remitos(fecha);
CREATE INDEX idx_remito_items_remito_id ON public.remito_items(remito_id);