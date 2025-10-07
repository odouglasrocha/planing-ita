-- Add pallet_quantity column to production_orders table
ALTER TABLE public.production_orders 
ADD COLUMN pallet_quantity integer DEFAULT 0;