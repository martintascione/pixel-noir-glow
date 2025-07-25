import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const { signIn, signUp, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Estados para Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Estados para Registro
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    companyLegalName: '',
    companyCuit: '',
    whatsappNumber: '',
    requiresInvoiceA: false,
    acceptsNotifications: false,
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      if (isAdmin()) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate, isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Error de acceso",
            description: "Email o contraseña incorrectos",
            variant: "destructive",
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email no confirmado",
            description: "Por favor, confirma tu email antes de iniciar sesión",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });
        // Redirigir al admin si es administrador, sino a la página principal
        if (loginEmail === 'admin@hierrostascione.shop') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!/^\d{2}-\d{8}-\d{1}$/.test(registerData.companyCuit)) {
      toast({
        title: "Error",
        description: "El CUIT debe tener el formato XX-XXXXXXXX-X",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        companyName: registerData.companyName,
        companyLegalName: registerData.companyLegalName,
        companyCuit: registerData.companyCuit,
        whatsappNumber: registerData.whatsappNumber,
        requiresInvoiceA: registerData.requiresInvoiceA,
        acceptsNotifications: registerData.acceptsNotifications,
      });
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Usuario ya existe",
            description: "Ya existe una cuenta con este email",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "¡Registro exitoso!",
          description: "Por favor, revisa tu email para confirmar tu cuenta",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRegisterData = (field: string, value: any) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
  };

  // Función para formatear CUIT automáticamente
  const formatCuit = (value: string) => {
    // Remover todos los caracteres que no sean números
    const numbers = value.replace(/\D/g, '');
    
    // Aplicar formato XX-XXXXXXXX-X
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
    updateRegisterData('companyCuit', formattedCuit);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sistema de Gestión</CardTitle>
          <CardDescription>
            Accede a tu cuenta o regístrate para comenzar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Datos Personales */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      placeholder="Tu nombre"
                      value={registerData.firstName}
                      onChange={(e) => updateRegisterData('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      placeholder="Tu apellido"
                      value={registerData.lastName}
                      onChange={(e) => updateRegisterData('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email *</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={registerData.email}
                    onChange={(e) => updateRegisterData('email', e.target.value)}
                    required
                  />
                </div>

                {/* Contraseñas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={registerData.password}
                        onChange={(e) => updateRegisterData('password', e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      >
                        {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Repetir Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirma tu contraseña"
                        value={registerData.confirmPassword}
                        onChange={(e) => updateRegisterData('confirmPassword', e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Datos de Empresa */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Datos de la Empresa</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                    <Input
                      id="companyName"
                      placeholder="Nombre comercial de tu empresa"
                      value={registerData.companyName}
                      onChange={(e) => updateRegisterData('companyName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyLegalName">Razón Social *</Label>
                    <Input
                      id="companyLegalName"
                      placeholder="Razón social completa"
                      value={registerData.companyLegalName}
                      onChange={(e) => updateRegisterData('companyLegalName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyCuit">CUIT de la Empresa *</Label>
                    <Input
                      id="companyCuit"
                      placeholder="XX-XXXXXXXX-X"
                      value={registerData.companyCuit}
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
                      value={registerData.whatsappNumber}
                      onChange={(e) => updateRegisterData('whatsappNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresInvoiceA"
                      checked={registerData.requiresInvoiceA}
                      onCheckedChange={(checked) => updateRegisterData('requiresInvoiceA', checked)}
                    />
                    <Label htmlFor="requiresInvoiceA" className="text-sm">
                      Requiero factura A para este CUIT
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptsNotifications"
                      checked={registerData.acceptsNotifications}
                      onCheckedChange={(checked) => updateRegisterData('acceptsNotifications', checked)}
                    />
                    <Label htmlFor="acceptsNotifications" className="text-sm">
                      Acepto recibir notificaciones por email o WhatsApp con detalles de mi orden
                    </Label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Registrando...' : 'Crear Cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;