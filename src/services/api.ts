
import { Product, ApiResponse } from "@/types/products";

// Use environment variable for API URL with a fallback
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Data for demo mode (will be used when API is not available)
const DEMO_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Estribos',
    type: 'construction',
    sizes: [
      { size: '10x10', price: 150.00, diameter: '4.2', shape: 'Cuadrado' },
      { size: '15x15', price: 170.00, diameter: '4.2', shape: 'Cuadrado' },
      { size: '20x20', price: 190.00, diameter: '4.2', shape: 'Cuadrado' },
      { size: '10x20', price: 180.00, diameter: '4.2', shape: 'Rectangular' },
    ]
  },
  {
    id: '2',
    name: 'Clavos',
    type: 'hardware',
    sizes: [
      { size: '1.5 pulgadas', price: 80.00, nailType: 'Punta París' },
      { size: '2 pulgadas', price: 100.00, nailType: 'Punta París' },
    ]
  },
  {
    id: '3',
    name: 'Alambres',
    type: 'wire',
    sizes: [
      { size: 'Alambre 17/15 Acindar', price: 2000.00 },
      { size: 'Alambre 19/17 Corralero', price: 2200.00 },
    ]
  },
  {
    id: '4',
    name: 'Torniquetes',
    type: 'fencing',
    sizes: [
      { size: 'Doble liviana', price: 300.00 },
      { size: 'Doble reforzada', price: 350.00 },
    ]
  },
  {
    id: '5',
    name: 'Tranquerones',
    type: 'fencing',
    sizes: [
      { size: 'Barral tranquerón (solo)', price: 400.00 },
      { size: 'Contratranquerón de 1,2 (solo)', price: 350.00 },
    ]
  }
];

// Helper function to handle API responses
const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error: ${response.status} - ${errorText}`);
    throw new Error(`Error ${response.status}: ${response.statusText || errorText}`);
  }
  
  const data = await response.json();
  return { data };
};

// Helper function for API requests
const apiRequest = async <T>(
  endpoint: string, 
  method: string = 'GET',
  body?: object,
  params: Record<string, string> = {}
): Promise<ApiResponse<T>> => {
  try {
    // Build query params if provided
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    
    const queryString = queryParams.toString();
    const url = `${API_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // For auth cookies if needed
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`Making ${method} request to: ${url}`);
    const response = await fetch(url, options);
    return await handleApiResponse<T>(response);
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return { 
      data: {} as T, 
      error: error instanceof Error ? error.message : "Error de conexión con la base de datos" 
    };
  }
};

// Function to check if we're in demo mode (API not available)
let isInDemoMode = false;

const checkApiAvailability = async (): Promise<boolean> => {
  if (isInDemoMode) return false;
  
  try {
    const response = await fetch(`${API_URL}/products`);
    return response.ok;
  } catch (error) {
    console.log("API no disponible, usando modo de prueba con datos de ejemplo");
    isInDemoMode = true;
    return false;
  }
};

// API Functions for Products
export const fetchProducts = async (): Promise<ApiResponse<Product[]>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      const response = await apiRequest<Product[]>('/products');
      console.log("Productos cargados:", response.data);
      return response;
    } else {
      console.log("Usando productos de ejemplo en modo de prueba");
      return { data: DEMO_PRODUCTS };
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    return { data: DEMO_PRODUCTS, error: "No se pudieron cargar los productos reales, usando datos de ejemplo" };
  }
};

export const fetchProductById = async (
  id: string, 
  params: Record<string, string> = {}
): Promise<ApiResponse<Product>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      const response = await apiRequest<Product>(`/products/${id}`, 'GET', undefined, params);
      return response;
    } else {
      const product = DEMO_PRODUCTS.find(p => p.id === id);
      if (product) {
        return { data: product };
      } else {
        return { data: {} as Product, error: "Producto no encontrado en modo de prueba" };
      }
    }
  } catch (error) {
    // Buscar en los datos de ejemplo
    const product = DEMO_PRODUCTS.find(p => p.id === id);
    if (product) {
      return { data: product, error: "Usando datos de ejemplo (API no disponible)" };
    } else {
      console.error(`Error fetching product ${id}:`, error);
      return { data: {} as Product, error: "No se pudo cargar el producto" };
    }
  }
};

export const fetchLastUpdateDate = async (): Promise<ApiResponse<{ updateDate: Date }>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      const response = await apiRequest<{ updateDate: Date }>('/price-update');
      return response;
    } else {
      return { data: { updateDate: new Date() } };
    }
  } catch (error) {
    console.error("Error fetching update date:", error);
    // Devolver la fecha actual como respaldo
    return { 
      data: { updateDate: new Date() },
      error: "No se pudo cargar la fecha de actualización" 
    };
  }
};

export const createProduct = async (product: Omit<Product, "id">): Promise<ApiResponse<Product>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      console.log("Creando producto:", product);
      const response = await apiRequest<Product>('/products', 'POST', product);
      console.log("Producto creado:", response.data);
      return response;
    } else {
      console.log("Creando producto en modo de prueba:", product);
      // Simular creación con ID aleatorio
      const newProduct = {
        ...product,
        id: `demo_${Math.floor(Math.random() * 1000)}`
      } as Product;
      DEMO_PRODUCTS.push(newProduct);
      return { data: newProduct };
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return { data: {} as Product, error: "No se pudo crear el producto. Verifique la conexión a la base de datos." };
  }
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<ApiResponse<Product>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      console.log(`Actualizando producto ${id}:`, product);
      const response = await apiRequest<Product>(`/products/${id}`, 'PUT', product);
      console.log("Producto actualizado:", response.data);
      return response;
    } else {
      console.log(`Actualizando producto en modo de prueba ${id}:`, product);
      // Actualizar en datos de ejemplo
      const index = DEMO_PRODUCTS.findIndex(p => p.id === id);
      if (index >= 0) {
        DEMO_PRODUCTS[index] = { ...DEMO_PRODUCTS[index], ...product } as Product;
        return { data: DEMO_PRODUCTS[index] };
      }
      return { data: {} as Product, error: "Producto no encontrado en modo de prueba" };
    }
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return { data: {} as Product, error: "No se pudo actualizar el producto. Verifique la conexión a la base de datos." };
  }
};

export const deleteProduct = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const apiAvailable = await checkApiAvailability();
    
    if (apiAvailable) {
      console.log(`Eliminando producto ${id}`);
      const response = await apiRequest<{ success: boolean }>(`/products/${id}`, 'DELETE');
      console.log("Producto eliminado:", response.data);
      return response;
    } else {
      console.log(`Eliminando producto en modo de prueba ${id}`);
      // Eliminar de datos de ejemplo
      const index = DEMO_PRODUCTS.findIndex(p => p.id === id);
      if (index >= 0) {
        DEMO_PRODUCTS.splice(index, 1);
        return { data: { success: true } };
      }
      return { data: { success: false }, error: "Producto no encontrado en modo de prueba" };
    }
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return { data: { success: false }, error: "No se pudo eliminar el producto. Verifique la conexión a la base de datos." };
  }
};
