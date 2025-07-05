-- Crear bucket para imágenes de combos/productos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('combo-images', 'combo-images', true);

-- Crear políticas para el bucket de imágenes de combos
CREATE POLICY "Anyone can view combo images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'combo-images');

CREATE POLICY "Authenticated users can upload combo images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'combo-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update combo images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'combo-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete combo images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'combo-images' AND auth.uid() IS NOT NULL);

-- Agregar campo image_url a la tabla product_combos
ALTER TABLE public.product_combos 
ADD COLUMN image_url TEXT;