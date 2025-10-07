-- Create production history table to archive all production records
CREATE TABLE public.production_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL,
  operator_id uuid,
  machine_id uuid,
  produced_quantity integer NOT NULL DEFAULT 0,
  reject_quantity integer NOT NULL DEFAULT 0,
  downtime_minutes integer NOT NULL DEFAULT 0,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  downtime_type_id uuid,
  downtime_start_time timestamp with time zone,
  downtime_end_time timestamp with time zone,
  downtime_description text,
  time_elapsed_minutes integer DEFAULT 0,
  efficiency_percentage numeric DEFAULT 0.00,
  production_rate_per_minute numeric DEFAULT 0.0000,
  previous_record_id uuid,
  cycle_time_minutes integer DEFAULT 0,
  -- Additional fields for historical context
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text DEFAULT 'manual_cleanup'
);

-- Enable RLS
ALTER TABLE public.production_history ENABLE ROW LEVEL SECURITY;

-- Create policy for production history
CREATE POLICY "Allow all operations on production_history" 
ON public.production_history 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add index for better performance on queries
CREATE INDEX idx_production_history_order_id ON public.production_history(order_id);
CREATE INDEX idx_production_history_machine_id ON public.production_history(machine_id);
CREATE INDEX idx_production_history_archived_at ON public.production_history(archived_at);

-- Add trigger for updated_at
CREATE TRIGGER update_production_history_updated_at
BEFORE UPDATE ON public.production_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();