import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'configuracao' | 'qualidade' | 'manutencao' | 'reducao_perdas' | 'otimizacao_filme';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  machine_type: string;
  conditions: any;
  helpful_votes: number;
  not_helpful_votes: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecommendationFilters {
  category?: string;
  priority?: string;
  searchTerm?: string;
  limit?: number;
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRecommendations = async (filters: RecommendationFilters = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('recommendations')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false })
        .order('helpful_votes', { ascending: false });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recommendations:', error);
        toast({
          title: "Erro ao carregar recomendações",
          description: "Não foi possível carregar as recomendações da IA.",
          variant: "destructive",
        });
        return;
      }

      setRecommendations(data as Recommendation[] || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar as recomendações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (recommendationId: string, helpful: boolean) => {
    if (submittingFeedback === recommendationId) return;
    
    setSubmittingFeedback(recommendationId);
    try {
      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('recommendation_feedback')
        .insert({
          recommendation_id: recommendationId,
          helpful: helpful,
        });

      if (feedbackError) {
        console.error('Error submitting feedback:', feedbackError);
        toast({
          title: "Erro ao enviar feedback",
          description: "Não foi possível registrar seu feedback.",
          variant: "destructive",
        });
        return;
      }

      // Update recommendation vote counts
      const recommendation = recommendations.find(r => r.id === recommendationId);
      if (recommendation) {
        const updatedVotes = helpful 
          ? { helpful_votes: recommendation.helpful_votes + 1 }
          : { not_helpful_votes: recommendation.not_helpful_votes + 1 };

        const { error: updateError } = await supabase
          .from('recommendations')
          .update(updatedVotes)
          .eq('id', recommendationId);

        if (updateError) {
          console.error('Error updating votes:', updateError);
        } else {
          // Update local state
          setRecommendations(prev => 
            prev.map(rec => 
              rec.id === recommendationId 
                ? { ...rec, ...updatedVotes }
                : rec
            )
          );

          toast({
            title: "Feedback enviado!",
            description: helpful 
              ? "Obrigado! Sua avaliação positiva nos ajuda a melhorar."
              : "Obrigado pelo feedback! Vamos trabalhar para melhorar esta recomendação.",
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao enviar o feedback.",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(null);
    }
  };

  const getSmartRecommendations = async (context: {
    machineStatus?: string;
    currentProduct?: string;
    recentProblems?: string[];
    operatingConditions?: any;
  }) => {
    // AI logic to select recommendations based on real-time machine efficiency
    const contextualFilters: RecommendationFilters = { limit: 10 };
    
    // Analyze operating conditions and efficiency
    const avgEfficiency = context.operatingConditions?.averageEfficiency || 0;
    const runningMachines = context.operatingConditions?.runningMachines || 0;
    const totalMachines = context.operatingConditions?.totalMachines || 1;
    const availabilityRate = (runningMachines / totalMachines) * 100;

    // Intelligent category selection based on real-time data
    if (avgEfficiency < 60) {
      // Low efficiency - prioritize configuration and quality
      contextualFilters.category = 'configuracao';
      contextualFilters.priority = 'urgente';
    } else if (avgEfficiency < 75) {
      // Medium efficiency - focus on optimization
      contextualFilters.category = 'otimizacao_filme';
      contextualFilters.priority = 'alta';
    } else if (availabilityRate < 70) {
      // Low availability - maintenance issues
      contextualFilters.category = 'manutencao';
      contextualFilters.priority = 'alta';
    } else if (context.recentProblems?.includes('quality')) {
      contextualFilters.category = 'qualidade';
      contextualFilters.priority = 'alta';
    } else if (context.recentProblems?.includes('maintenance')) {
      contextualFilters.category = 'manutencao';
      contextualFilters.priority = 'media';
    } else if (context.machineStatus === 'stopped') {
      contextualFilters.category = 'configuracao';
      contextualFilters.priority = 'urgente';
    } else {
      // Good performance - show loss reduction tips
      contextualFilters.category = 'reducao_perdas';
      contextualFilters.priority = 'media';
    }

    await fetchRecommendations(contextualFilters);
  };

  // Auto-fetch on component mount
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const getCategoryLabel = (category: string) => {
    const labels = {
      configuracao: 'Configurações de Produção',
      qualidade: 'Ajustes de Qualidade',
      manutencao: 'Manutenção Preventiva',
      reducao_perdas: 'Redução de Perdas',
      otimizacao_filme: 'Otimização de Filme'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      urgente: 'Urgente'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      baixa: 'bg-gray-100 text-gray-800 border-gray-200',
      media: 'bg-blue-100 text-blue-800 border-blue-200',
      alta: 'bg-orange-100 text-orange-800 border-orange-200',
      urgente: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority as keyof typeof colors] || colors.media;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      configuracao: 'bg-purple-100 text-purple-800 border-purple-200',
      qualidade: 'bg-green-100 text-green-800 border-green-200',
      manutencao: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reducao_perdas: 'bg-red-100 text-red-800 border-red-200',
      otimizacao_filme: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    };
    return colors[category as keyof typeof colors] || colors.configuracao;
  };

  return {
    recommendations,
    loading,
    submittingFeedback,
    fetchRecommendations,
    submitFeedback,
    getSmartRecommendations,
    getCategoryLabel,
    getPriorityLabel,
    getPriorityColor,
    getCategoryColor,
  };
}