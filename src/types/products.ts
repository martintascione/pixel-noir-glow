
export interface Product {
  id: string;
  name: string;
  icon?: React.ReactNode;
  type: 'square' | 'rectangular' | string;
  sizes: ProductSize[];
  availableDiameters?: string[]; // Diámetros disponibles para este producto
}

export interface ProductSize {
  size: string;
  price: number;
  diameter?: string; // Diámetro al que corresponde este precio/tamaño
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
