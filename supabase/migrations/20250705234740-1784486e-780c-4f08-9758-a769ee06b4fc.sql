-- Crear función para actualización masiva de precios por categoría
CREATE OR REPLACE FUNCTION public.update_prices_by_category(
  p_category_id UUID,
  p_percentage NUMERIC
) 
RETURNS TABLE (
  id UUID,
  name TEXT,
  old_price NUMERIC,
  new_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_count INTEGER;
BEGIN
  -- Actualizar precios y devolver los productos afectados
  UPDATE public.products 
  SET 
    price = price * (1 + p_percentage / 100.0),
    updated_at = now()
  WHERE category_id = p_category_id;
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  -- Retornar información de los productos actualizados
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    (p.price / (1 + p_percentage / 100.0))::NUMERIC as old_price,
    p.price as new_price
  FROM public.products p
  WHERE p.category_id = p_category_id;
  
END;
$$;