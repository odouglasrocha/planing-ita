-- Fix search_path security warnings for all functions
ALTER FUNCTION calculate_machine_oee(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) SET search_path = public;
ALTER FUNCTION get_machine_statistics(UUID, INTEGER) SET search_path = public;
ALTER FUNCTION get_losses_by_type(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) SET search_path = public;
ALTER FUNCTION get_downtime_analysis(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) SET search_path = public;
ALTER FUNCTION get_daily_trends(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) SET search_path = public;