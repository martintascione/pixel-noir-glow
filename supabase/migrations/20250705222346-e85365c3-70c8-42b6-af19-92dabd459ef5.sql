-- Agregar campo de WhatsApp a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN whatsapp_number TEXT;