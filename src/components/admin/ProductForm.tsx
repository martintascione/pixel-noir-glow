
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, ProductSize } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Esquema de validación para el formulario
const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.string().min(1, 'El tipo es requerido'),
  sizes: z.array(
    z.object({
      size: z.string().min(1, 'La medida es requerida'),
      price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
      diameter: z.string().optional(),
      shape: z.string().optional(),
      nailType: z.string().optional(),
    })
  ).min(1, 'Debe agregar al menos un tamaño'),
  availableDiameters: z.array(z.string()).optional(),
  availableShapes: z.array(z.string()).optional(),
  availableNailTypes: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData: Product | null;
  onSubmit: (data: ProductFormValues) => void;
  onCancel: () => void;
}

const ProductForm = ({ initialData, onSubmit, onCancel }: ProductFormProps) => {
  const [productType, setProductType] = useState<string>(initialData?.type || 'construction');
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: '',
      type: 'construction',
      sizes: [{ size: '', price: 0 }],
      availableDiameters: [],
      availableShapes: [],
      availableNailTypes: [],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      setProductType(initialData.type);
    }
  }, [initialData, form]);

  const handleTypeChange = (type: string) => {
    setProductType(type);

    // Reiniciar los campos específicos según el tipo de producto
    const currentSizes = form.getValues('sizes');
    const updatedSizes = currentSizes.map(size => {
      const newSize = { ...size };
      
      // Limpiar los campos específicos que no corresponden al nuevo tipo
      if (type !== 'construction') {
        delete newSize.diameter;
        delete newSize.shape;
      }
      
      if (type !== 'hardware') {
        delete newSize.nailType;
      }
      
      return newSize;
    });

    form.setValue('sizes', updatedSizes);
    
    // Reiniciar los arrays de disponibles según el tipo
    if (type === 'construction') {
      form.setValue('availableDiameters', initialData?.availableDiameters || ['4.2', '6']);
      form.setValue('availableShapes', initialData?.availableShapes || ['Cuadrado', 'Rectangular', 'Triangular']);
      form.setValue('availableNailTypes', []);
    } else if (type === 'hardware') {
      form.setValue('availableDiameters', []);
      form.setValue('availableShapes', []);
      form.setValue('availableNailTypes', initialData?.availableNailTypes || ['Punta París', 'De Techo']);
    } else {
      form.setValue('availableDiameters', []);
      form.setValue('availableShapes', []);
      form.setValue('availableNailTypes', []);
    }
  };

  const addSize = () => {
    const currentSizes = form.getValues('sizes');
    const newSize: ProductSize = { size: '', price: 0 };
    
    // Agregar campos específicos según el tipo
    if (productType === 'construction') {
      newSize.diameter = '4.2';
      newSize.shape = 'Cuadrado';
    } else if (productType === 'hardware') {
      newSize.nailType = 'Punta París';
    }
    
    form.setValue('sizes', [...currentSizes, newSize]);
  };

  const removeSize = (index: number) => {
    const currentSizes = form.getValues('sizes');
    form.setValue('sizes', currentSizes.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Producto</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ej: Estribos" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Producto</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleTypeChange(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de producto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="construction">Construcción (Estribos)</SelectItem>
                    <SelectItem value="hardware">Ferretería (Clavos)</SelectItem>
                    <SelectItem value="fencing">Alambrado (Torniquetes/Tranquerones)</SelectItem>
                    <SelectItem value="wire">Alambres</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  El tipo determina qué campos adicionales se mostrarán.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border p-4 rounded-md">
          <h3 className="text-lg font-medium mb-4">Tamaños y Precios</h3>
          
          {form.watch('sizes').map((_, index) => (
            <div key={index} className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Tamaño {index + 1}</h4>
                {form.watch('sizes').length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeSize(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`sizes.${index}.size`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medida</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: 10x10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`sizes.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="0" 
                          step="0.01"
                          placeholder="Ej: 100.00" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {productType === 'construction' && (
                  <>
                    <FormField
                      control={form.control}
                      name={`sizes.${index}.diameter`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diámetro</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el diámetro" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="4.2">4.2 mm</SelectItem>
                              <SelectItem value="6">6 mm</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`sizes.${index}.shape`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forma</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona la forma" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Cuadrado">Cuadrado</SelectItem>
                              <SelectItem value="Rectangular">Rectangular</SelectItem>
                              <SelectItem value="Triangular">Triangular</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {productType === 'hardware' && (
                  <FormField
                    control={form.control}
                    name={`sizes.${index}.nailType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Clavo</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Punta París">Punta París</SelectItem>
                            <SelectItem value="De Techo">De Techo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          ))}

          <Button 
            type="button" 
            variant="outline" 
            onClick={addSize} 
            className="mt-4 w-full"
          >
            Agregar otro tamaño
          </Button>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {initialData ? 'Actualizar Producto' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
