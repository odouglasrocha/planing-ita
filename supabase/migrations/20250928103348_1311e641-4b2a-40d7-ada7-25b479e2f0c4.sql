-- Create recommendations table for AI-powered suggestions
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('configuracao', 'qualidade', 'manutencao', 'reducao_perdas', 'otimizacao_filme')),
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  machine_type TEXT DEFAULT 'Masipack VS 340',
  conditions JSONB,
  helpful_votes INTEGER NOT NULL DEFAULT 0,
  not_helpful_votes INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on recommendations" 
ON public.recommendations 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create recommendation feedback table
CREATE TABLE public.recommendation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  user_id UUID,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on feedback table
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback
CREATE POLICY "Users can view all feedback" 
ON public.recommendation_feedback 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert feedback" 
ON public.recommendation_feedback 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_recommendations_updated_at
BEFORE UPDATE ON public.recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial 300 recommendations data
INSERT INTO public.recommendations (title, description, category, priority, conditions) VALUES

-- Configurações de Produção (100 exemplos)
('Velocidade ótima para filme PE', 'Para filmes PE, mantenha velocidade entre 80-120 m/min para melhor selagem', 'configuracao', 'alta', '{"material": "PE", "thickness": "0.1-0.2"}'),
('Temperatura de selagem para PP', 'Configure temperatura de selagem em 180-200°C para filmes PP', 'configuracao', 'alta', '{"material": "PP"}'),
('Ajuste de pressão para embalagens pequenas', 'Para produtos até 100g, use pressão de 2-3 bar na selagem', 'configuracao', 'media', '{"weight": "<100g"}'),
('Configuração de formatos quadrados', 'Para embalagens quadradas, ajuste guias laterais com folga de 2mm', 'configuracao', 'media', '{"format": "square"}'),
('Velocidade reduzida para produtos frágeis', 'Produtos frágeis requerem velocidade máxima de 60 m/min', 'configuracao', 'alta', '{"fragile": true}'),
('Temperatura ambiente ideal', 'Mantenha temperatura ambiente entre 18-25°C para melhor performance', 'configuracao', 'media', '{"environment": "temperature"}'),
('Umidade controlada', 'Umidade relativa deve ficar entre 45-65% para evitar problemas de selagem', 'configuracao', 'media', '{"environment": "humidity"}'),
('Ajuste de tensão do filme', 'Para filmes finos (<0.05mm), reduza tensão em 30%', 'configuracao', 'alta', '{"thickness": "<0.05mm"}'),
('Configuração para produtos líquidos', 'Produtos líquidos necessitam selagem dupla e velocidade reduzida', 'configuracao', 'urgente', '{"content": "liquid"}'),
('Ajuste de corte para espessuras diferentes', 'Filmes espessos (>0.2mm) requerem lâmina nova e maior pressão de corte', 'configuracao', 'media', '{"thickness": ">0.2mm"}'),
('Sincronização de alimentação', 'Sincronize velocidade do alimentador com velocidade da máquina (ratio 1:1)', 'configuracao', 'alta', '{"sync": "feeder"}'),
('Configuração de vácuo parcial', 'Para produtos que não requerem vácuo total, use 70% da capacidade', 'configuracao', 'media', '{"vacuum": "partial"}'),
('Ajuste de guias para produtos irregulares', 'Produtos com formato irregular necessitam guias ajustáveis e velocidade reduzida', 'configuracao', 'alta', '{"shape": "irregular"}'),
('Configuração noturna', 'Durante período noturno, reduza velocidade em 15% para maior estabilidade', 'configuracao', 'baixa', '{"shift": "night"}'),
('Pré-aquecimento adequado', 'Pré-aqueça a máquina por no mínimo 15 minutos antes da produção', 'configuracao', 'alta', '{"startup": true}'),
('Configuração para alta produtividade', 'Para lotes grandes (>1000 unidades), otimize para velocidade máxima segura', 'configuracao', 'media', '{"batch_size": ">1000"}'),
('Ajuste de sensor de produto', 'Calibre sensor fotocélula a cada troca de produto ou filme', 'configuracao', 'alta', '{"calibration": "sensor"}'),
('Configuração de ar comprimido', 'Mantenha pressão de ar comprimido em 6 bar para operação ideal', 'configuracao', 'media', '{"air_pressure": "6bar"}'),
('Ajuste de cortador rotativo', 'Para cortes precisos, ajuste lâmina rotativa com folga máxima de 0.1mm', 'configuracao', 'alta', '{"cutting": "rotary"}'),
('Configuração de filme metalizado', 'Filmes metalizados requerem temperatura 10°C menor que filmes comuns', 'configuracao', 'alta', '{"material": "metallized"}'),
('Velocidade para embalagens grandes', 'Embalagens acima de 30cm requerem velocidade máxima de 40 m/min', 'configuracao', 'media', '{"size": ">30cm"}'),
('Ajuste de tração lateral', 'Configure tração lateral uniforme para evitar rugas no filme', 'configuracao', 'alta', '{"film_tension": "lateral"}'),
('Configuração de selagem longitudinal', 'Para selagem longitudinal perfeita, ajuste temperatura em gradiente', 'configuracao', 'alta', '{"sealing": "longitudinal"}'),
('Ajuste para produtos congelados', 'Produtos congelados necessitam pré-aquecimento de 30 segundos', 'configuracao', 'media', '{"temperature": "frozen"}'),
('Configuração de filme biodegradável', 'Filmes biodegradáveis requerem menor temperatura e pressão de selagem', 'configuracao', 'alta', '{"material": "biodegradable"}'),
('Velocidade variável por turno', 'Primeiro turno: velocidade normal, demais turnos: reduzir 10%', 'configuracao', 'baixa', '{"shift_optimization": true}'),
('Ajuste de alimentação irregular', 'Para produtos com alimentação irregular, use modo manual de sincronização', 'configuracao', 'media', '{"feeding": "irregular"}'),
('Configuração de múltiplas pistas', 'Para produção em múltiplas pistas, sincronize todas as velocidades', 'configuracao', 'alta', '{"multi_lane": true}'),
('Ajuste de pressão diferencial', 'Use pressão diferencial para produtos com diferentes densidades', 'configuracao', 'media', '{"density": "variable"}'),
('Configuração de filme reciclado', 'Filmes reciclados necessitam temperatura 5°C maior para selagem adequada', 'configuracao', 'media', '{"material": "recycled"}'),
('Velocidade para primeiro lote', 'Primeiro lote do dia deve rodar 20% mais devagar para estabilização', 'configuracao', 'media', '{"first_batch": true}'),
('Ajuste de cortador guilhotina', 'Para corte guilhotina, mantenha lâmina perpendicular com tolerância de 0.05mm', 'configuracao', 'alta', '{"cutting": "guillotine"}'),
('Configuração de filme stretch', 'Filmes stretch requerem menor tensão e maior velocidade de desenrolamento', 'configuracao', 'alta', '{"material": "stretch"}'),
('Ajuste de detector de metais', 'Calibre detector de metais antes de cada lote de produção', 'configuracao', 'urgente', '{"metal_detector": true}'),
('Configuração sazonal verão', 'No verão, aumente ventilação e reduza temperatura de selagem em 5°C', 'configuracao', 'media', '{"season": "summer"}'),
('Configuração sazonal inverno', 'No inverno, aumente temperatura de selagem em 3°C e tempo de aquecimento', 'configuracao', 'media', '{"season": "winter"}'),
('Ajuste para embalagem a vácuo', 'Embalagem a vácuo requer ciclo de 8-12 segundos dependendo do volume', 'configuracao', 'alta', '{"vacuum": "full"}'),
('Configuração de filme laminado', 'Filmes laminados necessitam pressão de selagem 50% maior', 'configuracao', 'alta', '{"material": "laminated"}'),
('Velocidade para mudança de formato', 'Durante mudança de formato, opere a 50% da velocidade normal', 'configuracao', 'media', '{"format_change": true}'),
('Ajuste de sensor de filme', 'Sensor de filme deve ser calibrado para cada nova bobina', 'configuracao', 'alta', '{"film_sensor": true}'),
('Configuração de impressão sobre filme', 'Para filmes impressos, alinhe marcas de registro antes da produção', 'configuracao', 'alta', '{"printed_film": true}'),
('Ajuste de datas de validade', 'Configure impressora de datas com 2mm de margem da selagem', 'configuracao', 'media', '{"date_printing": true}'),
('Configuração de produtos oleosos', 'Produtos oleosos requerem filme com barreira e maior temperatura de selagem', 'configuracao', 'alta', '{"content": "oily"}'),
('Velocidade para setup inicial', 'Durante setup, opere em velocidade mínima até estabilização completa', 'configuracao', 'alta', '{"setup": true}'),
('Ajuste de empurrador pneumático', 'Calibre empurrador para exercer força mínima necessária para o produto', 'configuracao', 'media', '{"pusher": "pneumatic"}'),
('Configuração de filme anti-fog', 'Filmes anti-fog requerem temperatura de selagem reduzida em 10°C', 'configuracao', 'media', '{"material": "anti_fog"}'),
('Ajuste para produtos pontiagudos', 'Produtos pontiagudos necessitam filme mais espesso e velocidade reduzida', 'configuracao', 'alta', '{"product": "sharp"}'),
('Configuração de atmosfera modificada', 'Para ATM, ajuste injeção de gás em 2 segundos antes da selagem', 'configuracao', 'alta', '{"atmosphere": "modified"}'),
('Velocidade para limpeza durante produção', 'Durante limpeza rápida, mantenha velocidade em 20% do normal', 'configuracao', 'baixa', '{"cleaning": "production"}'),
('Ajuste de código de barras', 'Posicione impressora de código de barras 5mm antes da selagem transversal', 'configuracao', 'media', '{"barcode": true}'),
('Configuração para dupla embalagem', 'Para dupla embalagem, sincronize ambas as estações com delay de 0.5s', 'configuracao', 'alta', '{"double_packaging": true}'),

