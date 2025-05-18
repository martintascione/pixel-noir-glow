
export interface Product {
  id: string;
  name: string;
  icon?: React.ReactNode;
  type: 'square' | 'rectangular' | 'triangular' | 'construction' | 'hardware' | 'fencing' | string;
  sizes: ProductSize[];
  availableDiameters?: string[]; 
  availableShapes?: string[];
  availableNailTypes?: string[];
}

export interface ProductSize {
  size: string;
  price: number;
  diameter?: string;
  shape?: string;
  nailType?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
