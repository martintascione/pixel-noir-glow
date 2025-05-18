import { Product, ApiResponse } from "@/types/products";

const API_URL = import.meta.env.VITE_API_URL || "https://tu-dominio-hostinger.com/api";

export const fetchProducts = async (): Promise<ApiResponse<Product[]>> => {
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { data: [], error: "No se pudieron cargar los productos" };
  }
};

export const fetchProductById = async (id: string, diameter?: string): Promise<ApiResponse<Product>> => {
  try {
    // Si hay un diámetro seleccionado, lo agregamos como parámetro de consulta
    const url = diameter 
      ? `${API_URL}/products/${id}?diameter=${diameter}` 
      : `${API_URL}/products/${id}`;
    
    const response = await fetch(url);
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
    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    });
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error creating product:", error);
    return { data: {} as Product, error: "No se pudo crear el producto" };
  }
};

// Esta función se usaría desde un panel de administración
export const updateProduct = async (id: string, product: Partial<Product>): Promise<ApiResponse<Product>> => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    });
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return { data: {} as Product, error: "No se pudo actualizar el producto" };
  }
};

// Esta función se usaría desde un panel de administración
export const deleteProduct = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return { data: { success: false }, error: "No se pudo eliminar el producto" };
  }
};
