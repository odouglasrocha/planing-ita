import { useState, useEffect } from 'react';
import { mongoProductionRecordsClient } from '@/lib/mongodb-production-records-client';
import { useToast } from '@/hooks/use-toast';
import { determineShiftFromTime } from '@/lib/tonnage-calculator';

export interface ProductionRecord {
  id: string;
  order_id: string;
  operator_id: string | null;
  machine_id?: string | null;
  produced_quantity: number;
  reject_quantity: number;
  downtime_minutes: number;
  recorded_at: string;
  created_at: string;
  shift?: 'Manhã' | 'Tarde' | 'Noite';
  downtime_type_id?: string | null;
  downtime_start_time?: string | null;
  downtime_end_time?: string | null;
  downtime_description?: string | null;
  time_elapsed_minutes?: number;
  efficiency_percentage?: number;
  production_rate_per_minute?: number;
  previous_record_id?: string | null;
  cycle_time_minutes?: number;
}

export function useProductionRecords() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecords = async (orderId?: string) => {
    try {
      const data = await mongoProductionRecordsClient.getRecords(orderId);
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching production records:', error);
      toast({
        title: "Erro ao carregar registros",
        description: "Não foi possível carregar os registros de produção.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDowntimeRecord = async (downtimeData: {
    order_id: string;
    operator_id?: string | null;
    machine_id: string;
    downtime_type_id: string;
    downtime_start_time: string;
    downtime_end_time: string;
    downtime_description?: string;
  }) => {
    console.log('createDowntimeRecord called with data:', downtimeData);
    try {
      const data = await mongoProductionRecordsClient.createDowntimeRecord(downtimeData);

      console.log('Record created successfully:', data);

      setRecords(prev => [data, ...prev]);
      toast({
        title: "Parada registrada!",
        description: `Parada de ${data.downtime_minutes} minutos foi registrada.`,
      });
      
      return data;
    } catch (error) {
      console.error('Error creating downtime record:', error);
      toast({
        title: "Erro ao registrar parada",
        description: "Não foi possível registrar a parada.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createRecord = async (recordData: Omit<ProductionRecord, 'id' | 'created_at'>) => {
    try {
      // Determinar o turno baseado na hora de registro
      const recordTime = recordData.recorded_at ? recordData.recorded_at : new Date().toISOString();
      const shift = determineShiftFromTime(recordTime);
      
      // Adicionar o turno aos dados do registro
      const recordWithShift = {
        ...recordData,
        shift
      };
      
      const data = await mongoProductionRecordsClient.createRecord(recordWithShift);

      setRecords(prev => [data, ...prev]);
      toast({
        title: "Produção registrada!",
        description: `${recordData.produced_quantity} unidades foram registradas.`,
      });
      
      return data;
    } catch (error) {
      console.error('Error creating production record:', error);
      toast({
        title: "Erro ao registrar produção",
        description: "Não foi possível registrar a produção.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getTotalProduced = (orderId: string) => {
    return records
      .filter(record => record.order_id === orderId)
      .reduce((total, record) => total + record.produced_quantity, 0);
  };

  const getTotalRejects = (orderId: string) => {
    return records
      .filter(record => record.order_id === orderId)
      .reduce((total, record) => total + record.reject_quantity, 0);
  };

  const getTotalDowntime = (orderId: string) => {
    return records
      .filter(record => record.order_id === orderId)
      .reduce((total, record) => total + record.downtime_minutes, 0);
  };

  const getAverageEfficiency = (orderId: string) => {
    const productionRecords = records.filter(record => 
      record.order_id === orderId && 
      record.produced_quantity > 0 && 
      record.efficiency_percentage !== undefined
    );
    
    if (productionRecords.length === 0) return 0;
    
    return productionRecords.reduce((total, record) => 
      total + (record.efficiency_percentage || 0), 0
    ) / productionRecords.length;
  };

  const getAverageProductionRate = (orderId: string) => {
    const productionRecords = records.filter(record => 
      record.order_id === orderId && 
      record.produced_quantity > 0 && 
      record.production_rate_per_minute !== undefined
    );
    
    if (productionRecords.length === 0) return 0;
    
    return productionRecords.reduce((total, record) => 
      total + (record.production_rate_per_minute || 0), 0
    ) / productionRecords.length;
  };

  const getAverageCycleTime = (orderId: string) => {
    const productionRecords = records.filter(record => 
      record.order_id === orderId && 
      record.produced_quantity > 0 && 
      record.cycle_time_minutes !== undefined
    );
    
    if (productionRecords.length === 0) return 0;
    
    return productionRecords.reduce((total, record) => 
      total + (record.cycle_time_minutes || 0), 0
    ) / productionRecords.length;
  };

  const getLatestRecord = (orderId: string) => {
    return records
      .filter(record => record.order_id === orderId && record.produced_quantity > 0)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const clearAllRecords = async () => {
    try {
      await mongoProductionRecordsClient.clearAllRecords();

      setRecords([]);
      toast({
        title: "Registros limpos!",
        description: "Todos os registros de produção foram movidos para o histórico e limpos do sistema.",
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing records:', error);
      toast({
        title: "Erro ao limpar registros",
        description: "Não foi possível limpar os registros de produção.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    records,
    loading,
    createRecord,
    createDowntimeRecord,
    getTotalProduced,
    getTotalRejects,
    getTotalDowntime,
    getAverageEfficiency,
    getAverageProductionRate,
    getAverageCycleTime,
    getLatestRecord,
    clearAllRecords,
    refetch: fetchRecords
  };
}