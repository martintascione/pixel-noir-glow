
import { Product, ApiResponse } from "@/types/products";

// Use environment variable for API URL with a fallback
const API_URL = import.meta.env.VITE_API_URL || "/api";

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

// API Functions for Products
export const fetchProducts = async (): Promise<ApiResponse<Product[]>> => {
  try {
    const response = await apiRequest<Product[]>('/products');
    console.log("Productos cargados:", response.data);
    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return { data: [], error: "No se pudieron cargar los productos" };
  }
};

export const fetchProductById = async (
  id: string, 
  params: Record<string, string> = {}
): Promise<ApiResponse<Product>> => {
  try {
    const response = await apiRequest<Product>(`/products/${id}`, 'GET', undefined, params);
    return response;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return { data: {} as Product, error: "No se pudo cargar el producto" };
  }
};

export const fetchLastUpdateDate = async (): Promise<ApiResponse<{ updateDate: Date }>> => {
  try {
    const response = await apiRequest<{ updateDate: Date }>('/price-update');
    return response;
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
    console.log("Creando producto:", product);
    const response = await apiRequest<Product>('/products', 'POST', product);
    console.log("Producto creado:", response.data);
    return response;
  } catch (error) {
    console.error("Error creating product:", error);
    return { data: {} as Product, error: "No se pudo crear el producto. Verifique la conexión a la base de datos." };
  }
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<ApiResponse<Product>> => {
  try {
    console.log(`Actualizando producto ${id}:`, product);
    const response = await apiRequest<Product>(`/products/${id}`, 'PUT', product);
    console.log("Producto actualizado:", response.data);
    return response;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return { data: {} as Product, error: "No se pudo actualizar el producto. Verifique la conexión a la base de datos." };
  }
};

export const deleteProduct = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    console.log(`Eliminando producto ${id}`);
    const response = await apiRequest<{ success: boolean }>(`/products/${id}`, 'DELETE');
    console.log("Producto eliminado:", response.data);
    return response;
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return { data: { success: false }, error: "No se pudo eliminar el producto. Verifique la conexión a la base de datos." };
  }
};
