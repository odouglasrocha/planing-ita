import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LossType {
  id: string;
  name: string;
  unit: string;
  color: string;
  icon: string;
  description?: string;
}

export interface MaterialLoss {
  id: string;
  machine_id: string | null;
  loss_type_id: string;
  order_id: string | null;
  operator_id: string | null;
  amount: number;
  reason: string;
  recorded_at: string;
  created_at: string;
}

export function useMaterialLosses() {
  const [losses, setLosses] = useState<MaterialLoss[]>([]);
  const [lossTypes, setLossTypes] = useState<LossType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLossTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('loss_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setLossTypes(data || []);
    } catch (error) {
      console.error('Error fetching loss types:', error);
      toast({
        title: "Erro ao carregar tipos de perda",
        description: "Não foi possível carregar os tipos de perda.",
        variant: "destructive",
      });
    }
  };

  const fetchLosses = async () => {
    try {
      const { data, error } = await supabase
        .from('material_losses')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setLosses(data || []);
    } catch (error) {
      console.error('Error fetching losses:', error);
      toast({
        title: "Erro ao carregar perdas",
        description: "Não foi possível carregar as perdas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLoss = async (lossData: {
    machine_id: string | null;
    loss_type_id: string;
    order_id?: string | null;
    operator_id?: string | null;
    amount: number;
    reason: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('material_losses')
        .insert([{
          machine_id: lossData.machine_id,
          loss_type_id: lossData.loss_type_id,
          order_id: lossData.order_id || null,
          operator_id: lossData.operator_id || null,
          amount: lossData.amount,
          reason: lossData.reason,
        }])
        .select()
        .single();

      if (error) throw error;

      setLosses(prev => [data, ...prev]);
      
      const lossType = lossTypes.find(type => type.id === lossData.loss_type_id);
      toast({
        title: "Perda registrada!",
        description: `${lossData.amount}${lossType?.unit || 'kg'} de perda tipo ${lossType?.name || 'desconhecido'} foi registrada.`,
        variant: "default",
      });

      return data;
    } catch (error) {
      console.error('Error creating loss:', error);
      toast({
        title: "Erro ao registrar perda",
        description: "Não foi possível registrar a perda.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getTotalLosses = () => {
    return losses.reduce((sum, loss) => sum + loss.amount, 0);
  };

  const getLossTypeTotal = (typeId: string) => {
    return losses
      .filter(loss => loss.loss_type_id === typeId)
      .reduce((sum, loss) => sum + loss.amount, 0);
  };

  useEffect(() => {
    fetchLossTypes();
    fetchLosses();
  }, []);

  return {
    losses,
    lossTypes,
    loading,
    createLoss,
    getTotalLosses,
    getLossTypeTotal,
    refetch: fetchLosses
  };
}