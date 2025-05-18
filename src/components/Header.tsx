
import React from 'react';

const Header = () => {
  return (
    <header className="bg-card py-6 border-b border-border">
      <div className="container-custom">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight animate-fade-in">
            HIERROS TASCIONE
          </h1>
          <p className="text-sm text-muted-foreground animate-fade-in">
            CUIT: 20-21856308-3
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
