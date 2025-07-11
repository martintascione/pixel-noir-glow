
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

  // Función para extraer el número de la medida para ordenamiento
  const extractMeasureNumber = (size: string) => {
    const match = size.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Agrupar productos por diámetro
  const groupedProducts = products.reduce((acc, product) => {
    // Agrupar por diámetros encontrados en los sizes
    const diametersInProduct = [...new Set(product.sizes.map(size => size.diameter || 'Sin diámetro'))];
    
    diametersInProduct.forEach(diameter => {
      if (!acc[diameter]) {
        acc[diameter] = [];
      }
      
      // Filtrar sizes que corresponden a este diámetro y ordenarlos
      const sizesForDiameter = product.sizes
        .filter(size => (size.diameter || 'Sin diámetro') === diameter)
        .sort((a, b) => extractMeasureNumber(a.size) - extractMeasureNumber(b.size));
      
      if (sizesForDiameter.length > 0) {
        acc[diameter].push({
          ...product,
          sizes: sizesForDiameter
        });
      }
    });
    
    return acc;
  }, {} as Record<string, Product[]>);

  // Ordenar los diámetros: 4.2mm primero, luego 6mm, luego otros
  const sortedDiameters = Object.keys(groupedProducts).sort((a, b) => {
    if (a === '4.2') return -1;
    if (b === '4.2') return 1;
    if (a === '6') return -1;
    if (b === '6') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {sortedDiameters.map((diameter, diameterIndex) => (
        <div key={diameter} className="space-y-2">
          {/* Encabezado del diámetro */}
          <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
            <h3 className="font-semibold text-lg text-primary">
              {diameter === 'Sin diámetro' ? 'Sin diámetro especificado' : `Diámetro ${diameter}mm`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {groupedProducts[diameter].reduce((total, product) => total + product.sizes.length, 0)} productos
            </p>
          </div>
          
          {/* Lista de productos para este diámetro */}
          <Accordion type="multiple" className="w-full">
            {groupedProducts[diameter].map((product, productIndex) => (
              <AccordionItem 
                key={`${diameter}-${product.id}-${productIndex}`} 
                value={`${diameter}-${product.id}-${productIndex}`}
                className="border rounded-lg mb-2"
              >
                <div className="flex items-center justify-between">
                  <AccordionTrigger className="flex-1 hover:no-underline px-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {getProductTypeLabel(product.type)} · {product.sizes.length} medidas
                      </span>
                    </div>
                  </AccordionTrigger>
                  <div className="flex gap-2 pr-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Encontrar el producto original completo para editar
                        const originalProduct = products.find(p => p.id === product.id);
                        if (originalProduct) {
                          onEdit(originalProduct);
                        }
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
                <AccordionContent className="px-4 pb-4">
                  <Table>
                    <TableCaption>
                      Lista de {product.type === 'alambre' ? 'alambres' : 'medidas'} y precios para {product.name}
                      {diameter !== 'Sin diámetro' && ` (${diameter}mm)`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{product.type === 'alambre' ? 'Nombre' : 'Medida'}</TableHead>
                        {product.type !== 'alambre' && <TableHead>Forma</TableHead>}
                        {diameter !== 'Sin diámetro' && <TableHead>Diámetro</TableHead>}
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
                          {diameter !== 'Sin diámetro' && (
                            <TableCell>{size.diameter || '-'}mm</TableCell>
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
      ))}
    </div>
  );
};

export default ProductList;
