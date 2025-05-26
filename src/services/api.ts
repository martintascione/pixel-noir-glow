
import { Product, ApiResponse } from "@/types/products";

const API_URL = import.meta.env.VITE_API_URL || "/backend/api";

// Datos de demostración simplificados
const DEMO_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Estribos',
    type: 'estribos',
    sizes: [
      { size: '10x10', price: 150, shape: 'cuadrada' },
      { size: '15x15', price: 170, shape: 'cuadrada' },
      { size: '10x20', price: 180, shape: 'rectangular' },
      { size: '10x10x10', price: 160, shape: 'triangular' },
    ]
  },
  {
    id: '2',
    name: 'Clavos',
    type: 'clavos',
    sizes: [
      { size: '1.5 pulgadas', price: 80, shape: 'Punta París' },
      { size: '2 pulgadas', price: 100, shape: 'Punta París' },
      { size: '3 pulgadas', price: 130, shape: 'Clavo de Techo' },
    ]
  },
  {
    id: '3',
    name: 'Alambres',
    type: 'alambre',
    sizes: [
      { size: 'Alambre 17/15 Acindar', price: 2000, name: 'Alambre 17/15 Acindar' },
      { size: 'Alambre 19/17 Corralero', price: 2200, name: 'Alambre 19/17 Corralero' },
    ]
  }
];

let isInDemoMode = false;

const checkApiAvailability = async (): Promise<boolean> => {
  if (isInDemoMode) return false;
  
  try {
    const response = await fetch(`${API_URL}/products/`);
    return response.ok;
  } catch (error) {
    console.log("API no disponible, usando modo de prueba");
    isInDemoMode = true;
    return false;
  }
};

const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return { data };
};

const apiRequest = async <T>(
  endpoint: string, 
  method: string = 'GET',
  body?: object
): Promise<ApiResponse<T>> => {
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    return await handleApiResponse<T>(response);
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return { 
      data: {} as T, 
      error: error instanceof Error ? error.message : "Error de conexión" 
    };
  }
};

export const fetchProducts = async (): Promise<ApiResponse<Product[]>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      const response = await apiRequest<Product[]>('/products/');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return { data: response.data };
      }
    }
    
    return { data: DEMO_PRODUCTS };
  } catch (error) {
    return { data: DEMO_PRODUCTS, error: "Usando datos de ejemplo" };
  }
};

export const fetchProductById = async (id: string): Promise<ApiResponse<Product>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      const response = await apiRequest<Product>(`/products/read.php?id=${id}`);
      return response;
    } else {
      const product = DEMO_PRODUCTS.find(p => p.id === id);
      if (product) {
        return { data: product };
      }
      return { data: {} as Product, error: "Producto no encontrado" };
    }
  } catch (error) {
    const product = DEMO_PRODUCTS.find(p => p.id === id);
    if (product) {
      return { data: product, error: "Usando datos de ejemplo" };
    }
    return { data: {} as Product, error: "No se pudo cargar el producto" };
  }
};

export const fetchLastUpdateDate = async (): Promise<ApiResponse<{ updateDate: Date }>> => {
  return { data: { updateDate: new Date() } };
};

export const createProduct = async (product: Omit<Product, "id">): Promise<ApiResponse<Product>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      const response = await apiRequest<Product>('/products/create.php', 'POST', product);
      return response;
    } else {
      const newProduct = { ...product, id: `demo_${Date.now()}` } as Product;
      DEMO_PRODUCTS.push(newProduct);
      return { data: newProduct };
    }
  } catch (error) {
    return { data: {} as Product, error: "No se pudo crear el producto" };
  }
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<ApiResponse<Product>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      const response = await apiRequest<Product>(`/products/update.php?id=${id}`, 'PUT', product);
      return response;
    } else {
      const index = DEMO_PRODUCTS.findIndex(p => p.id === id);
      if (index >= 0) {
        DEMO_PRODUCTS[index] = { ...DEMO_PRODUCTS[index], ...product } as Product;
        return { data: DEMO_PRODUCTS[index] };
      }
      return { data: {} as Product, error: "Producto no encontrado" };
    }
  } catch (error) {
    return { data: {} as Product, error: "No se pudo actualizar el producto" };
  }
};

export const deleteProduct = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      const response = await apiRequest<{ success: boolean }>(`/products/delete.php?id=${id}`, 'DELETE');
      return response;
    } else {
      const index = DEMO_PRODUCTS.findIndex(p => p.id === id);
      if (index >= 0) {
        DEMO_PRODUCTS.splice(index, 1);
        return { data: { success: true } };
      }
      return { data: { success: false }, error: "Producto no encontrado" };
    }
  } catch (error) {
    return { data: { success: false }, error: "No se pudo eliminar el producto" };
  }
};
