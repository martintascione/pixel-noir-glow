
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-card py-6 border-t border-border mt-16">
      <div className="container-custom">
        <div className="flex justify-center text-muted-foreground text-sm">
          <p>© {currentYear} Hierros Tascione. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
