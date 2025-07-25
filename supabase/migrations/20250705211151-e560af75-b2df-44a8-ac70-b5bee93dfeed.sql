-- Crear tabla de categorías de productos
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'estribos', 'clavos', 'alambre', etc.
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de productos individuales
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  diameter TEXT, -- para estribos
  shape TEXT, -- cuadrada, rectangular, triangular
  nail_type TEXT, -- para clavos
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de combos/cajas
CREATE TABLE public.product_combos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Caja 100u", "Caja 200u", etc.
  quantity INTEGER NOT NULL, -- 100, 200, etc.
  price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0, -- descuento si aplica
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_combos ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para lectura (cualquiera puede ver los productos)
CREATE POLICY "Anyone can view product categories" 
ON public.product_categories FOR SELECT USING (true);

CREATE POLICY "Anyone can view products" 
ON public.products FOR SELECT USING (true);

CREATE POLICY "Anyone can view product combos" 
ON public.product_combos FOR SELECT USING (true);

-- Políticas de administración (solo usuarios autenticados pueden modificar)
CREATE POLICY "Authenticated users can manage categories" 
ON public.product_categories FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage products" 
ON public.products FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage combos" 
ON public.product_combos FOR ALL USING (auth.uid() IS NOT NULL);

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para timestamps automáticos
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_combos_updated_at
  BEFORE UPDATE ON public.product_combos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar datos de ejemplo
INSERT INTO public.product_categories (name, type, display_order) VALUES
('Estribos', 'estribos', 1),
('Clavos', 'clavos', 2),
('Alambres', 'alambre', 3),
('Torniquetes', 'alambre', 4),
('Tranquerones', 'alambre', 5);

-- Insertar productos de ejemplo para estribos
INSERT INTO public.products (category_id, name, size, price, diameter, shape, display_order) 
SELECT 
  c.id,
  'Estribo ' || sizes.size,
  sizes.size,
  sizes.price,
  sizes.diameter,
  sizes.shape,
  sizes.order_num
FROM public.product_categories c
CROSS JOIN (
  VALUES 
    ('10x10', 150, '4.2', 'Cuadrado', 1),
    ('15x15', 170, '4.2', 'Cuadrado', 2),
    ('20x20', 190, '4.2', 'Cuadrado', 3),
    ('10x20', 180, '4.2', 'Rectangular', 4),
    ('15x25', 200, '4.2', 'Rectangular', 5),
    ('10x10', 180, '6', 'Cuadrado', 6),
    ('15x15', 200, '6', 'Cuadrado', 7),
    ('20x20', 220, '6', 'Cuadrado', 8)
) AS sizes(size, price, diameter, shape, order_num)
WHERE c.type = 'estribos';

-- Insertar combos de ejemplo para estribos
INSERT INTO public.product_combos (product_id, name, quantity, price, display_order)
SELECT 
  p.id,
  'Caja ' || combo.quantity || 'u',
  combo.quantity,
  (p.price * combo.quantity * combo.discount_factor)::DECIMAL(10,2),
  combo.order_num
FROM public.products p
CROSS JOIN (
  VALUES 
    (100, 0.95, 1), -- 5% descuento en caja de 100
    (200, 0.90, 2), -- 10% descuento en caja de 200
    (500, 0.85, 3)  -- 15% descuento en caja de 500
) AS combo(quantity, discount_factor, order_num)
WHERE p.name LIKE 'Estribo%';