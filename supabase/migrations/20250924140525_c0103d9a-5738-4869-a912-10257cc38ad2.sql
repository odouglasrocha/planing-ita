-- Create downtime_types table
CREATE TABLE public.downtime_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'equipment', -- equipment, material, operator, other
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.downtime_types ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on downtime_types" 
ON public.downtime_types 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Insert default downtime types
INSERT INTO public.downtime_types (name, description, category) VALUES
('Quebra de Máquina', 'Falha mecânica ou elétrica na máquina', 'equipment'),
('Falta de Material', 'Ausência de matéria-prima ou insumos', 'material'),
('Troca de Ferramenta', 'Tempo para troca de ferramentas ou setup', 'equipment'),
('Falta de Operador', 'Ausência do operador designado', 'operator'),
('Manutenção Preventiva', 'Manutenção programada da máquina', 'equipment'),
('Problema de Qualidade', 'Ajustes por problemas de qualidade', 'other'),
('Reunião/Treinamento', 'Parada para reunião ou treinamento', 'operator'),
('Limpeza/Organização', 'Tempo para limpeza e organização', 'other');

-- Add trigger for updated_at
CREATE TRIGGER update_downtime_types_updated_at
  BEFORE UPDATE ON public.downtime_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add downtime tracking fields to production_records
ALTER TABLE public.production_records 
ADD COLUMN downtime_type_id UUID REFERENCES public.downtime_types(id),
ADD COLUMN downtime_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN downtime_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN downtime_description TEXT;