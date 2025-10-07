-- Corrigir problemas de segurança nas funções

-- Recriar a função update_updated_at_column com search_path seguro
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

-- Recriar a função handle_new_user com search_path seguro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET user_id = NEW.id 
  WHERE email = NEW.email;
  
  -- Se não encontrar um perfil existente, criar um novo
  IF NOT FOUND THEN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'), 'operador');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;