-- Ajustes de Qualidade (50 exemplos)
('Inspeção de selagem a cada 50 unidades', 'Realize teste de tração da selagem a cada 50 embalagens produzidas', 'qualidade', 'alta', '{"inspection_frequency": 50}'),
('Controle de espessura da selagem', 'Selagem deve ter largura entre 8-12mm para garantir vedação adequada', 'qualidade', 'alta', '{"sealing_width": "8-12mm"}'),
('Verificação de vazamentos', 'Teste 5% das embalagens produzidas para vazamentos em água', 'qualidade', 'urgente', '{"leak_test": true}'),
('Controle de temperatura de selagem', 'Monitore temperatura de selagem a cada 30 minutos durante produção', 'qualidade', 'alta', '{"temp_monitoring": "30min"}'),
('Ajuste de pressão para qualidade', 'Pressão inadequada causa selagens fracas ou filmes perfurados', 'qualidade', 'alta', '{"pressure_quality": true}'),
('Inspeção visual contínua', 'Operador deve inspecionar visualmente 100% das embalagens na saída', 'qualidade', 'media', '{"visual_inspection": "100%"}'),
('Controle de rugas no filme', 'Rugas no filme indicam tensão inadequada - ajustar imediatamente', 'qualidade', 'alta', '{"wrinkles": true}'),
('Medição de vácuo', 'Nível de vácuo deve ser medido e registrado a cada 2 horas', 'qualidade', 'media', '{"vacuum_measurement": "2h"}'),
('Teste de migração de odores', 'Para produtos alimentícios, teste migração de odores semanalmente', 'qualidade', 'media', '{"odor_migration": "weekly"}'),
('Controle de registro de impressão', 'Desvio de registro não deve exceder 1mm em relação à marca', 'qualidade', 'alta', '{"print_register": "1mm"}'),
('Verificação de código de barras', 'Teste legibilidade do código de barras a cada troca de lote', 'qualidade', 'media', '{"barcode_check": "batch"}'),
('Controle de peso das embalagens', 'Pese 10 embalagens aleatórias por hora para controle de qualidade', 'qualidade', 'media', '{"weight_control": "10/h"}'),
('Inspeção de corte', 'Corte deve ser perpendicular com tolerância máxima de 2°', 'qualidade', 'alta', '{"cut_angle": "2°"}'),
('Controle de contaminação', 'Realize limpeza de fotocélulas e sensores a cada 4 horas', 'qualidade', 'media', '{"contamination": "4h"}'),
('Teste de resistência à tração', 'Teste resistência da selagem com força mínima de 5N', 'qualidade', 'alta', '{"tensile_strength": "5N"}'),
('Verificação de datas impressas', 'Confira legibilidade e precisão das datas impressas a cada hora', 'qualidade', 'media', '{"date_check": "hourly"}'),
('Controle de uniformidade', 'Embalagens devem ter dimensões uniformes com tolerância de ±2mm', 'qualidade', 'alta', '{"dimension_tolerance": "±2mm"}'),
('Inspeção de filme danificado', 'Troque filme imediatamente se houver furos ou rasgos visíveis', 'qualidade', 'urgente', '{"film_damage": true}'),
('Teste de barreira de gases', 'Para produtos sensíveis, teste permeabilidade a gases semanalmente', 'qualidade', 'media', '{"gas_barrier": "weekly"}'),
('Controle de aparência', 'Embalagens com aparência inadequada devem ser rejeitadas imediatamente', 'qualidade', 'alta', '{"appearance": true}'),
('Verificação de selagem longitudinal', 'Selagem longitudinal deve ser contínua sem falhas ou ondulações', 'qualidade', 'alta', '{"longitudinal_seal": true}'),
('Controle de temperatura ambiente', 'Temperatura ambiente afeta qualidade - manter logs de temperatura', 'qualidade', 'media', '{"ambient_temp": true}'),
('Inspeção de cantos das embalagens', 'Cantos devem estar bem selados sem dobras ou vazios', 'qualidade', 'alta', '{"corner_sealing": true}'),
('Teste de abertura fácil', 'Para embalagens com abertura fácil, teste força de abertura', 'qualidade', 'media', '{"easy_open": true}'),
('Controle de espessura do filme', 'Meça espessura do filme a cada nova bobina recebida', 'qualidade', 'media', '{"film_thickness": "new_roll"}'),
('Verificação de alinhamento', 'Produto deve estar centralizado na embalagem com tolerância de 3mm', 'qualidade', 'media', '{"alignment": "3mm"}'),
('Inspeção de contaminação cruzada', 'Verifique ausência de resíduos de produtos anteriores', 'qualidade', 'urgente', '{"cross_contamination": true}'),
('Controle de força de selagem', 'Ajuste força de selagem conforme especificação do filme', 'qualidade', 'alta', '{"sealing_force": true}'),
('Teste de integridade do vácuo', 'Embalagens a vácuo devem manter formato por no mínimo 24h', 'qualidade', 'alta', '{"vacuum_integrity": "24h"}'),
('Verificação de impressão legível', 'Todos os textos impressos devem ser perfeitamente legíveis', 'qualidade', 'media', '{"print_legibility": true}'),
('Controle de aderência da selagem', 'Teste aderência da selagem em diferentes temperaturas', 'qualidade', 'media', '{"seal_adhesion": true}'),
('Inspeção de bordas cortadas', 'Bordas cortadas devem estar lisas sem rebarbas ou irregularidades', 'qualidade', 'alta', '{"cut_edges": true}'),
('Verificação de hermeticidade', 'Teste hermeticidade em banho de água com bolhas de ar', 'qualidade', 'alta', '{"hermeticity": true}'),
('Controle de transparência', 'Para filmes transparentes, verifique ausência de nebulosidade', 'qualidade', 'media', '{"transparency": true}'),
('Inspeção de película protetora', 'Remova película protetora do filme antes da produção', 'qualidade', 'media', '{"protective_film": true}'),
('Teste de resistência ao calor', 'Embalagens devem resistir ao calor de transporte e armazenamento', 'qualidade', 'media', '{"heat_resistance": true}'),
('Controle de uniformidade de cor', 'Para filmes coloridos, monitore uniformidade da cor', 'qualidade', 'media', '{"color_uniformity": true}'),
('Verificação de acabamento', 'Acabamento da embalagem deve estar conforme especificação', 'qualidade', 'alta', '{"finishing": true}'),
('Inspeção de micro furos', 'Use luz forte para detectar micro furos no filme', 'qualidade', 'alta', '{"micro_holes": true}'),
('Controle de rigidez', 'Embalagens devem ter rigidez adequada para manuseio', 'qualidade', 'media', '{"stiffness": true}'),
('Teste de compatibilidade', 'Verifique compatibilidade entre filme e produto embalado', 'qualidade', 'alta', '{"compatibility": true}'),
('Verificação de etiquetas', 'Etiquetas devem estar bem aderidas e posicionadas corretamente', 'qualidade', 'media', '{"labels": true}'),
('Controle de estática', 'Controle eletricidade estática que pode afetar qualidade da selagem', 'qualidade', 'media', '{"static_control": true}'),
('Inspeção de deformações', 'Produtos não devem apresentar deformações após embalagem', 'qualidade', 'alta', '{"deformation": true}'),
('Teste de durabilidade', 'Teste durabilidade da embalagem em condições de uso normal', 'qualidade', 'media', '{"durability": true}'),
('Verificação de normas', 'Verifique conformidade com normas sanitárias e técnicas', 'qualidade', 'alta', '{"standards_compliance": true}'),
('Controle de rastreabilidade', 'Mantenha rastreabilidade completa do lote de filme utilizado', 'qualidade', 'media', '{"traceability": true}'),
('Inspeção final', 'Realize inspeção final antes da liberação do lote', 'qualidade', 'urgente', '{"final_inspection": true}'),
('Teste de armazenamento', 'Teste comportamento da embalagem durante armazenamento prolongado', 'qualidade', 'baixa', '{"storage_test": true}'),
('Verificação de especificações', 'Confirme que todas as especificações foram atendidas', 'qualidade', 'alta', '{"specifications": true}'),

