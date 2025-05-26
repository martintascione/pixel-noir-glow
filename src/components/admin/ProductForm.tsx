
import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
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
  category: z.enum(['Estribos', 'Clavos', 'Alambres'], {
    required_error: 'La categoría es requerida'
  }),
  subcategory: z.enum(['4.2mm', '6mm']).optional(),
  shape: z.enum(['Cuadrado', 'Rectangular', 'Triangular']).optional(),
  sizes: z.array(
    z.object({
      size: z.string().min(1, 'La medida es requerida'),
      price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
    })
  ).min(1, 'Debe agregar al menos un tamaño'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData: Product | null;
  onSubmit: (data: ProductFormValues) => void;
  onCancel: () => void;
}

const ProductForm = ({ initialData, onSubmit, onCancel }: ProductFormProps) => {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: 'Estribos',
      sizes: [{ size: '', price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sizes',
  });

  const watchCategory = form.watch('category');

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const addSize = () => {
    append({ size: '', price: 0 });
  };

  const removeSize = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
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
                  <Input {...field} placeholder="Ej: Estribos Cuadrados" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Estribos">Estribos</SelectItem>
                    <SelectItem value="Clavos">Clavos</SelectItem>
                    <SelectItem value="Alambres">Alambres</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {watchCategory === 'Estribos' && (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategoría (Diámetro)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el diámetro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="4.2mm">4.2mm</SelectItem>
                      <SelectItem value="6mm">6mm</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shape"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          </div>
        )}

        <div className="border p-4 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Tamaños y Precios</h3>
            <Button type="button" variant="outline" size="sm" onClick={addSize}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Tamaño
            </Button>
          </div>
          
          {fields.map((field, index) => (
            <div key={field.id} className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Tamaño {index + 1}</h4>
                {fields.length > 1 && (
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
                      <FormLabel>Precio ($)</FormLabel>
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
