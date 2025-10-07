-- Criar usuários demo no sistema de autenticação
-- Nota: Como não podemos inserir diretamente na tabela auth.users via SQL,
-- vamos criar uma tabela de perfis que será usada para gerenciar os usuários

-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operador',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Allow insert during signup"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Inserir perfis dos usuários demo (serão linkados quando os usuários se registrarem)
INSERT INTO public.profiles (email, full_name, role) VALUES
  ('admin@oee.com', 'João Silva', 'admin'),
  ('supervisor@oee.com', 'Maria Santos', 'supervisor'),
  ('operador@oee.com', 'Pedro Costa', 'operador')
ON CONFLICT (email) DO NOTHING;

-- Função para atualizar o timestamp updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Função para lidar com novos usuários (será chamada quando um usuário se registrar)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função quando um usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();