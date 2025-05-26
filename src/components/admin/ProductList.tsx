
import React from 'react';
import { Product } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductList = ({ products, onEdit, onDelete }: ProductListProps) => {
  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No hay productos</CardTitle>
          <CardDescription>
            No hay productos registrados. Crea el primer producto usando el formulario de arriba.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getProductDescription = (product: Product) => {
    let description = product.category;
    if (product.subcategory) {
      description += ` - ${product.subcategory}`;
    }
    if (product.shape) {
      description += ` - ${product.shape}`;
    }
    return description;
  };

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>{getProductDescription(product)}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(product.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medida</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.sizes.map((size, index) => (
                  <TableRow key={index}>
                    <TableCell>{size.size}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${size.price.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductList;
