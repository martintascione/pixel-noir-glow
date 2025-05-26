
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, ProductSize } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import {
  Form,
  FormControl,
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

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['estribos', 'clavos', 'alambre'], { required_error: 'El tipo es requerido' }),
  sizes: z.array(
    z.object({
      size: z.string().min(1, 'La medida/nombre es requerida'),
      price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
      shape: z.string().optional(),
      name: z.string().optional(),
    })
  ).min(1, 'Debe agregar al menos un item'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData: Product | null;
  onSubmit: (data: ProductFormValues) => void;
  onCancel: () => void;
}

const ProductForm = ({ initialData, onSubmit, onCancel }: ProductFormProps) => {
  const [productType, setProductType] = useState<string>(initialData?.type || 'estribos');
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: '',
      type: 'estribos',
      sizes: [{ size: '', price: 0 }],
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
    
    // Limpiar sizes cuando cambia el tipo
    const currentSizes = form.getValues('sizes');
    const updatedSizes = currentSizes.map(() => ({ size: '', price: 0 }));
    form.setValue('sizes', updatedSizes);
  };

  const addSize = () => {
    const currentSizes = form.getValues('sizes');
    form.setValue('sizes', [...currentSizes, { size: '', price: 0 }]);
  };

  const removeSize = (index: number) => {
    const currentSizes = form.getValues('sizes');
    if (currentSizes.length > 1) {
      form.setValue('sizes', currentSizes.filter((_, i) => i !== index));
    }
  };

  const getShapeOptions = () => {
    if (productType === 'estribos') {
      return ['cuadrada', 'rectangular', 'triangular'];
    } else if (productType === 'clavos') {
      return ['Punta París', 'Clavo de Techo'];
    }
    return [];
  };

  const getFieldLabel = () => {
    if (productType === 'alambre') return 'Nombre del Alambre';
    return 'Medida';
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
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="estribos">Estribos</SelectItem>
                    <SelectItem value="clavos">Clavos</SelectItem>
                    <SelectItem value="alambre">Alambre</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border p-4 rounded-md">
          <h3 className="text-lg font-medium mb-4">
            {productType === 'alambre' ? 'Alambres y Precios' : 'Medidas y Precios'}
          </h3>
          
          {form.watch('sizes').map((_, index) => (
            <div key={index} className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Item {index + 1}</h4>
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

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name={`sizes.${index}.size`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getFieldLabel()}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={productType === 'alambre' ? 'Ej: Alambre 17/15' : 'Ej: 10x10'} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {productType !== 'alambre' && (
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
                            {getShapeOptions().map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
              </div>
            </div>
          ))}

          <Button 
            type="button" 
            variant="outline" 
            onClick={addSize} 
            className="mt-4 w-full"
          >
            Agregar otro {productType === 'alambre' ? 'alambre' : 'tamaño'}
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
