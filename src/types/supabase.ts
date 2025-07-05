export interface ProductCategory {
  id: string;
  name: string;
  type: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  size: string;
  price: number;
  diameter?: string;
  shape?: string;
  nail_type?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
  combos?: ProductCombo[];
}

export interface ProductCombo {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  discount_percentage: number;
  display_order: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface CreateProductCategory {
  name: string;
  type: string;
  display_order?: number;
}

export interface CreateProduct {
  category_id: string;
  name: string;
  size: string;
  price: number;
  diameter?: string;
  shape?: string;
  nail_type?: string;
  display_order?: number;
}

export interface CreateProductCombo {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  discount_percentage?: number;
  display_order?: number;
  image_url?: string;
}