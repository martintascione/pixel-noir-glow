import { Product, ApiResponse } from "@/types/products";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Función para verificar conectividad con la API
const checkApiConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/products/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error("Error de conectividad con la API:", error);
    return false;
  }
};

// Función genérica para hacer peticiones HTTP
const makeApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    const response = await fetch(`${API_URL}${endpoint}`, finalOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error en ${endpoint}:`, error);
    return {
      data: {} as T,
      error: error instanceof Error ? error.message : "Error de conexión"
    };
  }
};

// Obtener todos los productos
export const getAllProducts = async (): Promise<ApiResponse<Product[]>> => {
  const isConnected = await checkApiConnection();
  
  if (!isConnected) {
    return {
      data: [],
      error: "No se pudo conectar con la base de datos"
    };
  }

  return makeApiRequest<Product[]>('/products/');
};

// Obtener un producto por ID
export const getProductById = async (
  id: string, 
  params?: { diameter?: string; nailType?: string }
): Promise<ApiResponse<Product>> => {
  const isConnected = await checkApiConnection();
  
  if (!isConnected) {
    return {
      data: {} as Product,
      error: "No se pudo conectar con la base de datos"
    };
  }

  let url = `/products/read.php?id=${id}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    if (params.diameter) searchParams.append('diameter', params.diameter);
    if (params.nailType) searchParams.append('nailType', params.nailType);
    
    if (searchParams.toString()) {
      url += `&${searchParams.toString()}`;
    }
  }

  return makeApiRequest<Product>(url);
};

// Crear un nuevo producto
export const createNewProduct = async (
  product: Omit<Product, "id">
): Promise<ApiResponse<Product>> => {
  const isConnected = await checkApiConnection();
  
  if (!isConnected) {
    return {
      data: {} as Product,
      error: "No se pudo conectar con la base de datos"
    };
  }

  return makeApiRequest<Product>('/products/create.php', {
    method: 'POST',
    body: JSON.stringify(product),
  });
};

// Actualizar un producto existente
export const updateExistingProduct = async (
  id: string,
  product: Partial<Product>
): Promise<ApiResponse<Product>> => {
  const isConnected = await checkApiConnection();
  
  if (!isConnected) {
    return {
      data: {} as Product,
      error: "No se pudo conectar con la base de datos"
    };
  }

  return makeApiRequest<Product>(`/products/update.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
};

// Eliminar un producto
export const removeProduct = async (
  id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const isConnected = await checkApiConnection();
  
  if (!isConnected) {
    return {
      data: { success: false },
      error: "No se pudo conectar con la base de datos"
    };
  }

  return makeApiRequest<{ success: boolean }>(`/products/delete.php?id=${id}`, {
    method: 'DELETE',
  });
};

// Obtener fecha de última actualización
export const getLastUpdate = async (): Promise<ApiResponse<{ updateDate: Date }>> => {
  const isConnected = await checkApiConnection();
  
  if (!isConnected) {
    return {
      data: { updateDate: new Date() },
      error: "No se pudo conectar con la base de datos"
    };
  }

  return makeApiRequest<{ updateDate: Date }>('/price-update/');
};

// Verificar estado de la base de datos
export const checkDatabaseStatus = async (): Promise<{
  isConnected: boolean;
  message: string;
}> => {
  const isConnected = await checkApiConnection();
  
  return {
    isConnected,
    message: isConnected 
      ? "Conexión exitosa con la base de datos" 
      : "No se pudo conectar con la base de datos"
  };
};
