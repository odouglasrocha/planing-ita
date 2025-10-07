-- Check current constraints on production_orders table
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public' 
AND constraint_name LIKE '%production_orders%';

-- Drop the restrictive check constraint if it exists
ALTER TABLE public.production_orders 
DROP CONSTRAINT IF EXISTS production_orders_status_check;

-- Add a new check constraint that allows the correct status values
ALTER TABLE public.production_orders 
ADD CONSTRAINT production_orders_status_check 
CHECK (status IN ('pending', 'running', 'paused', 'completed', 'cancelled'));