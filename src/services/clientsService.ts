import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company_name: string;
  company_legal_name?: string;
  cuit: string;
  whatsapp_number?: string;
  created_at: string;
  updated_at: string;
}

export const getClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createClient = async (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...client,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateClient = async (id: string, updates: Partial<Client>) => {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteClient = async (id: string) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
};