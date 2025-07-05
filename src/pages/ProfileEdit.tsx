import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, User, Building, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ProfileEdit = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    companyLegalName: '',
    companyCuit: '',
    whatsappNumber: '',
    requiresInvoiceA: false,
    acceptsNotifications: false,
  });

  // Cargar los datos del perfil al montar el componente
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        companyName: profile.company_name || '',
        companyLegalName: profile.company_legal_name || '',
        companyCuit: profile.company_cuit || '',
        whatsappNumber: profile.whatsapp_number || '',
        requiresInvoiceA: profile.requires_invoice_a || false,
        acceptsNotifications: profile.accepts_notifications || false,
      });
    }
  }, [profile]);

  // Función para formatear CUIT automáticamente
  const formatCuit = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    let formatted = numbers;
    if (numbers.length >= 2) {
      formatted = numbers.slice(0, 2) + '-' + numbers.slice(2);
    }
    if (numbers.length >= 10) {
      formatted = numbers.slice(0, 2) + '-' + numbers.slice(2, 10) + '-' + numbers.slice(10, 11);
    }
    
    return formatted;
  };

  const handleCuitChange = (value: string) => {
    const formattedCuit = formatCuit(value);
    setFormData(prev => ({ ...prev, companyCuit: formattedCuit }));
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones
    if (!/^\d{2}-\d{8}-\d{1}$/.test(formData.companyCuit)) {
      toast({
        title: "Error",
        description: "El CUIT debe tener el formato XX-XXXXXXXX-X",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          company_name: formData.companyName,
          company_legal_name: formData.companyLegalName,
          company_cuit: formData.companyCuit,
          whatsapp_number: formData.whatsappNumber,
          requires_invoice_a: formData.requiresInvoiceA,
          accepts_notifications: formData.acceptsNotifications,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "¡Información actualizada!",
        description: "Tu perfil ha sido actualizado correctamente",
      });
      
      // Refrescar la página para que se actualice el contexto
      window.location.reload();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la información",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Debes iniciar sesión para acceder a esta página</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Editar Mi Información</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información Personal y de Empresa</CardTitle>
            <CardDescription>
              Actualiza tu información personal y datos de tu empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos Personales */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Datos Personales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      placeholder="Tu nombre"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      placeholder="Tu apellido"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Datos de Empresa */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Datos de la Empresa
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                    <Input
                      id="companyName"
                      placeholder="Nombre comercial de tu empresa"
                      value={formData.companyName}
                      onChange={(e) => updateFormData('companyName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyLegalName">Razón Social *</Label>
                    <Input
                      id="companyLegalName"
                      placeholder="Razón social completa"
                      value={formData.companyLegalName}
                      onChange={(e) => updateFormData('companyLegalName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyCuit">CUIT de la Empresa *</Label>
                      <Input
                        id="companyCuit"
                        placeholder="XX-XXXXXXXX-X"
                        value={formData.companyCuit}
                        onChange={(e) => handleCuitChange(e.target.value)}
                        maxLength={13}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsappNumber">Número de WhatsApp *</Label>
                      <Input
                        id="whatsappNumber"
                        placeholder="+54 9 11 1234-5678"
                        value={formData.whatsappNumber}
                        onChange={(e) => updateFormData('whatsappNumber', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Preferencias */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Preferencias
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresInvoiceA"
                      checked={formData.requiresInvoiceA}
                      onCheckedChange={(checked) => updateFormData('requiresInvoiceA', checked)}
                    />
                    <Label htmlFor="requiresInvoiceA" className="text-sm">
                      Requiero factura A para este CUIT
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptsNotifications"
                      checked={formData.acceptsNotifications}
                      onCheckedChange={(checked) => updateFormData('acceptsNotifications', checked)}
                    />
                    <Label htmlFor="acceptsNotifications" className="text-sm">
                      Acepto recibir notificaciones por email o WhatsApp con detalles de mi orden
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileEdit;