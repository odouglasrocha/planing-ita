import { materialsData, Material } from '@/integrations/data/materialsData';

/**
 * Determina o turno baseado na hora de início
 * @param startTime Data/hora de início da produção
 * @returns Turno correspondente
 */
export function determineShiftFromTime(recordedAt: string): 'Manhã' | 'Tarde' | 'Noite' {
  const date = new Date(recordedAt);
  const hour = date.getHours();
  
  if (hour >= 6 && hour < 14) {
    return 'Manhã';
  } else if (hour >= 14 && hour < 22) {
    return 'Tarde';
  } else {
    return 'Noite';
  }
}

/**
 * Calcula a tonelagem baseada na quantidade produzida, unidades por caixa e gramagem
 * Fórmula: produced_quantity * Und * Gramagem
 * @param productName Nome do produto para buscar os dados do material
 * @param producedQuantity Quantidade produzida em unidades
 * @returns Tonelagem calculada em toneladas
 */
export function calculateTonnage(productName: string, producedQuantity: number): number {
  // Buscar o material correspondente
  const material = materialsData.find(m => m.Material === productName);
  
  if (!material) {
    console.warn(`Material não encontrado: ${productName}`);
    return 0;
  }

  // Converter gramagem de string para número (ex: "0,035" -> 0.035)
  const gramagem = parseFloat(material.Gramagem.replace(',', '.'));
  
  if (isNaN(gramagem)) {
    console.warn(`Gramagem inválida para material ${productName}: ${material.Gramagem}`);
    return 0;
  }

  // Calcular tonelagem: produced_quantity * Und * Gramagem
  // O resultado já está em kg (gramagem está em kg), então dividimos por 1000 para obter toneladas
  const tonnage = (producedQuantity * material.Und * gramagem) / 1000;
  
  return tonnage;
}

/**
 * Formata a tonelagem para exibição
 * @param tonnage Tonelagem em toneladas
 * @returns String formatada com unidade
 */
export function formatTonnage(tonnage: number): string {
  if (tonnage < 0.001) {
    return `${(tonnage * 1000).toFixed(2)} kg`;
  }
  return `${tonnage.toFixed(3)} t`;
}

/**
 * Calcula tonelagem total para múltiplos registros de produção
 * @param records Array de registros com productName e producedQuantity
 * @returns Tonelagem total
 */
export function calculateTotalTonnage(records: Array<{productName: string, producedQuantity: number}>): number {
  return records.reduce((total, record) => {
    return total + calculateTonnage(record.productName, record.producedQuantity);
  }, 0);
}

/**
 * Agrupa registros por turno e calcula tonelagem para cada turno
 * @param records Array de registros de produção
 * @param orders Array de ordens de produção para obter product_name
 * @returns Objeto com tonelagem por turno
 */
/**
 * Verifica se uma data está dentro do mesmo dia de produção
 * Considera que o dia de produção vai de 05:32 de um dia até 05:31 do dia seguinte
 */
function isSameProductionDay(date1: Date, date2: Date): boolean {
  const adjustDate = (date: Date) => {
    const adjusted = new Date(date);
    // Se for antes das 05:32, considera como do dia anterior
    if (adjusted.getHours() < 5 || (adjusted.getHours() === 5 && adjusted.getMinutes() < 32)) {
      adjusted.setDate(adjusted.getDate() - 1);
    }
    return adjusted;
  };

  const adj1 = adjustDate(date1);
  const adj2 = adjustDate(date2);
  
  return adj1.toDateString() === adj2.toDateString();
}

/**
 * Obtém a chave de cache para o localStorage baseada na data de produção
 */
function getProductionDayCacheKey(date: Date): string {
  const adjustedDate = new Date(date);
  // Se for antes das 05:32, considera como do dia anterior
  if (adjustedDate.getHours() < 5 || (adjustedDate.getHours() === 5 && adjustedDate.getMinutes() < 32)) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }
  return `tonnage_cache_${adjustedDate.toISOString().split('T')[0]}`;
}

