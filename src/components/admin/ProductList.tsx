
import React from 'react';
import { Product } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
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
  if (products.length === 0) {
    return <p className="text-center py-8 text-muted-foreground">No hay productos registrados.</p>;
  }

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'construction': return 'Construcción';
      case 'hardware': return 'Ferretería';
      case 'fencing': return 'Alambrado';
      case 'wire': return 'Alambres';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
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
                    {getProductTypeLabel(product.type)} · {product.sizes.length} tamaños
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
                <TableCaption>Lista de tamaños y precios para {product.name}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medida</TableHead>
                    {product.type === 'construction' && (
                      <>
                        <TableHead>Diámetro</TableHead>
                        <TableHead>Forma</TableHead>
                      </>
                    )}
                    {product.type === 'hardware' && (
                      <TableHead>Tipo</TableHead>
                    )}
                    <TableHead className="text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.sizes.map((size, index) => (
                    <TableRow key={index}>
                      <TableCell>{size.size}</TableCell>
                      {product.type === 'construction' && (
                        <>
                          <TableCell>{size.diameter} mm</TableCell>
                          <TableCell>{size.shape}</TableCell>
                        </>
                      )}
                      {product.type === 'hardware' && (
                        <TableCell>{size.nailType}</TableCell>
                      )}
                      <TableCell className="text-right">${size.price.toFixed(2)}</TableCell>
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
