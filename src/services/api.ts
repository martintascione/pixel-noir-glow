
import { Product, ApiResponse } from "@/types/products";

const API_URL = import.meta.env.VITE_API_URL || "/backend/api";

// Datos de ejemplo para cuando la API no esté disponible
const DEMO_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Estribos Cuadrados',
    category: 'Estribos',
    subcategory: '4.2mm',
    shape: 'Cuadrado',
    sizes: [
      { size: '10x10', price: 150.00 },
      { size: '15x15', price: 170.00 },
      { size: '20x20', price: 190.00 }
    ]
  },
  {
    id: '2',
    name: 'Clavos Común',
    category: 'Clavos',
    sizes: [
      { size: '1.5 pulgadas', price: 80.00 },
      { size: '2 pulgadas', price: 100.00 },
      { size: '2.5 pulgadas', price: 120.00 }
    ]
  },
  {
    id: '3',
    name: 'Alambre Galvanizado',
    category: 'Alambres',
    sizes: [
      { size: '17/15', price: 2000.00 },
      { size: '19/17', price: 2200.00 }
    ]
  }
];

let isInDemoMode = false;

const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/products/`);
    return response.ok;
  } catch (error) {
    console.log("API no disponible, usando modo de ejemplo");
    isInDemoMode = true;
    return false;
  }
};

const apiRequest = async <T>(
  endpoint: string, 
  method: string = 'GET',
  body?: object
): Promise<ApiResponse<T>> => {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`Making ${method} request to: ${API_URL}${endpoint}`, body);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { data };
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
      console.log("Productos cargados desde API:", response.data);
      return response;
    } else {
      console.log("Usando productos de ejemplo");
      return { data: DEMO_PRODUCTS };
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    return { data: DEMO_PRODUCTS, error: "Usando datos de ejemplo" };
  }
};

export const createProduct = async (product: Omit<Product, "id">): Promise<ApiResponse<Product>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      console.log("Creando producto:", product);
      return await apiRequest<Product>('/products/create.php', 'POST', product);
    } else {
      console.log("Creando producto en modo de ejemplo:", product);
      const newProduct = {
        ...product,
        id: `demo_${Date.now()}`
      } as Product;
      DEMO_PRODUCTS.push(newProduct);
      return { data: newProduct };
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return { data: {} as Product, error: "No se pudo crear el producto" };
  }
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<ApiResponse<Product>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      console.log(`Actualizando producto ${id}:`, product);
      return await apiRequest<Product>(`/products/update.php?id=${id}`, 'PUT', product);
    } else {
      console.log(`Actualizando producto en modo de ejemplo ${id}:`, product);
      const index = DEMO_PRODUCTS.findIndex(p => p.id === id);
      if (index >= 0) {
        DEMO_PRODUCTS[index] = { ...DEMO_PRODUCTS[index], ...product } as Product;
        return { data: DEMO_PRODUCTS[index] };
      }
      return { data: {} as Product, error: "Producto no encontrado" };
    }
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return { data: {} as Product, error: "No se pudo actualizar el producto" };
  }
};

export const deleteProduct = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      console.log(`Eliminando producto ${id}`);
      return await apiRequest<{ success: boolean }>(`/products/delete.php?id=${id}`, 'DELETE');
    } else {
      console.log(`Eliminando producto en modo de ejemplo ${id}`);
      const index = DEMO_PRODUCTS.findIndex(p => p.id === id);
      if (index >= 0) {
        DEMO_PRODUCTS.splice(index, 1);
        return { data: { success: true } };
      }
      return { data: { success: false }, error: "Producto no encontrado" };
    }
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return { data: { success: false }, error: "No se pudo eliminar el producto" };
  }
};
