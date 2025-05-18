
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-6 border-t border-border bg-white mt-16">
      <div className="container-custom">
        <div className="flex flex-col items-center text-muted-foreground text-sm">
          <div className="text-center">
            <p>CUIT: 20-21856308-3</p>
            <p>LUIS MARIA TASCIONE</p>
            <p className="font-medium">30 DE AGOSTO BS.AS</p>
          </div>
          
          <div className="mt-6">
            <Link to="/admin/productos">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
