import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { mongoMachinesClient, Machine } from '@/lib/mongodb-machines-client';

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await mongoMachinesClient.getMachines();
      setMachines(data);
      console.log('✅ Loaded machines from MongoDB');
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast({
        title: "Erro ao carregar máquinas",
        description: "Não foi possível carregar a lista de máquinas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMachine = async (machineData: Omit<Machine, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newMachine = await mongoMachinesClient.createMachine(machineData);
      
      // Atualizar o estado local imediatamente
      setMachines(prev => [...prev, newMachine]);
      
      // Também buscar dados atualizados do servidor para garantir sincronização
      await fetchMachines();
      
      toast({
        title: "Máquina criada!",
        description: "A nova máquina foi criada com sucesso.",
      });
      return newMachine;
    } catch (error) {
      console.error('Error creating machine:', error);
      toast({
        title: "Erro ao criar máquina",
        description: "Não foi possível criar a máquina.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateMachine = async (id: string, updates: Partial<Omit<Machine, 'id' | 'created_at'>>) => {
    try {
      const updatedMachine = await mongoMachinesClient.updateMachine(id, updates);
      setMachines(prev => prev.map(machine => 
        machine.id === id ? updatedMachine : machine
      ));
      toast({
        title: "Máquina atualizada!",
        description: "A máquina foi atualizada com sucesso.",
      });
      return updatedMachine;
    } catch (error) {
      console.error('Error updating machine:', error);
      toast({
        title: "Erro ao atualizar máquina",
        description: "Não foi possível atualizar a máquina.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteMachine = async (id: string) => {
    try {
      await mongoMachinesClient.deleteMachine(id);
      setMachines(prev => prev.filter(machine => machine.id !== id));
      toast({
        title: "Máquina excluída!",
        description: "A máquina foi excluída com sucesso.",
      });
      return true;
    } catch (error) {
      console.error('Error deleting machine:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('production records')) {
        toast({
          title: "Não é possível excluir",
          description: "Esta máquina possui registros de produção vinculados.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao excluir máquina",
          description: "Não foi possível excluir a máquina.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  return {
    machines,
    loading,
    fetchMachines,
    createMachine,
    updateMachine,
    deleteMachine,
  };
}