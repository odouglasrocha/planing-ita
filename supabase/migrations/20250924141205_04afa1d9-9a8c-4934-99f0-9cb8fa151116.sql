-- Update the check constraint to match the code expectations
-- The code uses 'running' but constraint was expecting 'in_progress'
ALTER TABLE public.production_orders 
DROP CONSTRAINT production_orders_status_check;

ALTER TABLE public.production_orders 
ADD CONSTRAINT production_orders_status_check 
CHECK (status IN ('pending', 'running', 'paused', 'completed', 'cancelled'));