/**
 * Salva o resultado de produção no localStorage com timestamp de 16 horas
 */
function saveTonnageResult(shift: 'Manhã' | 'Tarde' | 'Noite', tonnage: number): void {
  const now = new Date();
  const cacheKey = getProductionDayCacheKey(now);
  const expirationTime = now.getTime() + (16 * 60 * 60 * 1000); // 16 horas em ms
  
  const cacheData = {
    shift,
    tonnage,
    timestamp: now.getTime(),
    expirationTime
  };
  
  localStorage.setItem(`${cacheKey}_${shift}`, JSON.stringify(cacheData));
}

/**
 * Recupera o resultado de produção do cache se ainda estiver válido (dentro de 16 horas)
 */
function getCachedTonnageResult(shift: 'Manhã' | 'Tarde' | 'Noite'): number | null {
  const now = new Date();
  const cacheKey = getProductionDayCacheKey(now);
  const cacheItem = localStorage.getItem(`${cacheKey}_${shift}`);
  
  if (!cacheItem) return null;
  
  try {
    const cacheData = JSON.parse(cacheItem);
    // Verifica se o cache ainda é válido (dentro de 16 horas)
    if (now.getTime() < cacheData.expirationTime) {
      return cacheData.tonnage;
    } else {
      // Cache expirado, remove
      localStorage.removeItem(`${cacheKey}_${shift}`);
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Limpa o cache de resultado quando há nova produção no mesmo turno
 */
function clearTonnageCache(shift: 'Manhã' | 'Tarde' | 'Noite'): void {
  const now = new Date();
  const cacheKey = getProductionDayCacheKey(now);
  localStorage.removeItem(`${cacheKey}_${shift}`);
}

export function calculateTonnageByShift(
  records: Array<{
    recorded_at: string;
    order_id: string;
    produced_quantity: number;
    shift?: 'Manhã' | 'Tarde' | 'Noite';
  }>,
  orders: Array<{
    id: string;
    product_name: string;
  }>
): {
  Manhã: number;
  Tarde: number;
  Noite: number;
} {
  console.log('🔍 calculateTonnageByShift Debug:');
  console.log('Input records:', records);
  console.log('Input orders:', orders);
  
  const now = new Date();
  console.log('Current date:', now);
  
  const shiftTonnage = {
    Manhã: 0,
    Tarde: 0,
    Noite: 0
  };

  // Primeiro, verificar se há resultados em cache válidos
  const cachedMorning = getCachedTonnageResult('Manhã');
  const cachedAfternoon = getCachedTonnageResult('Tarde');
  const cachedNight = getCachedTonnageResult('Noite');

  console.log('Cache results:', { cachedMorning, cachedAfternoon, cachedNight });

  // Se todos os turnos têm cache válido, retornar os valores em cache
  if (cachedMorning !== null && cachedAfternoon !== null && cachedNight !== null) {
    console.log('✅ Using cached values');
    return {
      Manhã: cachedMorning,
      Tarde: cachedAfternoon,
      Noite: cachedNight
    };
  }

  // Filtrar apenas registros do dia de produção atual
  const todayRecords = records.filter(record => {
    const recordDate = new Date(record.recorded_at);
    const isSame = isSameProductionDay(recordDate, now);
    console.log(`Record ${record.order_id} at ${record.recorded_at}: isSameProductionDay = ${isSame}`);
    return isSame;
  });

  console.log('Today records after filtering:', todayRecords);

  // Calcular tonelagem dos registros do dia atual
  todayRecords.forEach(record => {
    // Encontrar a ordem correspondente para obter o product_name
    const order = orders.find(o => o.id === record.order_id);
    if (!order) {
      console.warn(`Ordem não encontrada para record: ${record.order_id}`);
      return;
    }

    console.log(`Processing record: ${record.order_id}, product: ${order.product_name}, quantity: ${record.produced_quantity}`);

    const tonnage = calculateTonnage(order.product_name, record.produced_quantity);
    console.log(`Calculated tonnage: ${tonnage}`);
    
    // Usar o campo shift do registro se disponível, senão calcular baseado na hora
    let shift: 'Manhã' | 'Tarde' | 'Noite';
    
    if (record.shift) {
      shift = record.shift;
      console.log(`Using saved shift: ${shift}`);
    } else {
      // Fallback: calcular turno baseado na hora (para registros antigos)
      shift = determineShiftFromTime(record.recorded_at);
      console.log(`Calculated shift from time: ${shift}`);
    }
    
    console.log(`Adding tonnage ${tonnage} to ${shift} shift`);
    shiftTonnage[shift] += tonnage;
  });

  console.log('Calculated shift tonnage:', shiftTonnage);

  // Usar cache se disponível, senão usar valor calculado
  const finalResults = {
    Manhã: cachedMorning !== null ? cachedMorning : shiftTonnage.Manhã,
    Tarde: cachedAfternoon !== null ? cachedAfternoon : shiftTonnage.Tarde,
    Noite: cachedNight !== null ? cachedNight : shiftTonnage.Noite
  };

  console.log('Final results:', finalResults);

  // Salvar novos resultados no cache (apenas se não havia cache válido)
  if (cachedMorning === null) {
    saveTonnageResult('Manhã', finalResults.Manhã);
  }
  if (cachedAfternoon === null) {
    saveTonnageResult('Tarde', finalResults.Tarde);
  }
  if (cachedNight === null) {
    saveTonnageResult('Noite', finalResults.Noite);
  }

  return finalResults;
}

/**
 * Determina o turno atual baseado no horário
 * @returns Turno atual: 'morning', 'afternoon' ou 'night'
 */
export function getCurrentShift(): 'Manhã' | 'Tarde' | 'Noite' {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes; // Converter para minutos desde meia-noite
  
  // Horários em minutos desde meia-noite (baseado no Planning.tsx)
  const morningStart = 5 * 60 + 32; // 05:32
  const morningEnd = 13 * 60 + 50;  // 13:50
  const afternoonEnd = 22 * 60 + 8; // 22:08
  
  if (currentTime >= morningStart && currentTime < morningEnd) {
    return 'Manhã';
  } else if (currentTime >= morningEnd && currentTime < afternoonEnd) {
    return 'Tarde';
  } else {
    // Noite: 22:08 até 05:30 (do dia seguinte)
    return 'Noite';
  }
}

/**
 * Calcula a média de produção por hora para um turno específico
 * @param records Registros de produção filtrados por turno
 * @param orders Ordens de produção para obter informações do produto
 * @param shiftHours Número de horas do turno (padrão: 8 horas)
 * @returns Média de toneladas por hora
 */
export function calculateAverageProductionPerHour(
  records: Array<{
    recorded_at: string;
    order_id: string;
    produced_quantity: number;
    shift?: 'Manhã' | 'Tarde' | 'Noite';
  }>,
  orders: Array<{
    id: string;
    product_name: string;
  }>,
  shiftHours: number = 8
): number {
  if (records.length === 0 || shiftHours <= 0) return 0;

  let totalTonnage = 0;

  records.forEach(record => {
    const order = orders.find(o => o.id === record.order_id);
    if (order) {
      totalTonnage += calculateTonnage(order.product_name, record.produced_quantity);
    }
  });

  return totalTonnage / shiftHours;
}

/**
 * Calcula estatísticas de produção por turno
 * @param records Registros de produção
 * @param orders Ordens de produção
 * @returns Estatísticas detalhadas por turno
 */
export function calculateShiftStatistics(
  records: Array<{
    recorded_at: string;
    order_id: string;
    produced_quantity: number;
    shift?: 'Manhã' | 'Tarde' | 'Noite';
  }>,
  orders: Array<{
    id: string;
    product_name: string;
  }>
): {
  Manhã: { total: number; average: number; recordCount: number };
  Tarde: { total: number; average: number; recordCount: number };
  Noite: { total: number; average: number; recordCount: number };
} {
  const now = new Date();
  
  // Filtrar registros do dia atual
  const todayRecords = records.filter(record => {
    const recordDate = new Date(record.recorded_at);
    return isSameProductionDay(recordDate, now);
  });

  const shiftStats = {
    Manhã: { total: 0, average: 0, recordCount: 0 },
    Tarde: { total: 0, average: 0, recordCount: 0 },
    Noite: { total: 0, average: 0, recordCount: 0 }
  };

  // Agrupar registros por turno
  const recordsByShift: {
    Manhã: typeof todayRecords;
    Tarde: typeof todayRecords;
    Noite: typeof todayRecords;
  } = {
    Manhã: [],
    Tarde: [],
    Noite: []
  };

  todayRecords.forEach(record => {
    const shift = record.shift || determineShiftFromTime(record.recorded_at);
    recordsByShift[shift].push(record);
  });

  // Calcular estatísticas para cada turno
  Object.keys(recordsByShift).forEach(shiftKey => {
    const shift = shiftKey as 'Manhã' | 'Tarde' | 'Noite';
    const shiftRecords = recordsByShift[shift];
    
    shiftStats[shift].recordCount = shiftRecords.length;
    
    if (shiftRecords.length > 0) {
      // Calcular total de toneladas
      shiftRecords.forEach(record => {
        const order = orders.find(o => o.id === record.order_id);
        if (order) {
          shiftStats[shift].total += calculateTonnage(order.product_name, record.produced_quantity);
        }
      });
      
      // Calcular média por hora (8 horas por turno)
      shiftStats[shift].average = shiftStats[shift].total / 8;
    }
  });

  return shiftStats;
}

/**
 * Calcula a eficiência de produção comparando com uma meta
 * @param actualTonnage Tonelagem real produzida
 * @param targetTonnage Meta de tonelagem
 * @returns Percentual de eficiência (0-100+)
 */
export function calculateProductionEfficiency(actualTonnage: number, targetTonnage: number): number {
  if (targetTonnage <= 0) return 0;
  return (actualTonnage / targetTonnage) * 100;
}

/**
 * Obtém informações detalhadas do material
 * @param productName Nome do produto
 * @returns Dados do material ou null se não encontrado
 */
export function getMaterialInfo(productName: string): Material | null {
  return materialsData.find(m => m.Material === productName) || null;
}

/**
 * Calcula a tonelagem para o turno atual baseado na quantidade produzida
 * Usa a data atual e determina automaticamente o turno
 * @param productCode Código do produto para buscar os dados do material
 * @param producedQuantity Quantidade produzida em unidades
 * @returns Objeto com informações do cálculo de tonelagem
 */
export function calculateCurrentShiftTonnage(
  productCode: string, 
  producedQuantity: number
): {
  tonnage: number;
  shift: 'Manhã' | 'Tarde' | 'Noite';
  date: string;
  material: Material | null;
  calculation: {
    producedQuantity: number;
    und: number;
    gramagem: number;
    formula: string;
  };
} {
  // Obter data e turno atual
  const currentDate = new Date();
  const currentShift = getCurrentShift();
  const dateString = currentDate.toISOString();

  // Buscar o material pelo código
  const material = materialsData.find(m => m.Codigo === productCode);
  
  if (!material) {
    console.warn(`Material não encontrado para código: ${productCode}`);
    return {
      tonnage: 0,
      shift: currentShift,
      date: dateString,
      material: null,
      calculation: {
        producedQuantity,
        und: 0,
        gramagem: 0,
        formula: `${producedQuantity} * 0 * 0 / 1000 = 0 toneladas`
      }
    };
  }

  // Converter gramagem de string para número (ex: "0,035" -> 0.035)
  const gramagem = parseFloat(material.Gramagem.replace(',', '.'));
  
  if (isNaN(gramagem)) {
    console.warn(`Gramagem inválida para material ${material.Material}: ${material.Gramagem}`);
    return {
      tonnage: 0,
      shift: currentShift,
      date: dateString,
      material,
      calculation: {
        producedQuantity,
        und: material.Und,
        gramagem: 0,
        formula: `${producedQuantity} * ${material.Und} * 0 / 1000 = 0 toneladas`
      }
    };
  }

  // Calcular tonelagem: produced_quantity * Und * Gramagem / 1000
  const tonnage = (producedQuantity * material.Und * gramagem) / 1000;
  
  return {
    tonnage,
    shift: currentShift,
    date: dateString,
    material,
    calculation: {
      producedQuantity,
      und: material.Und,
      gramagem,
      formula: `${producedQuantity} * ${material.Und} * ${gramagem} / 1000 = ${tonnage.toFixed(6)} toneladas`
    }
  };
}

/**
 * Calcula a tonelagem total do turno atual baseada nos registros de produção
 * @param records Registros de produção
 * @param orders Ordens de produção
 * @returns Tonelagem total e detalhamento por material
 */
export function calculateCurrentShiftTotalTonnage(
  records: Array<{
    recorded_at: string;
    order_id: string;
    produced_quantity: number;
    shift?: 'Manhã' | 'Tarde' | 'Noite';
  }>,
  orders: Array<{
    id: string;
    product_name: string;
  }>
): {
  totalTonnage: number;
  materialBreakdown: Array<{
    name: string;
    tonnage: number;
    quantity: number;
  }>;
} {
  const currentShift = getCurrentShift();
  const today = new Date();
  
  // Filtrar registros do turno atual e do dia atual
  const currentShiftRecords = records.filter(record => {
    const recordDate = new Date(record.recorded_at);
    const recordShift = record.shift || determineShiftFromTime(record.recorded_at);
    
    // Verificar se é do mesmo dia de produção e turno
    return isSameProductionDay(today, recordDate) && recordShift === currentShift;
  });

  const materialBreakdown: { [key: string]: { tonnage: number; quantity: number } } = {};
  let totalTonnage = 0;

  // Calcular tonelagem para cada registro
  currentShiftRecords.forEach(record => {
    const order = orders.find(o => o.id === record.order_id);
    if (!order) return;

    const material = getMaterialInfo(order.product_name);
    if (!material) return;

    // Converter gramagem de string para número
    const gramagem = parseFloat(material.Gramagem.replace(',', '.'));
    if (isNaN(gramagem)) return;

    // Calcular tonelagem: produced_quantity * Und * Gramagem / 1000
    const recordTonnage = (record.produced_quantity * material.Und * gramagem) / 1000;
    
    totalTonnage += recordTonnage;

    // Agrupar por material
    const materialName = material.Material;
    if (!materialBreakdown[materialName]) {
      materialBreakdown[materialName] = { tonnage: 0, quantity: 0 };
    }
    materialBreakdown[materialName].tonnage += recordTonnage;
    materialBreakdown[materialName].quantity += record.produced_quantity;
  });

  // Converter para array
  const materialBreakdownArray = Object.entries(materialBreakdown).map(([name, data]) => ({
    name,
    tonnage: data.tonnage,
    quantity: data.quantity
  }));

  return {
    totalTonnage,
    materialBreakdown: materialBreakdownArray
  };
}

/**
 * Busca material por código do produto
 * @param productCode Código do produto
 * @returns Material encontrado ou null
 */
export function getMaterialByCode(productCode: string): Material | null {
  return materialsData.find(m => m.Codigo === productCode) || null;
}