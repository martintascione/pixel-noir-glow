
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-6 border-t border-border bg-white mt-16">
      <div className="container-custom">
        <div className="flex flex-col items-center text-muted-foreground text-sm">
          <p>© {currentYear} Hierros Tascione. Todos los derechos reservados.</p>
          <div className="mt-2">
            <p>CUIT: 20-21856308-3</p>
            <p>LUIS MARIA TASCIONE</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
