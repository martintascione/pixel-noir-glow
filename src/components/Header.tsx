
import React from 'react';
import { Square } from "lucide-react";

const Header = () => {
  return (
    <header className="py-6 border-b border-border bg-white">
      <div className="container-custom">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-3">
            <Square size={30} strokeWidth={2.5} className="text-slate-700" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight animate-fade-in">
              HIERROS TASCIONE
            </h1>
          </div>
          <p className="text-sm text-muted-foreground animate-fade-in">
            CUIT: 20-21856308-3
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
