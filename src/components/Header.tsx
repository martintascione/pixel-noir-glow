
import React from 'react';
import { Button } from '@/components/ui/button';
import { Anchor, Package, Cable, Square } from 'lucide-react';

const Header = () => {
  const products = [
    { name: 'Hierros', icon: <Square className="mr-1" /> },
    { name: 'Claves', icon: <Package className="mr-1" /> },
    { name: 'Alambre Fardo', icon: <Cable className="mr-1" /> },
    { name: 'Etribos', icon: <Anchor className="mr-1" /> },
  ];

  return (
    <header className="py-6 border-b border-border bg-white">
      <div className="container-custom">
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight animate-fade-in">
            HIERROS TASCIONE
          </h1>
          <p className="text-sm text-muted-foreground animate-fade-in">
            CUIT: 20-21856308-3
          </p>
          
          <div className="w-full max-w-lg mx-auto my-4">
            <p className="relative text-md md:text-lg font-medium tracking-wider text-center py-3 animate-fade-in">
              <span className="inline-block px-2 relative z-10 uppercase bg-white">
                AHORRA TIEMPO, SUMA PRODUCTIVIDAD
              </span>
              <span className="absolute h-[1px] bg-neutral-300 w-full left-0 top-1/2 -z-0"></span>
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 pt-2 w-full animate-slide-in">
            {products.map((product) => (
              <Button 
                key={product.name}
                variant="outline"
                className="flex items-center gap-1 px-4"
                size="sm"
              >
                {product.icon}
                {product.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