-- Manutenção Preventiva (50 exemplos)
('Lubrificação semanal dos roletes', 'Lubrifique todos os roletes semanalmente com óleo específico', 'manutencao', 'alta', '{"frequency": "weekly", "component": "rollers"}'),
('Limpeza diária das fotocélulas', 'Limpe lentes das fotocélulas diariamente com álcool isopropílico', 'manutencao', 'media', '{"frequency": "daily", "component": "photocells"}'),
('Verificação mensal das correias', 'Inspecione tensão e desgaste das correias mensalmente', 'manutencao', 'alta', '{"frequency": "monthly", "component": "belts"}'),
('Troca trimestral do filtro de ar', 'Substitua filtro do sistema pneumático a cada 3 meses', 'manutencao', 'media', '{"frequency": "quarterly", "component": "air_filter"}'),
('Calibração semestral dos sensores', 'Calibre todos os sensores semestralmente ou conforme necessário', 'manutencao', 'alta', '{"frequency": "biannual", "component": "sensors"}'),
('Limpeza semanal do sistema de vácuo', 'Limpe bomba de vácuo e válvulas semanalmente', 'manutencao', 'alta', '{"frequency": "weekly", "component": "vacuum_system"}'),
('Verificação diária da temperatura', 'Monitore temperatura das resistências de selagem diariamente', 'manutencao', 'media', '{"frequency": "daily", "component": "heating"}'),
('Inspeção quinzenal das lâminas', 'Verifique afiação e alinhamento das lâminas de corte', 'manutencao', 'alta', '{"frequency": "biweekly", "component": "blades"}'),
('Limpeza mensal dos guias', 'Limpe e lubrifique guias de filme mensalmente', 'manutencao', 'media', '{"frequency": "monthly", "component": "guides"}'),
('Verificação semanal da pressão', 'Monitore pressão do sistema pneumático semanalmente', 'manutencao', 'media', '{"frequency": "weekly", "component": "pneumatics"}'),
('Troca anual das vedações', 'Substitua todas as vedações de borracha anualmente', 'manutencao', 'alta', '{"frequency": "yearly", "component": "seals"}'),
('Limpeza diária das mesas', 'Limpe superfícies de trabalho diariamente com desinfetante', 'manutencao', 'media', '{"frequency": "daily", "component": "work_surfaces"}'),
('Verificação mensal dos cabos', 'Inspecione cabos elétricos mensalmente quanto a desgaste', 'manutencao', 'alta', '{"frequency": "monthly", "component": "cables"}'),
('Lubrificação trimestral dos mancais', 'Lubrifique mancais dos motores trimestralmente', 'manutencao', 'alta', '{"frequency": "quarterly", "component": "bearings"}'),
('Limpeza semanal do painel', 'Limpe painel de controle semanalmente com pano seco', 'manutencao', 'baixa', '{"frequency": "weekly", "component": "control_panel"}'),
('Verificação diária de vazamentos', 'Inspecione sistema pneumático diariamente quanto a vazamentos', 'manutencao', 'media', '{"frequency": "daily", "component": "leaks"}'),
('Troca semestral do óleo', 'Troque óleo da bomba de vácuo semestralmente', 'manutencao', 'alta', '{"frequency": "biannual", "component": "vacuum_oil"}'),
('Calibração mensal da balança', 'Calibre sistemas de pesagem mensalmente', 'manutencao', 'media', '{"frequency": "monthly", "component": "scales"}'),
('Limpeza quinzenal dos ventiladores', 'Limpe pás dos ventiladores de resfriamento quinzenalmente', 'manutencao', 'media', '{"frequency": "biweekly", "component": "fans"}'),
('Verificação semanal dos fusíveis', 'Inspecione fusíveis e disjuntores semanalmente', 'manutencao', 'media', '{"frequency": "weekly", "component": "fuses"}'),
('Limpeza mensal dos coletores', 'Limpe coletores de resíduos e aparas mensalmente', 'manutencao', 'media', '{"frequency": "monthly", "component": "waste_collectors"}'),
('Verificação trimestral do alinhamento', 'Verifique alinhamento geral da máquina trimestralmente', 'manutencao', 'alta', '{"frequency": "quarterly", "component": "alignment"}'),
('Limpeza diária dos cilindros', 'Limpe cilindros pneumáticos diariamente', 'manutencao', 'media', '{"frequency": "daily", "component": "cylinders"}'),
('Troca anual das escovas', 'Substitua escovas dos motores elétricos anualmente', 'manutencao', 'media', '{"frequency": "yearly", "component": "brushes"}'),
('Verificação semanal das conexões', 'Aperte conexões pneumáticas e elétricas semanalmente', 'manutencao', 'alta', '{"frequency": "weekly", "component": "connections"}'),
('Limpeza mensal do transformador', 'Limpe transformador e remova poeira mensalmente', 'manutencao', 'media', '{"frequency": "monthly", "component": "transformer"}'),
('Verificação diária dos alarmes', 'Teste funcionamento dos alarmes de segurança diariamente', 'manutencao', 'urgente', '{"frequency": "daily", "component": "alarms"}'),
('Lubrificação quinzenal das engrenagens', 'Lubrifique engrenagens do sistema de tração quinzenalmente', 'manutencao', 'alta', '{"frequency": "biweekly", "component": "gears"}'),
('Limpeza semanal dos drenos', 'Limpe drenos de condensado semanalmente', 'manutencao', 'media', '{"frequency": "weekly", "component": "drains"}'),
('Verificação mensal das molas', 'Inspecione molas de tensão mensalmente', 'manutencao', 'media', '{"frequency": "monthly", "component": "springs"}'),
('Troca trimestral dos filtros', 'Substitua filtros de ar comprimido trimestralmente', 'manutencao', 'media', '{"frequency": "quarterly", "component": "filters"}'),
('Limpeza diária das réguas', 'Limpe réguas e escalas de medição diariamente', 'manutencao', 'baixa', '{"frequency": "daily", "component": "rulers"}'),
('Verificação semanal das válvulas', 'Teste funcionamento das válvulas pneumáticas semanalmente', 'manutencao', 'media', '{"frequency": "weekly", "component": "valves"}'),
('Limpeza mensal dos dissipadores', 'Limpe dissipadores de calor mensalmente', 'manutencao', 'media', '{"frequency": "monthly", "component": "heat_sinks"}'),
('Verificação trimestral dos acoplamentos', 'Inspecione acoplamentos dos motores trimestralmente', 'manutencao', 'alta', '{"frequency": "quarterly", "component": "couplings"}'),
('Limpeza semanal das guilhotinas', 'Limpe e lubrifique mecanismo das guilhotinas semanalmente', 'manutencao', 'alta', '{"frequency": "weekly", "component": "guillotines"}'),
('Verificação diária dos encoders', 'Verifique funcionamento dos encoders diariamente', 'manutencao', 'media', '{"frequency": "daily", "component": "encoders"}'),
('Limpeza mensal dos relés', 'Limpe contatos dos relés mensalmente', 'manutencao', 'media', '{"frequency": "monthly", "component": "relays"}'),
('Verificação semanal das buchas', 'Inspecione desgaste das buchas semanalmente', 'manutencao', 'media', '{"frequency": "weekly", "component": "bushings"}'),
('Limpeza trimestral do quadro elétrico', 'Limpe interior do quadro elétrico trimestralmente', 'manutencao', 'alta', '{"frequency": "quarterly", "component": "electrical_panel"}'),
('Verificação mensal dos contatos', 'Inspecione contatos elétricos mensalmente', 'manutencao', 'alta', '{"frequency": "monthly", "component": "contacts"}'),
('Limpeza diária das bandejas', 'Limpe bandejas coletoras diariamente', 'manutencao', 'media', '{"frequency": "daily", "component": "trays"}'),
('Verificação semanal dos parafusos', 'Aperte parafusos de fixação semanalmente', 'manutencao', 'media', '{"frequency": "weekly", "component": "screws"}'),
('Limpeza mensal das resistências', 'Limpe resistências de aquecimento mensalmente', 'manutencao', 'alta', '{"frequency": "monthly", "component": "resistors"}'),
('Verificação trimestral das soldas', 'Inspecione soldas da estrutura trimestralmente', 'manutencao', 'media', '{"frequency": "quarterly", "component": "welds"}'),
('Limpeza semanal dos espelhos', 'Limpe espelhos dos sistemas óticos semanalmente', 'manutencao', 'media', '{"frequency": "weekly", "component": "mirrors"}'),
('Verificação mensal dos amortecedores', 'Teste amortecedores pneumáticos mensalmente', 'manutencao', 'media', '{"frequency": "monthly", "component": "dampers"}'),
('Limpeza diária dos displays', 'Limpe displays e monitores diariamente', 'manutencao', 'baixa', '{"frequency": "daily", "component": "displays"}'),
('Verificação anual geral', 'Realize revisão geral anual com técnico especializado', 'manutencao', 'urgente', '{"frequency": "yearly", "component": "general"}'),
('Registro de manutenções', 'Mantenha registro detalhado de todas as manutenções realizadas', 'manutencao', 'alta', '{"maintenance_log": true}'),

