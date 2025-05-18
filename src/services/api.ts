
import { Product, ApiResponse } from "@/types/products";

// Usamos una variable de entorno para la URL de la API, con un valor de respaldo
const API_URL = import.meta.env.VITE_API_URL || "/api";

export const fetchProducts = async (): Promise<ApiResponse<Product[]>> => {
  try {
    // En producción, esta sería una llamada real a la base de datos
    const response = await fetch(`${API_URL}/products`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Productos cargados:", data);
    return { data };
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
    // Construir URL con parámetros de consulta
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    
    const queryString = queryParams.toString();
    const url = `${API_URL}/products/${id}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return { data: {} as Product, error: "No se pudo cargar el producto" };
  }
};

export const fetchLastUpdateDate = async (): Promise<ApiResponse<{ updateDate: Date }>> => {
  try {
    // En producción, esto sería una llamada real a la API para obtener la fecha de última actualización
    // de la tabla price_updates
    const response = await fetch(`${API_URL}/price-update`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error fetching update date:", error);
    // Devolver la fecha actual como respaldo
    return { 
      data: { updateDate: new Date() },
      error: "No se pudo cargar la fecha de actualización" 
    };
  }
};

// Esta función se usaría desde un panel de administración
export const createProduct = async (product: Omit<Product, "id">): Promise<ApiResponse<Product>> => {
  try {
    console.log("Creando producto:", product);
    
    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
      credentials: 'include', // Para enviar cookies si es necesario para autenticación
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Producto creado:", data);
    return { data };
  } catch (error) {
    console.error("Error creating product:", error);
    return { data: {} as Product, error: "No se pudo crear el producto. Verifique la conexión a la base de datos." };
  }
};

// Esta función se usaría desde un panel de administración
export const updateProduct = async (id: string, product: Partial<Product>): Promise<ApiResponse<Product>> => {
  try {
    console.log(`Actualizando producto ${id}:`, product);
    
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Producto actualizado:", data);
    return { data };
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return { data: {} as Product, error: "No se pudo actualizar el producto. Verifique la conexión a la base de datos." };
  }
};

// Esta función se usaría desde un panel de administración
export const deleteProduct = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    console.log(`Eliminando producto ${id}`);
    
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Producto eliminado:", data);
    return { data };
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return { data: { success: false }, error: "No se pudo eliminar el producto. Verifique la conexión a la base de datos." };
  }
};
