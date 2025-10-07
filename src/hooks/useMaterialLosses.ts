import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface LossType {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  unit?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialLoss {
  _id: string;
  machine_id: string | null;
  loss_type_id: string;
  order_id: string | null;
  operator_id: string | null;
  quantity: number;
  unit: string;
  description?: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
  loss_type?: LossType;
}

export function useMaterialLosses() {
  const [losses, setLosses] = useState<MaterialLoss[]>([]);
  const [lossTypes, setLossTypes] = useState<LossType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLossTypes = async () => {
    try {
      const token = localStorage.getItem('mongo_auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/loss-types', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setLossTypes(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch loss types');
      }
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
      const token = localStorage.getItem('mongo_auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/material-losses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setLosses(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch losses');
      }
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
    quantity: number;
    unit: string;
    description?: string;
  }) => {
    try {
      const token = localStorage.getItem('mongo_auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/material-losses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          machine_id: lossData.machine_id,
          loss_type_id: lossData.loss_type_id,
          order_id: lossData.order_id || null,
          operator_id: lossData.operator_id || null,
          quantity: lossData.quantity,
          unit: lossData.unit,
          description: lossData.description || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setLosses(prev => [result.data, ...prev]);
        
        const lossType = lossTypes.find(type => type._id === lossData.loss_type_id);
        toast({
          title: "Perda registrada!",
          description: `${lossData.quantity}${lossData.unit} de perda tipo ${lossType?.name || 'desconhecido'} foi registrada.`,
          variant: "default",
        });

        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create loss');
      }
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
    return losses.reduce((sum, loss) => sum + loss.quantity, 0);
  };

  const getLossTypeTotal = (typeId: string) => {
    return losses
      .filter(loss => loss.loss_type_id === typeId)
      .reduce((sum, loss) => sum + loss.quantity, 0);
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