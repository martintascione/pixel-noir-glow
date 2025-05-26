
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Square, Hammer, Cable, Plug, Anchor } from 'lucide-react';
import { fetchProducts } from '@/services/api';
import { Product } from '@/types/products';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  onSelectProduct?: (product: Product) => void;
}

const Header = ({ onSelectProduct }: HeaderProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const { data, error } = await fetchProducts();
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        // Carga productos de respaldo en caso de error
        setProducts([
          { id: '1', name: 'Estribos', icon: <Square className="mr-1" />, type: 'construction', sizes: [] },
          { id: '2', name: 'Clavos', icon: <Hammer className="mr-1" />, type: 'hardware', sizes: [] },
          { id: '3', name: 'Alambres', icon: <Cable className="mr-1" />, type: 'construction', sizes: [] },
          { id: '4', name: 'Torniquetes', icon: <Plug className="mr-1" />, type: 'fencing', sizes: [] },
          { id: '5', name: 'Tranquerones', icon: <Anchor className="mr-1" />, type: 'fencing', sizes: [] },
        ]);
      } else {
        // Asignar iconos según el tipo de producto
        const productsWithIcons = data.map(product => {
          let icon;
          switch (product.name.toLowerCase()) {
            case 'estribos':
              icon = <Square className="mr-1" />;
              break;
            case 'clavos':
              icon = <Hammer className="mr-1" />;
              break;
            case 'alambres':
              icon = <Cable className="mr-1" />;
              break;
            case 'torniquetes':
              icon = <Plug className="mr-1" />;
              break;
            case 'tranquerones':
              icon = <Anchor className="mr-1" />;
              break;
            default:
              icon = <Square className="mr-1" />;
          }
          return { ...product, icon };
        });
        
        setProducts(productsWithIcons);
      }
      
      setLoading(false);
    };
    
    loadProducts();
  }, [toast]);

  const handleProductClick = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <header className="py-6 border-b border-border bg-white">
      <div className="container-custom">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-between w-full items-center">
            <div className="flex-1">
              {/* Admin button removed from here */}
            </div>
            <div className="flex justify-center flex-1">
              <img 
                src="/lovable-uploads/1faa8215-e986-441a-be71-2444d2af5c02.png" 
                alt="Hierros Tascione Logo" 
                className="h-14 md:h-16 w-auto object-contain animate-fade-in"
              />
            </div>
            <div className="flex-1"></div>
          </div>
          <div className="text-sm text-muted-foreground animate-fade-in text-center">
            <p>CUIT: 20-21856308-3</p>
            <p>LUIS MARIA TASCIONE</p>
            <p className="font-medium">30 DE AGOSTO BS.AS</p>
          </div>
          
          <div className="w-full max-w-lg mx-auto my-4">
            <p className="relative text-md md:text-lg font-medium tracking-wider text-center py-3 animate-fade-in">
              <span className="inline-block px-2 relative z-10 uppercase bg-white">
                AHORRA TIEMPO, SUMA PRODUCTIVIDAD
              </span>
              <span className="absolute h-[1px] bg-neutral-300 w-full left-0 top-1/2 -z-0"></span>
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 pt-2 w-full animate-slide-in">
            {loading ? (
              <div className="py-2 text-muted-foreground">Cargando productos...</div>
            ) : (
              products.map((product) => (
                <Button 
                  key={product.id}
                  variant="outline"
                  className="flex items-center gap-1 px-4"
                  size="sm"
                  onClick={() => handleProductClick(product)}
                >
                  {product.icon}
                  {product.name}
                </Button>
              ))
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
