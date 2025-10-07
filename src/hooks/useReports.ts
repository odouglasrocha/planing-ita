import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Report {
  id: string;
  name: string;
  type: string;
  format: string;
  parameters?: any;
  file_path?: string;
  file_size?: number;
  status: 'generating' | 'completed' | 'failed';
  created_by?: string;
  created_at: string;
  completed_at?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const reportTemplates: ReportTemplate[] = [
    {
      id: "oee-daily",
      name: "Relatório OEE Diário",
      description: "Análise completa de disponibilidade, performance e qualidade por dia",
      icon: "BarChart3",
      color: "bg-blue-500"
    },
    {
      id: "production-summary",
      name: "Resumo de Produção",
      description: "Consolidado de produção por máquina e turno",
      icon: "Factory",
      color: "bg-green-500"
    },
    {
      id: "losses-analysis",
      name: "Análise de Perdas",
      description: "Breakdown detalhado de perdas por tipo e causa",
      icon: "AlertTriangle",
      color: "bg-red-500"
    },
    {
      id: "shift-report",
      name: "Relatório por Turno",
      description: "Performance detalhada por turno de trabalho",
      icon: "Clock",
      color: "bg-purple-500"
    }
  ];

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const mappedReports = (data || []).map(report => ({
        ...report,
        status: report.status as 'generating' | 'completed' | 'failed'
      }));
      
      setReports(mappedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Erro ao carregar relatórios",
        description: "Não foi possível carregar os relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportData: {
    type: string;
    dateFrom?: string;
    dateTo?: string;
    machineId?: string;
    format: string;
  }) => {
    try {
      const template = reportTemplates.find(t => t.id === reportData.type);
      if (!template) throw new Error('Template não encontrado');

      const reportName = `${template.name} - ${new Date().toLocaleDateString('pt-BR')}`;

      const { data, error } = await supabase
        .from('reports')
        .insert([{
          name: reportName,
          type: reportData.type,
          format: reportData.format,
          parameters: {
            dateFrom: reportData.dateFrom,
            dateTo: reportData.dateTo,
            machineId: reportData.machineId
          },
          status: 'generating'
        }])
        .select()
        .single();

      if (error) throw error;

      // Simular processamento do relatório
      setTimeout(async () => {
        const { error: updateError } = await supabase
          .from('reports')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString(),
            file_size: Math.floor(Math.random() * 3000000) + 1000000
          })
          .eq('id', data.id);

        if (!updateError) {
          fetchReports();
        }
      }, 3000);

      setReports(prev => [{
        ...data,
        status: data.status as 'generating' | 'completed' | 'failed'
      }, ...prev]);
      
      toast({
        title: "Relatório iniciado!",
        description: `${reportName} está sendo gerado.`,
        variant: "default",
      });

      return data;
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível iniciar a geração do relatório.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const downloadReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // Simular download
    toast({
      title: "Download iniciado!",
      description: `Fazendo download de ${report.name}`,
      variant: "default",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    reportTemplates,
    loading,
    generateReport,
    downloadReport,
    formatFileSize,
    refetch: fetchReports
  };
}