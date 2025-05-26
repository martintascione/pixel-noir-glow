
import { Product } from '@/types/products';

const API_BASE_URL = 'src/backend/api';

export const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error fetching products');
    }
    
    return { data };
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Return example data if API fails
    return {
      data: [
        {
          id: '1',
          name: 'Estribos Cuadrados',
          category: 'Estribos' as const,
          subcategory: '4.2mm' as const,
          shape: 'Cuadrado' as const,
          sizes: [
            { size: '10x10', price: 150.00 },
            { size: '15x15', price: 170.00 },
            { size: '20x20', price: 190.00 }
          ]
        },
        {
          id: '2',
          name: 'Clavos Común',
          category: 'Clavos' as const,
          sizes: [
            { size: '1.5 pulgadas', price: 80.00 },
            { size: '2 pulgadas', price: 100.00 },
            { size: '2.5 pulgadas', price: 120.00 }
          ]
        },
        {
          id: '3',
          name: 'Alambre Galvanizado',
          category: 'Alambres' as const,
          sizes: [
            { size: '17/15', price: 2000.00 },
            { size: '19/17', price: 2200.00 }
          ]
        }
      ]
    };
  }
};

export const createProduct = async (productData: Omit<Product, 'id'>) => {
  const response = await fetch(`${API_BASE_URL}/products/create.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Error creating product');
  }
  
  return data;
};

export const updateProduct = async (id: string, productData: Partial<Product>) => {
  const response = await fetch(`${API_BASE_URL}/products/update.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...productData }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Error updating product');
  }
  
  return data;
};

export const deleteProduct = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/products/delete.php`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Error deleting product');
  }
  
  return data;
};
