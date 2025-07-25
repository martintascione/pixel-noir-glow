
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import ProfileEdit from "./pages/ProfileEdit";
import Auth from "./pages/Auth";
import RemitosGenerator from "./pages/RemitosGenerator";
import AdminCostos from "./pages/AdminCostos";
import { ClientRemitoHistory } from "@/components/admin/ClientRemitoHistory";
import { RemitoDetailView } from "@/components/admin/RemitoDetailView";

const queryClient = new QueryClient();

// El componente TooltipProvider debe estar dentro del componente App
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/profile/edit" 
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/remitos" 
              element={
                <ProtectedRoute>
                  <RemitosGenerator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/clientes/:clientId/remitos" 
              element={
                <ProtectedRoute>
                  <ClientRemitoHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/remitos/view/:remitoId" 
              element={
                <ProtectedRoute>
                  <RemitoDetailView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/costos" 
              element={
                <ProtectedRoute>
                  <AdminCostos />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
