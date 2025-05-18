
export interface Product {
  id: string;
  name: string;
  icon?: React.ReactNode;
  type: 'square' | 'rectangular' | string;
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
