-- Fix shift constraint on production_orders table
-- Drop existing shift constraint if it exists
ALTER TABLE public.production_orders 
DROP CONSTRAINT IF EXISTS production_orders_shift_check;

-- Add correct shift constraint that matches the application values
ALTER TABLE public.production_orders 
ADD CONSTRAINT production_orders_shift_check 
CHECK (shift IN ('morning', 'afternoon', 'night'));

-- Verify the constraint was created
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public' 
AND constraint_name = 'production_orders_shift_check';