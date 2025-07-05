import { supabase } from "@/integrations/supabase/client";
import { 
  ProductCategory, 
  Product, 
  ProductCombo, 
  CreateProductCategory, 
  CreateProduct, 
  CreateProductCombo 
} from "@/types/supabase";

// CATEGORÍAS
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return data as ProductCategory[];
};

export const createCategory = async (category: CreateProductCategory) => {
  const { data, error } = await supabase
    .from('product_categories')
    .insert([category])
    .select()
    .single();
  
  if (error) throw error;
  return data as ProductCategory;
};

export const updateCategory = async (id: string, updates: Partial<CreateProductCategory>) => {
  const { data, error } = await supabase
    .from('product_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as ProductCategory;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// PRODUCTOS
export const getProducts = async (categoryId?: string) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:product_categories(*),
      combos:product_combos(*)
    `)
    .order('display_order', { ascending: true });
  
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as Product[];
};

export const createProduct = async (product: CreateProduct) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select(`
      *,
      category:product_categories(*),
      combos:product_combos(*)
    `)
    .single();
  
  if (error) throw error;
  return data as Product;
};

export const updateProduct = async (id: string, updates: Partial<CreateProduct>) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      category:product_categories(*),
      combos:product_combos(*)
    `)
    .single();
  
  if (error) throw error;
  return data as Product;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// COMBOS
export const getCombos = async (productId?: string) => {
  let query = supabase
    .from('product_combos')
    .select(`
      *,
      product:products(*)
    `)
    .order('display_order', { ascending: true });
  
  if (productId) {
    query = query.eq('product_id', productId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as ProductCombo[];
};

export const createCombo = async (combo: CreateProductCombo) => {
  const { data, error } = await supabase
    .from('product_combos')
    .insert([combo])
    .select(`
      *,
      product:products(*)
    `)
    .single();
  
  if (error) throw error;
  return data as ProductCombo;
};

export const updateCombo = async (id: string, updates: Partial<CreateProductCombo>) => {
  const { data, error } = await supabase
    .from('product_combos')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      product:products(*)
    `)
    .single();
  
  if (error) throw error;
  return data as ProductCombo;
};

export const deleteCombo = async (id: string) => {
  const { error } = await supabase
    .from('product_combos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ACTUALIZACIÓN MASIVA DE PRECIOS
export const updatePricesByCategory = async (categoryId: string, percentage: number) => {
  const { data, error } = await supabase
    .rpc('update_prices_by_category', {
      p_category_id: categoryId,
      p_percentage: percentage
    });
  
  if (error) throw error;
  return data;
};

// FUNCIÓN PARA OBTENER DATOS COMPLETOS PARA LA PÁGINA PRINCIPAL
export const getPublicData = async () => {
  const { data, error } = await supabase
    .from('product_categories')
    .select(`
      *,
      products(
        *,
        combos:product_combos(*)
      )
    `)
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return data;
};