-- Remover tipos de perda especificados (Manutenção, Outro, Qualidade e Setup/Troca)
DELETE FROM loss_types WHERE id IN (
  'a503c731-53dd-4d85-bedf-2965be82fb80', -- Manutenção
  '05b71764-0e5f-4636-adc5-649121fbb46e', -- Outro
  '81150899-d28c-48bd-a260-4a193c48a043', -- Qualidade
  '8f56aefd-d943-41f9-83fc-822583f65625'  -- Setup/Troca
);

-- Criar tabela para relatórios
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  format text NOT NULL DEFAULT 'pdf',
  parameters jsonb,
  file_path text,
  file_size bigint,
  status text NOT NULL DEFAULT 'generating',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for reports
CREATE POLICY "Users can view all reports" 
ON public.reports 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Criar trigger para updated_at em reports
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns relatórios de exemplo
INSERT INTO public.reports (name, type, format, file_size, status, completed_at) VALUES
('OEE Diário - 23/09/2024', 'oee-daily', 'pdf', 2457600, 'completed', now() - interval '5 hours'),
('Produção Turno Tarde - 23/09/2024', 'production-summary', 'excel', 1887436, 'completed', now() - interval '10 hours'),
('Análise Perdas Semanal', 'losses-analysis', 'pdf', 3252224, 'completed', now() - interval '1 day');