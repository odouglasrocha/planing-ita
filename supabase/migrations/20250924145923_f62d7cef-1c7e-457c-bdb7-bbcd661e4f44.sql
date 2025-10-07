-- Criar tabela para tipos de perdas
CREATE TABLE public.loss_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  color TEXT NOT NULL DEFAULT 'bg-gray-500',
  icon TEXT NOT NULL DEFAULT '❓',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.loss_types ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas operações
CREATE POLICY "Allow all operations on loss_types" 
ON public.loss_types 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar tabela para registros de perdas
CREATE TABLE public.material_losses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID REFERENCES public.machines(id),
  loss_type_id UUID NOT NULL REFERENCES public.loss_types(id),
  order_id UUID REFERENCES public.production_orders(id),
  operator_id UUID REFERENCES public.operators(id),
  amount DECIMAL(10,3) NOT NULL,
  reason TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.material_losses ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas operações
CREATE POLICY "Allow all operations on material_losses" 
ON public.material_losses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Inserir tipos de perdas padrão
INSERT INTO public.loss_types (name, unit, color, icon, description) VALUES
('Embalagem (Filme)', 'und', 'bg-red-500', '🎞️', 'Perdas de filme de embalagem'),
('Orgânico', 'kg', 'bg-orange-500', '🌿', 'Perdas de material orgânico'),
('Setup/Troca', 'kg', 'bg-yellow-500', '🔧', 'Perdas durante setup ou troca de produto'),
('Qualidade', 'kg', 'bg-purple-500', '❌', 'Perdas por problemas de qualidade'),
('Manutenção', 'kg', 'bg-blue-500', '⚙️', 'Perdas durante manutenção'),
('Outro', 'kg', 'bg-gray-500', '❓', 'Outras perdas');

-- Criar trigger para updated_at nas tabelas
CREATE TRIGGER update_loss_types_updated_at
BEFORE UPDATE ON public.loss_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_material_losses_updated_at
BEFORE UPDATE ON public.material_losses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();