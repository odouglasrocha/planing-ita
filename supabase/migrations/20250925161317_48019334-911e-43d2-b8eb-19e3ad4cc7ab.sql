-- Adicionar coluna machine_id na tabela production_records para referenciar a máquina
ALTER TABLE production_records ADD COLUMN machine_id uuid REFERENCES machines(id);

-- Adicionar índice para melhor performance
CREATE INDEX idx_production_records_machine_id ON production_records(machine_id);

-- Atualizar registros existentes com machine_id baseado na order
UPDATE production_records 
SET machine_id = (
  SELECT po.machine_id 
  FROM production_orders po 
  WHERE po.id = production_records.order_id
)
WHERE machine_id IS NULL;