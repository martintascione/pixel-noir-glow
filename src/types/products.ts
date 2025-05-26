
export interface Product {
  id: string;
  name: string;
  category: 'Estribos' | 'Clavos' | 'Alambres';
  subcategory?: '4.2mm' | '6mm'; // Solo para Estribos
  shape?: 'Cuadrado' | 'Rectangular' | 'Triangular'; // Solo para Estribos
  sizes: ProductSize[];
}

export interface ProductSize {
  size: string;
  price: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
