import { supabase } from '@/integrations/supabase/client';
import { RemitoData } from './remitoService';

export interface SavedRemito {
  id: string;
  numero: string;
  fecha: string;
  client_id: string;
  user_id: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: SavedRemitoItem[];
  client?: {
    name: string;
    company_name: string;
    cuit: string;
  };
}

export interface SavedRemitoItem {
  id: string;
  remito_id: string;
  cantidad: number;
  medida: string;
  producto: string;
  precio_unitario: number;
  precio_total: number;
  created_at: string;
}

export const saveRemitoToDatabase = async (remitoData: RemitoData, clientId: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // Guardar el remito principal
  const { data: remito, error: remitoError } = await supabase
    .from('remitos')
    .insert({
      numero: remitoData.numero,
      fecha: remitoData.fecha,
      client_id: clientId,
      user_id: user.id,
      total: remitoData.total
    })
    .select()
    .single();

  if (remitoError) throw remitoError;

  // Guardar los items del remito
  const remitoItems = remitoData.items.map(item => ({
    remito_id: remito.id,
    cantidad: item.cantidad,
    medida: item.medida,
    producto: item.producto,
    precio_unitario: item.precioUnitario,
    precio_total: item.precioTotal
  }));

  const { error: itemsError } = await supabase
    .from('remito_items')
    .insert(remitoItems);

  if (itemsError) throw itemsError;

  return remito.id;
};

export const getRemitosByClientId = async (clientId: string): Promise<SavedRemito[]> => {
  const { data, error } = await supabase
    .from('remitos')
    .select(`
      *,
      remito_items(*),
      clients(name, company_name, cuit)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(remito => ({
    ...remito,
    items: remito.remito_items || [],
    client: remito.clients
  }));
};

export const getRemitoById = async (remitoId: string): Promise<SavedRemito | null> => {
  const { data, error } = await supabase
    .from('remitos')
    .select(`
      *,
      remito_items(*),
      clients(name, company_name, cuit)
    `)
    .eq('id', remitoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    ...data,
    items: data.remito_items || [],
    client: data.clients
  };
};

export const deleteRemito = async (remitoId: string): Promise<void> => {
  const { error } = await supabase
    .from('remitos')
    .delete()
    .eq('id', remitoId);

  if (error) throw error;
};

export const deleteMultipleRemitos = async (remitoIds: string[]): Promise<void> => {
  const { error } = await supabase
    .from('remitos')
    .delete()
    .in('id', remitoIds);

  if (error) throw error;
};