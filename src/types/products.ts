
export interface Product {
  id: string;
  name: string;
  type: 'estribos' | 'clavos' | 'alambre';
  sizes: ProductSize[];
}

export interface ProductSize {
  size: string;
  price: number;
  shape?: string; // Para estribos: cuadrada, rectangular, triangular. Para clavos: Punta París, Clavo de Techo
  name?: string;  // Solo para alambre
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