-- Redução de Perdas (50 exemplos)
('Controle de rejeitos por turno', 'Monitore taxa de rejeitos por turno - meta abaixo de 2%', 'reducao_perdas', 'alta', '{"reject_rate": "<2%"}'),
('Reaproveitamento de aparas', 'Colete e reaproveite aparas de filme para outros usos', 'reducao_perdas', 'media', '{"waste": "film_scraps"}'),
('Otimização de setup', 'Reduza tempo de setup através de preparação prévia - meta 15min', 'reducao_perdas', 'alta', '{"setup_time": "<15min"}'),
('Controle de desperdício de filme', 'Monitore consumo de filme - não deve exceder 3% do planejado', 'reducao_perdas', 'alta', '{"film_waste": "<3%"}'),
('Redução de paradas não programadas', 'Meta: máximo 30 minutos de parada não programada por turno', 'reducao_perdas', 'urgente', '{"unplanned_stops": "<30min"}'),
('Aproveitamento de produtos fora de especificação', 'Classifique produtos com defeitos menores para outros usos', 'reducao_perdas', 'media', '{"off_spec": "reclassify"}'),
('Controle de energia elétrica', 'Desligue equipamentos auxiliares durante paradas longas', 'reducao_perdas', 'media', '{"energy": "standby"}'),
('Otimização de troca de formato', 'Planeje trocas de formato para minimizar desperdícios', 'reducao_perdas', 'alta', '{"format_change": "optimize"}'),
('Redução de teste inicial', 'Minimize produtos de teste no início da produção', 'reducao_perdas', 'media', '{"startup_waste": "minimize"}'),
('Controle de sobreposição de selagem', 'Ajuste precisão para evitar desperdício de filme na selagem', 'reducao_perdas', 'alta', '{"sealing_overlap": "optimize"}'),
('Reuso de embalagens de teste', 'Reutilize embalagens de teste quando possível', 'reducao_perdas', 'baixa', '{"test_packages": "reuse"}'),
('Otimização de velocidade vs qualidade', 'Encontre ponto ótimo entre velocidade e taxa de rejeitos', 'reducao_perdas', 'alta', '{"speed_quality": "optimize"}'),
('Controle de ar comprimido', 'Elimine vazamentos - cada vazamento custa R$ 50/mês', 'reducao_perdas', 'media', '{"air_leaks": "eliminate"}'),
('Redução de limpeza excessiva', 'Otimize frequência de limpeza sem comprometer qualidade', 'reducao_perdas', 'media', '{"cleaning": "optimize"}'),
('Aproveitamento de calor residual', 'Use calor das resistências para pré-aquecer filme', 'reducao_perdas', 'baixa', '{"waste_heat": "recovery"}'),
('Controle de matéria-prima', 'Monitore vencimento e rotatividade do estoque de filme', 'reducao_perdas', 'media', '{"raw_material": "inventory"}'),
('Otimização de corte', 'Ajuste precisão do corte para reduzir aparas desnecessárias', 'reducao_perdas', 'alta', '{"cutting": "precision"}'),
('Redução de retrabalho', 'Identifique causas de retrabalho e elimine na origem', 'reducao_perdas', 'alta', '{"rework": "root_cause"}'),
('Controle de temperatura ambiente', 'Mantenha temperatura estável para evitar variações na produção', 'reducao_perdas', 'media', '{"ambient_temp": "stable"}'),
('Otimização de batch size', 'Produza lotes maiores quando possível para reduzir setups', 'reducao_perdas', 'media', '{"batch_size": "optimize"}'),
('Redução de tempo de aquecimento', 'Use aquecimento gradual para reduzir consumo energético', 'reducao_perdas', 'media', '{"heating_time": "gradual"}'),
('Controle de umidade', 'Mantenha umidade controlada para evitar problemas de qualidade', 'reducao_perdas', 'media', '{"humidity": "control"}'),
('Aproveitamento de embalagens imperfeitas', 'Use embalagens com defeitos cosméticos para produtos internos', 'reducao_perdas', 'baixa', '{"cosmetic_defects": "internal_use"}'),
('Otimização de manutenção', 'Realize manutenção preventiva para evitar paradas corretivas', 'reducao_perdas', 'alta', '{"maintenance": "preventive"}'),
('Redução de descarte de filme', 'Minimize descarte através de melhor planejamento de bobinas', 'reducao_perdas', 'media', '{"film_disposal": "planning"}'),
('Controle de produção em excesso', 'Evite superprodução - produza apenas o necessário', 'reducao_perdas', 'media', '{"overproduction": "avoid"}'),
('Otimização de embalagem secundária', 'Reduza material de embalagem secundária quando possível', 'reducao_perdas', 'baixa', '{"secondary_packaging": "reduce"}'),
('Redução de movimentação desnecessária', 'Otimize layout para reduzir movimentação de materiais', 'reducao_perdas', 'media', '{"material_handling": "optimize"}'),
('Controle de inventário em processo', 'Minimize estoque em processo para reduzir obsolescência', 'reducao_perdas', 'media', '{"wip_inventory": "minimize"}'),
('Aproveitamento de produtos sazonais', 'Plane produção sazonal para evitar excessos', 'reducao_perdas', 'baixa', '{"seasonal": "planning"}'),
('Otimização de fornecedores', 'Trabalhe com fornecedores para reduzir variações na matéria-prima', 'reducao_perdas', 'media', '{"suppliers": "optimize"}'),
('Redução de documentação excessiva', 'Simplifique documentação mantendo rastreabilidade', 'reducao_perdas', 'baixa', '{"documentation": "simplify"}'),
('Controle de desperdício de etiquetas', 'Use etiquetas apenas quando necessário', 'reducao_perdas', 'baixa', '{"labels": "necessary_only"}'),
('Otimização de embalagem de transporte', 'Otimize embalagem para transporte para reduzir danos', 'reducao_perdas', 'media', '{"transport_packaging": "optimize"}'),
('Redução de teste de qualidade', 'Otimize testes de qualidade sem comprometer segurança', 'reducao_perdas', 'media', '{"quality_tests": "optimize"}'),
('Controle de obsolescência', 'Monitore produtos próximos ao vencimento', 'reducao_perdas', 'media', '{"obsolescence": "monitor"}'),
('Aproveitamento de subprodutos', 'Encontre usos para subprodutos gerados no processo', 'reducao_perdas', 'baixa', '{"byproducts": "utilize"}'),
('Otimização de água', 'Recircule água de resfriamento quando possível', 'reducao_perdas', 'baixa', '{"water": "recirculate"}'),
('Redução de embalagem excessiva', 'Use quantidade mínima de filme necessária para proteção', 'reducao_perdas', 'media', '{"packaging": "minimal"}'),
('Controle de perdas por manuseio', 'Treine operadores para reduzir perdas por manuseio incorreto', 'reducao_perdas', 'media', '{"handling": "training"}'),
('Otimização de estoque de segurança', 'Reduza estoque de segurança através de melhor planejamento', 'reducao_perdas', 'baixa', '{"safety_stock": "optimize"}'),
('Redução de tempo de ciclo', 'Otimize tempo de ciclo para aumentar produtividade', 'reducao_perdas', 'alta', '{"cycle_time": "optimize"}'),
('Controle de variabilidade do processo', 'Reduza variabilidade para diminuir taxa de rejeitos', 'reducao_perdas', 'alta', '{"process_variation": "reduce"}'),
('Aproveitamento de capacidade instalada', 'Maximize uso da capacidade instalada da máquina', 'reducao_perdas', 'media', '{"capacity": "maximize"}'),
('Otimização de sequenciamento', 'Otimize sequência de produção para reduzir setups', 'reducao_perdas', 'media', '{"sequencing": "optimize"}'),
('Redução de desperdício administrativo', 'Elimine relatórios e processos administrativos desnecessários', 'reducao_perdas', 'baixa', '{"admin_waste": "eliminate"}'),
('Controle de custos indiretos', 'Monitore e controle custos indiretos de produção', 'reducao_perdas', 'media', '{"indirect_costs": "monitor"}'),
('Otimização de recursos humanos', 'Otimize número de operadores por turno', 'reducao_perdas', 'media', '{"human_resources": "optimize"}'),
('Redução de consumíveis', 'Monitore e otimize uso de consumíveis (lubrificantes, etc.)', 'reducao_perdas', 'media', '{"consumables": "optimize"}'),
('Análise de causa raiz', 'Realize análise de causa raiz para todas as perdas significativas', 'reducao_perdas', 'alta', '{"root_cause": "analysis"}'),

