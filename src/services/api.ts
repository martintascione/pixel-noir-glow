import { Product, ApiResponse } from "@/types/products";
import {
  getAllProducts as centralGetAllProducts,
  getProductById as centralGetProductById,
  createNewProduct as centralCreateProduct,
  updateExistingProduct as centralUpdateProduct,
  removeProduct as centralRemoveProduct,
  getLastUpdate as centralGetLastUpdate,
  checkDatabaseStatus
} from "./centralApi";

const API_URL = import.meta.env.VITE_API_URL || "/backend/api";

// Datos de demostración que coinciden con el diseño actual
const DEMO_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Estribos',
    type: 'estribos',
    sizes: [
      { size: '10x10', price: 150, shape: 'Cuadrado', diameter: '4.2' },
      { size: '15x15', price: 170, shape: 'Cuadrado', diameter: '4.2' },
      { size: '20x20', price: 190, shape: 'Cuadrado', diameter: '4.2' },
      { size: '10x20', price: 180, shape: 'Rectangular', diameter: '4.2' },
      { size: '15x25', price: 200, shape: 'Rectangular', diameter: '4.2' },
      { size: '10x10x10', price: 160, shape: 'Triangular', diameter: '4.2' },
      { size: '15x15x15', price: 180, shape: 'Triangular', diameter: '4.2' },
      { size: '10x10', price: 180, shape: 'Cuadrado', diameter: '6' },
      { size: '15x15', price: 200, shape: 'Cuadrado', diameter: '6' },
      { size: '20x20', price: 220, shape: 'Cuadrado', diameter: '6' },
      { size: '20x30', price: 230, shape: 'Rectangular', diameter: '6' },
      { size: '30x40', price: 250, shape: 'Rectangular', diameter: '6' },
      { size: '10x10x10', price: 190, shape: 'Triangular', diameter: '6' },
      { size: '15x15x15', price: 210, shape: 'Triangular', diameter: '6' },
      { size: '20x20x20', price: 230, shape: 'Triangular', diameter: '6' },
    ]
  },
  {
    id: '2',
    name: 'Clavos',
    type: 'clavos',
    sizes: [
      { size: '1.5 pulgadas', price: 80, nailType: '1' },
      { size: '2 pulgadas', price: 100, nailType: '1' },
      { size: '2.5 pulgadas', price: 120, nailType: '1' },
      { size: '3 pulgadas', price: 130, nailType: '2' },
      { size: '4 pulgadas', price: 150, nailType: '2' },
    ]
  },
  {
    id: '3',
    name: 'Alambres',
    type: 'alambre',
    sizes: [
      { size: 'Alambre 17/15 Acindar', price: 2000, name: 'Alambre 17/15 Acindar' },
      { size: 'Alambre 19/17 Corralero', price: 2200, name: 'Alambre 19/17 Corralero' },
      { size: 'Alta resistencia Bragado', price: 2400, name: 'Alta resistencia Bragado' },
      { size: 'Bagual clásico', price: 2300, name: 'Bagual clásico' },
      { size: 'Bagual super', price: 2500, name: 'Bagual super' },
    ]
  },
  {
    id: '4',
    name: 'Torniquetes',
    type: 'alambre',
    sizes: [
      { size: 'Doble liviana', price: 300, name: 'Doble liviana' },
      { size: 'Doble reforzada', price: 350, name: 'Doble reforzada' },
      { size: 'N° 3 zincada', price: 250, name: 'N° 3 zincada' },
    ]
  },
  {
    id: '5',
    name: 'Tranquerones',
    type: 'alambre',
    sizes: [
      { size: 'Barral tranquerón (solo)', price: 400, name: 'Barral tranquerón (solo)' },
      { size: 'Contratranquerón de 1,2 (solo)', price: 350, name: 'Contratranquerón de 1,2 (solo)' },
      { size: 'Crique (solo)', price: 300, name: 'Crique (solo)' },
    ]
  }
];

export const fetchProducts = async (): Promise<ApiResponse<Product[]>> => {
  try {
    console.log("Intentando conectar con la base de datos...");
    const dbStatus = await checkDatabaseStatus();
    
    if (dbStatus.isConnected) {
      console.log("Base de datos conectada, obteniendo productos...");
      const response = await centralGetAllProducts();
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log("Productos obtenidos de la base de datos:", response.data);
        return response;
      }
    }
    
    console.log("Usando datos de demostración");
    return { data: DEMO_PRODUCTS };
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return { data: DEMO_PRODUCTS, error: "Usando datos de ejemplo" };
  }
};

export const fetchProductById = async (id: string, params?: any): Promise<ApiResponse<Product>> => {
  try {
    const dbStatus = await checkDatabaseStatus();
    
    if (dbStatus.isConnected) {
      const response = await centralGetProductById(id, params);
      if (response.data && response.data.id) {
        return response;
      }
    }
    
    // Fallback a datos de demostración
    const product = DEMO_PRODUCTS.find(p => p.id === id);
    if (product) {
      let filteredProduct = { ...product };
      if (params) {
        let filteredSizes = [...product.sizes];
        
        if (params.diameter) {
          filteredSizes = filteredSizes.filter(size => size.diameter === params.diameter);
        }
        
        if (params.nailType) {
          filteredSizes = filteredSizes.filter(size => size.nailType === params.nailType);
        }
        
        filteredProduct.sizes = filteredSizes;
      }
      return { data: filteredProduct };
    }
    return { data: {} as Product, error: "Producto no encontrado" };
  } catch (error) {
    const product = DEMO_PRODUCTS.find(p => p.id === id);
    if (product) {
      return { data: product, error: "Usando datos de ejemplo" };
    }
    return { data: {} as Product, error: "No se pudo cargar el producto" };
  }
};

export const fetchLastUpdateDate = async (): Promise<ApiResponse<{ updateDate: Date }>> => {
  try {
    const dbStatus = await checkDatabaseStatus();
    
    if (dbStatus.isConnected) {
      return await centralGetLastUpdate();
    }
    
    return { data: { updateDate: new Date() } };
  } catch (error) {
    return { data: { updateDate: new Date() } };
  }
};

export const createProduct = async (product: Omit<Product, "id">): Promise<ApiResponse<Product>> => {
  try {
    const dbStatus = await checkDatabaseStatus();
    
    if (dbStatus.isConnected) {
      return await centralCreateProduct(product);
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
    const dbStatus = await checkDatabaseStatus();
    
    if (dbStatus.isConnected) {
      return await centralUpdateProduct(id, product);
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
    const dbStatus = await checkDatabaseStatus();
    
    if (dbStatus.isConnected) {
      return await centralRemoveProduct(id);
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
