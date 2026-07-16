import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Tags, Gift, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCategories, getProducts, getCombos } from '@/services/supabaseService';
import CategoryManager from '@/components/admin/CategoryManager';
import ProductManager from '@/components/admin/ProductManager';
import ComboManager from '@/components/admin/ComboManager';
import ClientManager from '@/components/admin/ClientManager';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  const { data: combos = [], isLoading: loadingCombos } = useQuery({
    queryKey: ['combos'],
    queryFn: () => getCombos(),
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  if (loadingCategories || loadingProducts || loadingCombos || loadingClients) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center">
        <Link to="/" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
      </div>

      <div className="mb-6 flex gap-4">
        <Link to="/admin/costos">
          <Button variant="outline">
            Página de Costos
          </Button>
        </Link>
        <Link to="/admin/remitos">
          <Button variant="outline">
            Generar Remito
          </Button>
        </Link>
      </div>


      {/* Pestañas de gestión */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="combos">Combos</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <CategoryManager categories={categories} />
        </TabsContent>
        
        <TabsContent value="products">
          <ProductManager categories={categories} products={products} />
        </TabsContent>
        
        <TabsContent value="combos">
          <ComboManager products={products} combos={combos} />
        </TabsContent>
        
        <TabsContent value="clients">
          <ClientManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;