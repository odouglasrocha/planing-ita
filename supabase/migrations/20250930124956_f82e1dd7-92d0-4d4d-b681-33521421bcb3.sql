-- Função para calcular OEE de uma máquina em um período
CREATE OR REPLACE FUNCTION calculate_machine_oee(
  p_machine_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  availability NUMERIC,
  performance NUMERIC,
  quality NUMERIC,
  oee NUMERIC
) AS $$
DECLARE
  v_total_minutes INTEGER;
  v_downtime_minutes INTEGER;
  v_operating_time INTEGER;
  v_total_produced INTEGER;
  v_total_rejects INTEGER;
  v_good_units INTEGER;
  v_avg_cycle_time NUMERIC;
  v_theoretical_production NUMERIC;
  v_availability NUMERIC;
  v_performance NUMERIC;
  v_quality NUMERIC;
  v_oee NUMERIC;
BEGIN
  -- Calculate time metrics
  SELECT 
    COALESCE(SUM(time_elapsed_minutes), 0),
    COALESCE(SUM(downtime_minutes), 0)
  INTO v_total_minutes, v_downtime_minutes
  FROM production_records
  WHERE machine_id = p_machine_id
    AND recorded_at BETWEEN p_start_date AND p_end_date;
  
  v_operating_time := v_total_minutes - v_downtime_minutes;
  
  -- Calculate production metrics
  SELECT 
    COALESCE(SUM(produced_quantity), 0),
    COALESCE(SUM(reject_quantity), 0),
    COALESCE(AVG(NULLIF(cycle_time_minutes, 0)), 1)
  INTO v_total_produced, v_total_rejects, v_avg_cycle_time
  FROM production_records
  WHERE machine_id = p_machine_id
    AND recorded_at BETWEEN p_start_date AND p_end_date;
  
  v_good_units := v_total_produced - v_total_rejects;
  
  -- Calculate OEE components
  v_availability := CASE 
    WHEN v_total_minutes > 0 THEN (v_operating_time::NUMERIC / v_total_minutes) * 100
    ELSE 0 
  END;
  
  v_theoretical_production := CASE 
    WHEN v_avg_cycle_time > 0 THEN v_operating_time / v_avg_cycle_time
    ELSE v_total_produced 
  END;
  
  v_performance := CASE 
    WHEN v_theoretical_production > 0 THEN (v_total_produced::NUMERIC / v_theoretical_production) * 100
    ELSE 0 
  END;
  
  v_quality := CASE 
    WHEN v_total_produced > 0 THEN (v_good_units::NUMERIC / v_total_produced) * 100
    ELSE 0 
  END;
  
  v_oee := (v_availability * v_performance * v_quality) / 10000;
  
  RETURN QUERY SELECT v_availability, v_performance, v_quality, v_oee;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de produção por máquina
CREATE OR REPLACE FUNCTION get_machine_statistics(
  p_machine_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_produced INTEGER,
  total_rejects INTEGER,
  total_downtime INTEGER,
  avg_efficiency NUMERIC,
  avg_cycle_time NUMERIC,
  quality_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(pr.produced_quantity), 0)::INTEGER as total_produced,
    COALESCE(SUM(pr.reject_quantity), 0)::INTEGER as total_rejects,
    COALESCE(SUM(pr.downtime_minutes), 0)::INTEGER as total_downtime,
    ROUND(COALESCE(AVG(pr.efficiency_percentage), 0), 2) as avg_efficiency,
    ROUND(COALESCE(AVG(NULLIF(pr.cycle_time_minutes, 0)), 0), 2) as avg_cycle_time,
    CASE 
      WHEN SUM(pr.produced_quantity) > 0 THEN
        ROUND(((SUM(pr.produced_quantity) - SUM(pr.reject_quantity))::NUMERIC / SUM(pr.produced_quantity)) * 100, 2)
      ELSE 0
    END as quality_rate
  FROM production_records pr
  WHERE pr.machine_id = p_machine_id
    AND pr.recorded_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Função para obter perdas totais por tipo
CREATE OR REPLACE FUNCTION get_losses_by_type(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_machine_id UUID DEFAULT NULL
)
RETURNS TABLE (
  loss_type_name TEXT,
  total_amount NUMERIC,
  loss_count BIGINT,
  unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lt.name as loss_type_name,
    COALESCE(SUM(ml.amount), 0) as total_amount,
    COUNT(ml.id) as loss_count,
    lt.unit
  FROM loss_types lt
  LEFT JOIN material_losses ml ON ml.loss_type_id = lt.id
    AND ml.recorded_at BETWEEN p_start_date AND p_end_date
    AND (p_machine_id IS NULL OR ml.machine_id = p_machine_id)
  GROUP BY lt.id, lt.name, lt.unit
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para obter análise de paradas por tipo
CREATE OR REPLACE FUNCTION get_downtime_analysis(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_machine_id UUID DEFAULT NULL
)
RETURNS TABLE (
  downtime_type_name TEXT,
  downtime_category TEXT,
  total_minutes INTEGER,
  occurrence_count BIGINT,
  avg_duration NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.name as downtime_type_name,
    dt.category as downtime_category,
    COALESCE(SUM(pr.downtime_minutes), 0)::INTEGER as total_minutes,
    COUNT(pr.id) as occurrence_count,
    ROUND(COALESCE(AVG(pr.downtime_minutes), 0), 2) as avg_duration
  FROM downtime_types dt
  LEFT JOIN production_records pr ON pr.downtime_type_id = dt.id
    AND pr.recorded_at BETWEEN p_start_date AND p_end_date
    AND pr.downtime_minutes > 0
    AND (p_machine_id IS NULL OR pr.machine_id = p_machine_id)
  GROUP BY dt.id, dt.name, dt.category
  ORDER BY total_minutes DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para obter tendências diárias
CREATE OR REPLACE FUNCTION get_daily_trends(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_machine_id UUID DEFAULT NULL
)
RETURNS TABLE (
  trend_date DATE,
  total_produced INTEGER,
  total_rejects INTEGER,
  total_downtime INTEGER,
  avg_efficiency NUMERIC,
  quality_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(pr.recorded_at) as trend_date,
    COALESCE(SUM(pr.produced_quantity), 0)::INTEGER as total_produced,
    COALESCE(SUM(pr.reject_quantity), 0)::INTEGER as total_rejects,
    COALESCE(SUM(pr.downtime_minutes), 0)::INTEGER as total_downtime,
    ROUND(COALESCE(AVG(pr.efficiency_percentage), 0), 2) as avg_efficiency,
    CASE 
      WHEN SUM(pr.produced_quantity) > 0 THEN
        ROUND(((SUM(pr.produced_quantity) - SUM(pr.reject_quantity))::NUMERIC / SUM(pr.produced_quantity)) * 100, 2)
      ELSE 0
    END as quality_rate
  FROM production_records pr
  WHERE pr.recorded_at BETWEEN p_start_date AND p_end_date
    AND (p_machine_id IS NULL OR pr.machine_id = p_machine_id)
  GROUP BY DATE(pr.recorded_at)
  ORDER BY trend_date;
END;
$$ LANGUAGE plpgsql;