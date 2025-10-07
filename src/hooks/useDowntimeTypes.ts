import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DowntimeType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export function useDowntimeTypes() {
  const [downtimeTypes, setDowntimeTypes] = useState<DowntimeType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDowntimeTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('downtime_types')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setDowntimeTypes(data || []);
    } catch (error) {
      console.error('Error fetching downtime types:', error);
      toast({
        title: "Erro ao carregar tipos de parada",
        description: "Não foi possível carregar os tipos de parada.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDowntimeTypes();
  }, []);

  return {
    downtimeTypes,
    loading,
    refetch: fetchDowntimeTypes
  };
}