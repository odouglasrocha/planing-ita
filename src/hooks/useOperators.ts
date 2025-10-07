import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Operator {
  id: string;
  name: string;
  code: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export function useOperators() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .order('name');

      if (error) throw error;
      setOperators(data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
      toast({
        title: "Erro ao carregar operadores",
        description: "Não foi possível carregar a lista de operadores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOperator = async (operatorData: Omit<Operator, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .insert([operatorData])
        .select()
        .single();

      if (error) throw error;

      setOperators(prev => [...prev, data]);
      toast({
        title: "Operador criado!",
        description: `Operador ${operatorData.name} foi criado com sucesso.`,
      });
      
      return data;
    } catch (error) {
      console.error('Error creating operator:', error);
      toast({
        title: "Erro ao criar operador",
        description: "Não foi possível criar o operador.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  return {
    operators,
    loading,
    createOperator,
    refetch: fetchOperators
  };
}