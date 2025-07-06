
import React from 'react';
import { Product } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { formatPrice } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductList = ({ products, onEdit, onDelete }: ProductListProps) => {
  if (!products || products.length === 0) {
    return <p className="text-center py-8 text-muted-foreground">No hay productos registrados.</p>;
  }

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'estribos': return 'Estribos';
      case 'clavos': return 'Clavos';
      case 'alambre': return 'Alambre';
      default: return type;
    }
  };

  return (
    <div>
      <Accordion type="multiple" className="w-full">
        {products.map((product) => (
          <AccordionItem key={product.id} value={product.id}>
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-muted-foreground text-sm">
                    {getProductTypeLabel(product.type)} · {product.sizes.length} items
                  </span>
                </div>
              </AccordionTrigger>
              <div className="flex gap-2 pr-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(product);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(product.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <AccordionContent>
              <Table>
                <TableCaption>Lista de {product.type === 'alambre' ? 'alambres' : 'medidas'} y precios para {product.name}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{product.type === 'alambre' ? 'Nombre' : 'Medida'}</TableHead>
                    {product.type !== 'alambre' && <TableHead>Forma</TableHead>}
                    <TableHead className="text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.sizes.map((size, index) => (
                    <TableRow key={index}>
                      <TableCell>{size.size}</TableCell>
                      {product.type !== 'alambre' && (
                        <TableCell>{size.shape || '-'}</TableCell>
                      )}
                      <TableCell className="text-right">{formatPrice(size.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default ProductList;
