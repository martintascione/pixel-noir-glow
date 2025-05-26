
import React from 'react';
import { Product } from '@/types/products';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PriceTableProps {
  selectedProduct: Product | null;
}

const PriceTable = ({ selectedProduct }: PriceTableProps) => {
  if (!selectedProduct || !selectedProduct.sizes || selectedProduct.sizes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Selecciona un producto para ver los precios
      </div>
    );
  }

  const getTableCaption = () => {
    switch (selectedProduct.type) {
      case 'estribos':
        return `Precios de ${selectedProduct.name} - Medidas y formas disponibles`;
      case 'clavos':
        return `Precios de ${selectedProduct.name} - Medidas y tipos disponibles`;
      case 'alambre':
        return `Precios de ${selectedProduct.name} - Tipos de alambre disponibles`;
      default:
        return `Precios de ${selectedProduct.name}`;
    }
  };

  const getFirstColumnHeader = () => {
    return selectedProduct.type === 'alambre' ? 'Nombre' : 'Medida';
  };

  return (
    <div className="w-full">
      <Table>
        <TableCaption>{getTableCaption()}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{getFirstColumnHeader()}</TableHead>
            {selectedProduct.type !== 'alambre' && <TableHead>Forma</TableHead>}
            <TableHead className="text-right">Precio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedProduct.sizes.map((size, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{size.size}</TableCell>
              {selectedProduct.type !== 'alambre' && (
                <TableCell>{size.shape || '-'}</TableCell>
              )}
              <TableCell className="text-right font-semibold">
                ${size.price.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PriceTable;