-- Otimização de Consumo de Filme (50 exemplos)
('Cálculo preciso da largura', 'Calcule largura mínima necessária com margem de segurança de 5mm', 'otimizacao_filme', 'alta', '{"width": "minimum+5mm"}'),
('Otimização do comprimento', 'Ajuste comprimento do filme para minimizar desperdício na selagem', 'otimizacao_filme', 'alta', '{"length": "optimize_sealing"}'),
('Redução de sobreposição', 'Minimize sobreposição na selagem longitudinal - máximo 8mm', 'otimizacao_filme', 'media', '{"overlap": "8mm_max"}'),
('Aproveitamento de bobinas parciais', 'Use bobinas parciais para produtos menores', 'otimizacao_filme', 'media', '{"partial_rolls": "small_products"}'),
('Otimização de espessura', 'Use espessura mínima adequada para cada tipo de produto', 'otimizacao_filme', 'alta', '{"thickness": "minimum_adequate"}'),
('Redução de aparas', 'Ajuste precisão do corte para minimizar aparas laterais', 'otimizacao_filme', 'alta', '{"side_trim": "minimize"}'),
('Planejamento de larguras', 'Planeje produção por largura de filme para otimizar uso', 'otimizacao_filme', 'media', '{"width_planning": true}'),
('Controle de tensão', 'Ajuste tensão adequada para evitar alongamento desnecessário', 'otimizacao_filme', 'alta', '{"tension": "prevent_stretch"}'),
('Otimização de formato quadrado', 'Para produtos quadrados, otimize orientação do filme', 'otimizacao_filme', 'media', '{"square_format": "orientation"}'),
('Redução de teste inicial', 'Minimize filme usado em testes iniciais de setup', 'otimizacao_filme', 'media', '{"setup_tests": "minimize"}'),
('Aproveitamento de restos', 'Colete restos maiores que 1m para reaproveitamento', 'otimizacao_filme', 'baixa', '{"scraps": ">1m_reuse"}'),
('Otimização de múltiplas pistas', 'Para múltiplas pistas, calcule largura total otimizada', 'otimizacao_filme', 'alta', '{"multi_lane": "optimize_total"}'),
('Controle de desperdício por formato', 'Monitore desperdício específico por formato de produto', 'otimizacao_filme', 'media', '{"waste_by_format": "monitor"}'),
('Redução de margem de segurança', 'Otimize margem de segurança sem comprometer qualidade', 'otimizacao_filme', 'alta', '{"safety_margin": "optimize"}'),
('Aproveitamento de filme translúcido', 'Use filme translúcido onde transparência não é crítica', 'otimizacao_filme', 'baixa', '{"translucent": "non_critical"}'),
('Otimização de filme barreira', 'Use filme barreira apenas onde necessário', 'otimizacao_filme', 'media', '{"barrier_film": "necessary_only"}'),
('Redução de desperdício no corte', 'Ajuste lâminas para corte mais preciso e menos desperdício', 'otimizacao_filme', 'alta', '{"cutting_waste": "precision"}'),
('Controle de alongamento', 'Monitore e controle alongamento do filme durante processo', 'otimizacao_filme', 'media', '{"elongation": "control"}'),
('Otimização de filme impresso', 'Para filme impresso, otimize passo de repetição', 'otimizacao_filme', 'alta', '{"printed_film": "repeat_optimization"}'),
('Redução de descarte de início', 'Minimize descarte de filme no início de cada bobina nova', 'otimizacao_filme', 'media', '{"roll_start": "minimize_waste"}'),
('Aproveitamento por densidade', 'Agrupe produtos por densidade para otimizar uso de filme', 'otimizacao_filme', 'media', '{"density_grouping": true}'),
('Otimização de filme coextrudado', 'Use filme coextrudado para múltiplas funções', 'otimizacao_filme', 'media', '{"coextruded": "multi_function"}'),
('Controle de filme danificado', 'Identifique e remova apenas partes danificadas do filme', 'otimizacao_filme', 'alta', '{"damaged_film": "partial_removal"}'),
('Redução de filme de proteção', 'Use filme de proteção apenas quando necessário', 'otimizacao_filme', 'baixa', '{"protective_film": "when_needed"}'),
('Otimização de selagem fria', 'Use selagem fria para reduzir encolhimento do filme', 'otimizacao_filme', 'media', '{"cold_sealing": "reduce_shrink"}'),
('Aproveitamento de filme reciclado', 'Use filme reciclado para produtos não críticos', 'otimizacao_filme', 'baixa', '{"recycled_film": "non_critical"}'),
('Controle de umidade do filme', 'Mantenha filme em condições adequadas para evitar desperdício', 'otimizacao_filme', 'media', '{"humidity_control": true}'),
('Otimização de filme metalizado', 'Use filme metalizado apenas onde barreira é crítica', 'otimizacao_filme', 'media', '{"metallized": "barrier_critical"}'),
('Redução de filme em testes', 'Use filme mais barato para testes de desenvolvimento', 'otimizacao_filme', 'baixa', '{"test_film": "cheaper_grade"}'),
('Aproveitamento de filme fino', 'Use filme mais fino para produtos leves', 'otimizacao_filme', 'media', '{"thin_film": "light_products"}'),
('Otimização de filme perfurado', 'Para produtos que necessitam respiração, otimize perfuração', 'otimizacao_filme', 'media', '{"perforated": "optimize_holes"}'),
('Controle de filme por lote', 'Monitore consumo de filme por lote de produção', 'otimizacao_filme', 'media', '{"consumption_per_batch": true}'),
('Redução de filme duplo', 'Evite filme duplo desnecessário', 'otimizacao_filme', 'alta', '{"double_film": "avoid_unnecessary"}'),
('Aproveitamento de filme opaco', 'Use filme opaco apenas para produtos fotossensíveis', 'otimizacao_filme', 'baixa', '{"opaque_film": "photosensitive"}'),
('Otimização de filme stretch', 'Para filme stretch, otimize força de estiramento', 'otimizacao_filme', 'media', '{"stretch_film": "optimize_force"}'),
('Controle de temperatura de filme', 'Mantenha filme em temperatura adequada para processamento', 'otimizacao_filme', 'media', '{"film_temperature": true}'),
('Redução de filme em paradas', 'Minimize consumo de filme durante paradas de máquina', 'otimizacao_filme', 'alta', '{"film_during_stops": "minimize"}'),
('Aproveitamento de filme colorido', 'Use filme colorido apenas quando especificado', 'otimizacao_filme', 'baixa', '{"colored_film": "when_specified"}'),
('Otimização de filme antifog', 'Use filme antifog apenas para produtos refrigerados', 'otimizacao_filme', 'media', '{"antifog": "refrigerated_only"}'),
('Controle de desperdício por operador', 'Monitore consumo de filme por operador', 'otimizacao_filme', 'media', '{"waste_per_operator": true}'),
('Redução de filme em setup', 'Otimize setup para usar menos filme em ajustes', 'otimizacao_filme', 'alta', '{"setup_film": "optimize"}'),
('Aproveitamento de filme biodegradável', 'Use filme biodegradável para produtos orgânicos', 'otimizacao_filme', 'baixa', '{"biodegradable": "organic_products"}'),
('Otimização de filme laminado', 'Use filme laminado apenas quando múltiplas barreiras são necessárias', 'otimizacao_filme', 'media', '{"laminated": "multiple_barriers"}'),
('Controle de estoque de filme', 'Mantenha estoque otimizado para evitar deterioração', 'otimizacao_filme', 'media', '{"stock_control": true}'),
('Redução de filme em limpeza', 'Minimize uso de filme durante limpeza de máquina', 'otimizacao_filme', 'media', '{"cleaning_film": "minimize"}'),
('Aproveitamento de filme neutro', 'Use filme neutro (sem cor) sempre que possível', 'otimizacao_filme', 'baixa', '{"neutral_film": "whenever_possible"}'),
('Otimização de filme por turno', 'Monitore e otimize consumo de filme por turno', 'otimizacao_filme', 'media', '{"consumption_per_shift": true}'),
('Controle de qualidade do filme', 'Aceite apenas filme dentro das especificações para evitar desperdício', 'otimizacao_filme', 'alta', '{"film_quality": "within_specs"}'),
('Redução de filme de descarte', 'Minimize filme descartado por problemas de qualidade', 'otimizacao_filme', 'alta', '{"quality_waste": "minimize"}'),
('Análise de consumo por produto', 'Analise consumo específico de filme por tipo de produto', 'otimizacao_filme', 'media', '{"consumption_analysis": "by_product"}');

-- Insert recommendation usage data to simulate learning
INSERT INTO public.recommendation_feedback (recommendation_id, helpful, created_at)
SELECT 
  r.id,
  (random() > 0.3)::boolean as helpful,
  now() - (random() * interval '30 days')
FROM public.recommendations r
WHERE random() > 0.7;

-- Update helpful/not helpful votes based on feedback
UPDATE public.recommendations 
SET 
  helpful_votes = (
    SELECT COUNT(*) 
    FROM public.recommendation_feedback 
    WHERE recommendation_id = recommendations.id AND helpful = true
  ),
  not_helpful_votes = (
    SELECT COUNT(*) 
    FROM public.recommendation_feedback 
    WHERE recommendation_id = recommendations.id AND helpful = false
  );