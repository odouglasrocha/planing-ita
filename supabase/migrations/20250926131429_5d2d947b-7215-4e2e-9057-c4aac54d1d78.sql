-- Add efficiency tracking fields to production_records
ALTER TABLE public.production_records 
ADD COLUMN time_elapsed_minutes INTEGER DEFAULT 0,
ADD COLUMN efficiency_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN production_rate_per_minute DECIMAL(10,4) DEFAULT 0.0000,
ADD COLUMN previous_record_id UUID REFERENCES public.production_records(id),
ADD COLUMN cycle_time_minutes INTEGER DEFAULT 0;

-- Create function to calculate production efficiency
CREATE OR REPLACE FUNCTION public.calculate_production_efficiency()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
    previous_record RECORD;
    time_diff INTEGER;
    current_rate DECIMAL(10,4);
    efficiency DECIMAL(5,2);
BEGIN
    -- Only calculate for production records (not downtime-only records)
    IF NEW.produced_quantity > 0 THEN
        -- Find the most recent production record for the same order and machine
        SELECT * INTO previous_record
        FROM production_records 
        WHERE order_id = NEW.order_id 
        AND machine_id = NEW.machine_id
        AND produced_quantity > 0
        AND id != NEW.id
        ORDER BY recorded_at DESC 
        LIMIT 1;

        IF previous_record IS NOT NULL THEN
            -- Calculate time elapsed in minutes
            time_diff := EXTRACT(EPOCH FROM (NEW.recorded_at - previous_record.recorded_at)) / 60;
            
            -- Set time elapsed and previous record reference
            NEW.time_elapsed_minutes := time_diff;
            NEW.previous_record_id := previous_record.id;
            
            IF time_diff > 0 THEN
                -- Calculate current production rate (units per minute)
                current_rate := NEW.produced_quantity::DECIMAL / time_diff;
                NEW.production_rate_per_minute := current_rate;
                
                -- Calculate cycle time (minutes per unit)
                NEW.cycle_time_minutes := time_diff / NEW.produced_quantity;
                
                -- Calculate efficiency based on production rate improvement
                -- If we have a previous rate, compare; otherwise assume 100% for first calculation
                IF previous_record.production_rate_per_minute > 0 THEN
                    efficiency := (current_rate / previous_record.production_rate_per_minute) * 100;
                    -- Cap efficiency at reasonable limits
                    NEW.efficiency_percentage := LEAST(GREATEST(efficiency, 0), 200);
                ELSE
                    NEW.efficiency_percentage := 100.00;
                END IF;
            END IF;
        ELSE
            -- First record for this order/machine combination
            NEW.time_elapsed_minutes := 0;
            NEW.efficiency_percentage := 100.00;
            NEW.production_rate_per_minute := 0.0000;
            NEW.cycle_time_minutes := 0;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- Create trigger to automatically calculate efficiency on insert
CREATE TRIGGER calculate_production_efficiency_trigger
    BEFORE INSERT ON public.production_records
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_production_efficiency();

-- Update existing records to have default values
UPDATE public.production_records 
SET 
    time_elapsed_minutes = 0,
    efficiency_percentage = 100.00,
    production_rate_per_minute = 0.0000,
    cycle_time_minutes = 0
WHERE time_elapsed_minutes IS NULL;