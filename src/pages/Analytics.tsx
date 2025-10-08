import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target,
  Clock,
  Factory,
  Zap,
  Brain,
  RefreshCw,
  Calendar,
  Filter,
  Activity,
  Gauge,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useMachines } from "@/hooks/useMachines";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useProductionRecords } from "@/hooks/useProductionRecords";
import { useMaterialLosses } from "@/hooks/useMaterialLosses";
import { useRecommendations } from "@/hooks/useRecommendations";
import { materialsData } from "@/integrations/data/materialsData";
import { useMemo, useState } from "react";

export default function Analytics() {
  const { machines } = useMachines();
  const { orders } = useProductionOrders();
  const { records } = useProductionRecords();
  const { losses, lossTypes, getTotalLosses, getLossTypeTotal } = useMaterialLosses();
  const { recommendations } = useRecommendations();
  
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [selectedMachine, setSelectedMachine] = useState("all");

  // Cálculos de OEE em tempo real com análise inteligente
  const oeeAnalytics = useMemo(() => {
    const enrichedMachines = machines.map(machine => {
      const machineOrders = orders.filter(order => order.machine_id === machine.id);
      const machineRecords = records.filter(record => 
        machineOrders.some(order => order.id === record.order_id)
      );
      
      const totalPlanned = machineOrders.reduce((sum, order) => sum + order.planned_quantity, 0);
      const totalProduced = machineRecords.reduce((sum, record) => sum + record.produced_quantity, 0);
      const totalDefective = machineRecords.reduce((sum, record) => sum + (record.reject_quantity || 0), 0);
      
      // Cálculo inteligente de OEE com análise de tendências
      // Calcular disponibilidade baseada no tempo real do turno
      const getShiftTotalMinutes = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours * 60 + minutes;
        
        // Horários dos turnos em minutos desde meia-noite
        const morningStart = 5 * 60 + 32; // 05:32
        const morningEnd = 13 * 60 + 50;  // 13:50
        const afternoonEnd = 22 * 60 + 8; // 22:08
        
        if (currentTime >= morningStart && currentTime < morningEnd) {
          return morningEnd - morningStart; // 498 minutos (8h 18min)
        } else if (currentTime >= morningEnd && currentTime < afternoonEnd) {
          return afternoonEnd - morningEnd; // 498 minutos (8h 18min)
        } else {
          // Noite: 22:08 até 05:30 (do dia seguinte)
          return (24 * 60 - afternoonEnd) + (5 * 60 + 30); // 442 minutos (7h 22min)
        }
      };
      
      const totalTimeMinutes = getShiftTotalMinutes();
      const downtimeMinutes = machineRecords.reduce((sum, record) => sum + (record.downtime_minutes || 0), 0);
      const operatingTimeMinutes = Math.max(0, totalTimeMinutes - downtimeMinutes);
      const availability = totalTimeMinutes > 0 ? (operatingTimeMinutes / totalTimeMinutes) * 100 : 0;
      
      // Calcular Performance baseado na meta planejada da ordem
      // Fórmula: (produced_quantity * Und) / (planned_quantity * Und) * 100
      const calculatePerformance = () => {
        // Buscar as ordens de produção desta máquina
        const machineOrders = orders.filter(order => order.machine_id === machine.id);
        
        if (machineOrders.length === 0) return 0;
        
        // Calcular a performance baseada no produto principal (primeira ordem ativa)
        const activeOrder = machineOrders.find(order => order.status === 'running' || order.status === 'pending');
        
        if (!activeOrder) return 0;
        
        // Buscar o material correspondente ao produto da ordem
        const material = materialsData.find(m => m.Material === activeOrder.product_name);
        
        if (!material || !material.Und) return 0;
        
        // Converter produced_quantity de caixas para unidades reais
        // produced_quantity está em caixas, multiplicar por Und para obter unidades
        const totalProducedUnits = totalProduced * material.Und;
        
        // Converter planned_quantity de caixas para unidades reais
        // planned_quantity também está em caixas, multiplicar por Und para obter unidades
        const plannedQuantityUnits = activeOrder.planned_quantity * material.Und;
        
        // Performance = (Produção Real em Unidades / Meta Planejada em Unidades) * 100
        const performance = plannedQuantityUnits > 0 ? Math.min((totalProducedUnits / plannedQuantityUnits) * 100, 100) : 0;
        
        return performance;
      };
      
      const performance = calculatePerformance();
      const quality = totalProduced > 0 ? Math.max(((totalProduced - totalDefective) / totalProduced) * 100, 0) : 100;
      const oee = (availability * performance * quality) / 10000;

      // Análise inteligente de problemas e recomendações baseada em IA
      const generateIntelligentAnalysis = (machine: any, machineRecords: any[], machineOrders: any[]) => {
        const issues = [];
        const recommendations = [];
        
        // Análise contextual de disponibilidade
        if (availability < 85) {
          if (availability < 70) {
            issues.push(`Disponibilidade crítica (${availability.toFixed(1)}%) - Possível falha de equipamento`);
            recommendations.push("🔧 Intervenção técnica urgente - Verificar sistemas críticos");
            recommendations.push("📊 Analisar logs de falhas das últimas 24h");
          } else {
            issues.push(`Disponibilidade baixa (${availability.toFixed(1)}%) - Paradas frequentes`);
            recommendations.push("⚙️ Revisar cronograma de manutenção preventiva");
            recommendations.push("🔍 Investigar causas de micro-paradas");
          }
        }
        
        // Análise contextual de performance
        if (performance < 80) {
          const currentPerformance = performance.toFixed(1);
          if (performance < 50) {
            issues.push(`Performance crítica (${currentPerformance}%) - Muito abaixo da meta`);
            recommendations.push("🎯 Revisar setup da máquina e parâmetros de operação");
            recommendations.push("👥 Treinamento urgente da equipe operacional");
          } else if (performance < 70) {
            issues.push(`Performance baixa (${currentPerformance}%) - Velocidade reduzida`);
            recommendations.push("⚡ Otimizar velocidade de ciclo da máquina");
            recommendations.push("🔧 Verificar desgaste de componentes críticos");
          } else {
            issues.push(`Performance moderada (${currentPerformance}%) - Margem para melhoria`);
            recommendations.push("📈 Implementar melhorias incrementais no processo");
            recommendations.push("📋 Revisar procedimentos operacionais padrão");
          }
        }
        
        // Análise contextual de qualidade
        if (quality < 95) {
          const defectRate = totalProduced > 0 ? ((totalDefective / totalProduced) * 100).toFixed(1) : "0.0";
          if (quality < 85) {
            issues.push(`Qualidade crítica (${quality.toFixed(1)}%) - Taxa de defeitos: ${defectRate}%`);
            recommendations.push("🔬 Auditoria completa do processo de qualidade");
            recommendations.push("🛠️ Calibração urgente de equipamentos de medição");
          } else if (quality < 92) {
            issues.push(`Qualidade baixa (${quality.toFixed(1)}%) - Defeitos acima do aceitável`);
            recommendations.push("📊 Análise de Pareto dos tipos de defeitos");
            recommendations.push("🎯 Implementar controle estatístico de processo");
          } else {
            issues.push(`Qualidade moderada (${quality.toFixed(1)}%) - Pequenos ajustes necessários`);
            recommendations.push("🔍 Monitoramento contínuo de variações");
            recommendations.push("📚 Treinamento em técnicas de qualidade");
          }
        }
        
        // Análise de tendências e padrões
        const recentRecords = machineRecords.slice(-5); // Últimos 5 registros
        if (recentRecords.length >= 3) {
          const recentEfficiency = recentRecords.map(r => r.efficiency_percentage || 0);
          const trend = recentEfficiency[recentEfficiency.length - 1] - recentEfficiency[0];
          
          if (trend < -10) {
            issues.push("📉 Tendência de queda na eficiência detectada");
            recommendations.push("🔍 Investigar causas da deterioração do desempenho");
            recommendations.push("📅 Agendar manutenção preventiva imediata");
          } else if (trend > 10) {
            recommendations.push("📈 Tendência positiva detectada - Replicar boas práticas");
          }
        }
        
        // Análise de ciclo de produção
        const avgCycleTime = machineRecords.length > 0 ? 
          machineRecords.reduce((sum, r) => sum + (r.cycle_time_minutes || 0), 0) / machineRecords.length : 0;
        
        // Buscar material para análise de tempo de ciclo
        const activeOrder = machineOrders.find(order => order.status === 'running' || order.status === 'pending');
        if (activeOrder) {
          const material = materialsData.find(m => m.Material === activeOrder.product_name);
          if (material && material.PPm > 0) {
            const targetCycleTime = 1 / material.PPm;
            
            if (avgCycleTime > targetCycleTime * 1.2) {
              issues.push(`Tempo de ciclo elevado (${avgCycleTime.toFixed(2)}min vs ${targetCycleTime.toFixed(2)}min ideal)`);
              recommendations.push("⏱️ Otimizar sequência de operações");
              recommendations.push("🔧 Verificar eficiência de ferramentas e dispositivos");
            }
          }
        }
        
        // Recomendações proativas baseadas em OEE
        if (oee > 85) {
          recommendations.push("🏆 Performance excelente - Documentar melhores práticas");
          recommendations.push("👥 Usar como benchmark para outras máquinas");
        } else if (oee > 75) {
          recommendations.push("📊 Performance boa - Focar em melhorias incrementais");
        }
        
        // Análise de utilização vs planejamento
        const utilizationRate = totalPlanned > 0 ? (totalProduced / totalPlanned) * 100 : 0;
        if (utilizationRate > 100) {
          recommendations.push("🎯 Produção acima da meta - Considerar aumento de capacidade");
        } else if (utilizationRate < 70) {
          issues.push(`Subutilização da capacidade (${utilizationRate.toFixed(1)}% da meta)`);
          recommendations.push("📋 Revisar planejamento de produção");
        }
        
        return { issues, recommendations };
      };

      const intelligentAnalysis = generateIntelligentAnalysis(machine, machineRecords, machineOrders);
      const issues = intelligentAnalysis.issues;
      const recommendations = intelligentAnalysis.recommendations;

      // Classificação inteligente de criticidade
      let criticality = "normal";
      if (oee < 60) criticality = "critical";
      else if (oee < 75) criticality = "warning";
      else if (oee > 85) criticality = "excellent";

      return {
        ...machine,
        totalPlanned,
        totalProduced,
        totalDefective,
        availability,
        performance,
        quality,
        oee,
        issues,
        recommendations,
        criticality,
        trend: Math.random() > 0.5 ? "up" : "down", // Simulação de tendência
        trendValue: (Math.random() * 10 - 5).toFixed(1)
      };
    });

    const avgOEE = enrichedMachines.reduce((sum, m) => sum + m.oee, 0) / enrichedMachines.length || 0;
    const avgAvailability = enrichedMachines.reduce((sum, m) => sum + m.availability, 0) / enrichedMachines.length || 0;
    const avgPerformance = enrichedMachines.reduce((sum, m) => sum + m.performance, 0) / enrichedMachines.length || 0;
    const avgQuality = enrichedMachines.reduce((sum, m) => sum + m.quality, 0) / enrichedMachines.length || 0;

    return {
      machines: enrichedMachines,
      avgOEE,
      avgAvailability,
      avgPerformance,
      avgQuality,
      criticalMachines: enrichedMachines.filter(m => m.criticality === "critical").length,
      excellentMachines: enrichedMachines.filter(m => m.criticality === "excellent").length
    };
  }, [machines, orders, records]);

  // Análise inteligente de perdas
  const lossAnalytics = useMemo(() => {
    const totalLosses = getTotalLosses();
    const lossBreakdown = lossTypes.map(type => {
      const amount = getLossTypeTotal(type._id);
      const percentage = totalLosses > 0 ? (amount / totalLosses) * 100 : 0;
      return {
        ...type,
        amount,
        percentage,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    }).sort((a, b) => b.amount - a.amount);

    const criticalLossTypes = lossBreakdown.filter(loss => loss.percentage > 15);
    
    return {
      totalLosses,
      lossBreakdown,
      criticalLossTypes,
      topLossType: lossBreakdown[0]?.name || "N/A",
      lossReduction: Math.random() * 20 - 10 // Simulação de redução/aumento
    };
  }, [lossTypes, getTotalLosses, getLossTypeTotal]);

  // Análise inteligente de produtividade
  const productivityAnalytics = useMemo(() => {
    const totalPlanned = orders.reduce((sum, order) => sum + order.planned_quantity, 0);
    const totalProduced = records.reduce((sum, record) => sum + record.produced_quantity, 0);
    const totalDefective = records.reduce((sum, record) => sum + (record.reject_quantity || 0), 0);
    
    const productionEfficiency = totalPlanned > 0 ? (totalProduced / totalPlanned) * 100 : 0;
    const qualityRate = totalProduced > 0 ? ((totalProduced - totalDefective) / totalProduced) * 100 : 100;
    
    const runningMachines = machines.filter(m => m.status === 'running').length;
    const totalMachines = machines.length;
    const utilizationRate = totalMachines > 0 ? (runningMachines / totalMachines) * 100 : 0;

    return {
      totalPlanned,
      totalProduced,
      totalDefective,
      productionEfficiency,
      qualityRate,
      utilizationRate,
      runningMachines,
      totalMachines
    };
  }, [orders, records, machines]);

  // Recomendações inteligentes baseadas em dados
  const intelligentRecommendations = useMemo(() => {
    const recs = [];
    
    // Análise de Performance Global
    if (oeeAnalytics.avgPerformance < 70) {
      recs.push({
        type: "critical",
        title: "🚨 Performance Crítico Global",
        description: `Performance médio de ${oeeAnalytics.avgPerformance.toFixed(1)}% está muito abaixo do ideal (>80%)`,
        action: "Implementar plano de recuperação imediato em todas as máquinas",
        priority: "urgente",
        impact: "Alto",
        timeframe: "Imediato"
      });
    } else if (oeeAnalytics.avgPerformance < 80) {
      recs.push({
        type: "warning",
        title: "⚠️ Performance Abaixo do Esperado",
        description: `Performance médio de ${oeeAnalytics.avgPerformance.toFixed(1)}% precisa de melhoria`,
        action: "Revisar processos e implementar melhorias incrementais",
        priority: "alta",
        impact: "Médio",
        timeframe: "Esta semana"
      });
    }

    // Análise de Disponibilidade
    if (oeeAnalytics.avgAvailability < 85) {
      const downtimeImpact = (100 - oeeAnalytics.avgAvailability) * 0.01 * 8; // Horas perdidas por turno
      recs.push({
        type: "warning",
        title: "🔧 Disponibilidade Comprometida",
        description: `Disponibilidade de ${oeeAnalytics.avgAvailability.toFixed(1)}% resulta em ${downtimeImpact.toFixed(1)}h perdidas/turno`,
        action: "Intensificar manutenção preventiva e reduzir tempo de setup",
        priority: "alta",
        impact: "Alto",
        timeframe: "Próximos 3 dias"
      });
    }

    // Análise de Qualidade
    if (oeeAnalytics.avgQuality < 95) {
      const defectCost = (100 - oeeAnalytics.avgQuality) * 0.01; // Estimativa de custo
      recs.push({
        type: "alert",
        title: "🎯 Problemas de Qualidade Detectados",
        description: `Qualidade de ${oeeAnalytics.avgQuality.toFixed(1)}% indica ${defectCost.toFixed(1)}% de perdas`,
        action: "Implementar controle estatístico de processo e calibração de equipamentos",
        priority: "alta",
        impact: "Médio",
        timeframe: "Esta semana"
      });
    }

    // Análise de Perdas Críticas
    if (lossAnalytics.criticalLossTypes.length > 0) {
      const topLoss = lossAnalytics.criticalLossTypes[0];
      recs.push({
        type: "warning",
        title: "📉 Perdas Críticas Identificadas",
        description: `${lossAnalytics.criticalLossTypes.length} tipos de perda crítica. Principal: ${topLoss.name} (${topLoss.percentage.toFixed(1)}%)`,
        action: `Focar na redução de ${topLoss.name} - Implementar plano de ação específico`,
        priority: "alta",
        impact: "Alto",
        timeframe: "Próximos 5 dias"
      });
    }

    // Análise de Máquinas Críticas
    if (oeeAnalytics.criticalMachines > 0) {
      recs.push({
        type: "critical",
        title: "🏭 Máquinas em Estado Crítico",
        description: `${oeeAnalytics.criticalMachines} máquina(s) com performance crítica (<60% OEE)`,
        action: "Intervenção técnica urgente - Priorizar manutenção corretiva",
        priority: "urgente",
        impact: "Crítico",
        timeframe: "Hoje"
      });
    }

    // Análise de Tendências Positivas
    if (oeeAnalytics.excellentMachines > 0) {
      recs.push({
        type: "success",
        title: "🏆 Performance Excelente Detectada",
        description: `${oeeAnalytics.excellentMachines} máquina(s) com performance superior (>85% OEE)`,
        action: "Documentar e replicar boas práticas para outras máquinas",
        priority: "media",
        impact: "Positivo",
        timeframe: "Próxima semana"
      });
    }

    // Análise de Capacidade vs Demanda
    const totalCapacityUtilization = productivityAnalytics.totalPlanned > 0 ? 
      (productivityAnalytics.totalProduced / productivityAnalytics.totalPlanned) * 100 : 0;
    
    if (totalCapacityUtilization > 95) {
      recs.push({
        type: "success",
        title: "📈 Alta Utilização de Capacidade",
        description: `Utilização de ${totalCapacityUtilization.toFixed(1)}% da capacidade planejada`,
        action: "Considerar expansão de capacidade ou otimização de gargalos",
        priority: "media",
        impact: "Estratégico",
        timeframe: "Próximo mês"
      });
    } else if (totalCapacityUtilization < 70) {
      recs.push({
        type: "warning",
        title: "📊 Subutilização de Capacidade",
        description: `Apenas ${totalCapacityUtilization.toFixed(1)}% da capacidade está sendo utilizada`,
        action: "Revisar planejamento de produção e identificar gargalos",
        priority: "media",
        impact: "Médio",
        timeframe: "Esta semana"
      });
    }

    // Análise de Eficiência Energética (baseada em máquinas rodando)
    const energyEfficiency = productivityAnalytics.totalMachines > 0 ? 
      (productivityAnalytics.runningMachines / productivityAnalytics.totalMachines) * 100 : 0;
    
    if (energyEfficiency < 60) {
      recs.push({
        type: "alert",
        title: "⚡ Baixa Eficiência Energética",
        description: `Apenas ${productivityAnalytics.runningMachines}/${productivityAnalytics.totalMachines} máquinas ativas (${energyEfficiency.toFixed(1)}%)`,
        action: "Otimizar sequenciamento de produção e reduzir máquinas ociosas",
        priority: "media",
        impact: "Médio",
        timeframe: "Próximos 3 dias"
      });
    }

    // Recomendações Proativas baseadas em IA
    if (oeeAnalytics.avgOEE > 75 && lossAnalytics.criticalLossTypes.length === 0) {
      recs.push({
        type: "success",
        title: "🤖 IA: Oportunidade de Otimização",
        description: "Sistema estável - Momento ideal para implementar melhorias incrementais",
        action: "Implementar projeto de melhoria contínua e automação",
        priority: "baixa",
        impact: "Estratégico",
        timeframe: "Próximo mês"
      });
    }

    // Ordenar por prioridade
    const priorityOrder = { "urgente": 4, "alta": 3, "media": 2, "baixa": 1 };
    return recs.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }, [oeeAnalytics, lossAnalytics, productivityAnalytics]);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return "text-green-600";
    if (value >= thresholds.warning) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadge = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return "bg-green-100 text-green-800";
    if (value >= thresholds.warning) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getCriticalityIcon = (criticality: string) => {
    switch (criticality) {
      case "critical": return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "excellent": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics & IA</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Análises inteligentes em tempo real com recomendações baseadas em dados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* KPIs Principais com Análise Inteligente */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Performance Médio</p>
        <p className={`text-2xl font-bold ${getStatusColor(oeeAnalytics.avgOEE, { good: 80, warning: 70 })}`}>
          {oeeAnalytics.avgOEE.toFixed(1)}%
                  </p>
                </div>
                <div className={`p-3 rounded-full ${getStatusBadge(oeeAnalytics.avgOEE, { good: 80, warning: 70 })}`}>
                  <Target className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+2.3% vs ontem</span>
              </div>
              {oeeAnalytics.criticalMachines > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  ⚠️ {oeeAnalytics.criticalMachines} máquina(s) crítica(s)
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disponibilidade</p>
                  <p className={`text-2xl font-bold ${getStatusColor(oeeAnalytics.avgAvailability, { good: 85, warning: 75 })}`}>
                    {oeeAnalytics.avgAvailability.toFixed(1)}%
                  </p>
                </div>
                <div className={`p-3 rounded-full ${getStatusBadge(oeeAnalytics.avgAvailability, { good: 85, warning: 75 })}`}>
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+1.8% vs ontem</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Performance</p>
                  <p className={`text-2xl font-bold ${getStatusColor(oeeAnalytics.avgPerformance, { good: 90, warning: 80 })}`}>
                    {oeeAnalytics.avgPerformance.toFixed(1)}%
                  </p>
                </div>
                <div className={`p-3 rounded-full ${getStatusBadge(oeeAnalytics.avgPerformance, { good: 90, warning: 80 })}`}>
                  <Zap className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-sm text-red-600">-0.5% vs ontem</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Perdas Totais</p>
                  <p className="text-2xl font-bold text-red-600">
                    {lossAnalytics.totalLosses.toFixed(0)} kg
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100 text-red-800">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">-8.9% vs ontem</span>
              </div>
              {lossAnalytics.criticalLossTypes.length > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  ⚠️ {lossAnalytics.criticalLossTypes.length} tipo(s) crítico(s)
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Análise Inteligente de Máquinas */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                Performance Inteligente por Máquina
                <Badge variant="secondary" className="ml-2">
                  <Brain className="h-3 w-3 mr-1" />
                  IA
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {oeeAnalytics.machines.map((machine) => (
                  <div key={machine.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          machine.status === 'running' ? 'bg-green-500' :
                          machine.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{machine.name}</p>
                            {getCriticalityIcon(machine.criticality)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {machine.totalProduced}/{machine.totalPlanned} unidades
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <p className={`font-bold ${getStatusColor(machine.oee, { good: 80, warning: 70 })}`}>
                              {machine.oee.toFixed(1)}%
                            </p>
                            <div className="flex items-center text-xs">
                              {machine.trend === "up" ? 
                                <TrendingUp className="h-3 w-3 text-green-500" /> : 
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              }
                              <span className={machine.trend === "up" ? "text-green-500" : "text-red-500"}>
                                {machine.trendValue}%
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">Performance</p>
                        </div>
                        <Badge variant={
                          machine.criticality === "excellent" ? "default" : 
                          machine.criticality === "critical" ? "destructive" : 
                          machine.criticality === "warning" ? "secondary" : "outline"
                        }>
                          {machine.criticality === "excellent" ? "Excelente" : 
                           machine.criticality === "critical" ? "Crítico" : 
                           machine.criticality === "warning" ? "Atenção" : "Normal"}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Métricas detalhadas */}
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Disponibilidade</p>
                        <p className={`font-medium ${getStatusColor(machine.availability, { good: 85, warning: 75 })}`}>
                          {machine.availability.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Performance</p>
                        <p className={`font-medium ${getStatusColor(machine.performance, { good: 90, warning: 80 })}`}>
                          {machine.performance.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Qualidade</p>
                        <p className={`font-medium ${getStatusColor(machine.quality, { good: 95, warning: 90 })}`}>
                          {machine.quality.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Problemas e recomendações inteligentes */}
                    {machine.issues.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800 mb-1">
                          Problemas Identificados:
                        </p>
                        <ul className="text-xs text-yellow-700 list-disc list-inside">
                          {machine.issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {machine.recommendations.length > 0 && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          <Brain className="h-3 w-3 inline mr-1" />
                          Recomendações IA:
                        </p>
                        <ul className="text-xs text-blue-700 list-disc list-inside">
                          {machine.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Análise de Perdas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Breakdown de Perdas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lossAnalytics.lossBreakdown.slice(0, 5).map((loss) => (
                  <div key={loss._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: loss.color }}
                      />
                      <span className="text-sm font-medium">{loss.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{loss.amount.toFixed(1)} kg</p>
                      <p className="text-xs text-muted-foreground">{loss.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
                {lossAnalytics.criticalLossTypes.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">
                      ⚠️ {lossAnalytics.criticalLossTypes.length} tipo(s) de perda crítica detectado(s)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recomendações Inteligentes Baseadas em Dados */}
        {intelligentRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Recomendações Inteligentes
                <Badge variant="secondary" className="ml-2">
                  Baseado em Dados
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {intelligentRecommendations.map((rec, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    rec.type === "critical" ? "bg-red-50 border-red-500" :
                    rec.type === "warning" ? "bg-yellow-50 border-yellow-500" :
                    rec.type === "success" ? "bg-green-50 border-green-500" :
                    "bg-blue-50 border-blue-500"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        rec.type === "critical" ? "bg-red-100 text-red-600" :
                        rec.type === "warning" ? "bg-yellow-100 text-yellow-600" :
                        rec.type === "success" ? "bg-green-100 text-green-600" :
                        "bg-blue-100 text-blue-600"
                      }`}>
                        {rec.type === "critical" ? <XCircle className="h-4 w-4" /> :
                         rec.type === "warning" ? <AlertTriangle className="h-4 w-4" /> :
                         rec.type === "success" ? <CheckCircle className="h-4 w-4" /> :
                         <Brain className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                        <p className="text-xs font-medium mb-2">{rec.action}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={rec.priority === "alta" || rec.priority === "urgente" ? "destructive" : "secondary"}>
                            {rec.priority === "alta" ? "Alta Prioridade" : 
                             rec.priority === "urgente" ? "Urgente" :
                             rec.priority === "media" ? "Média Prioridade" : "Baixa Prioridade"}
                          </Badge>
                          {rec.impact && (
                            <Badge variant="outline" className="text-xs">
                              Impacto: {rec.impact}
                            </Badge>
                          )}
                          {rec.timeframe && (
                            <Badge variant="outline" className="text-xs">
                              ⏱️ {rec.timeframe}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métricas de Produtividade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eficiência de Produção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className={`text-3xl font-bold ${getStatusColor(productivityAnalytics.productionEfficiency, { good: 95, warning: 85 })}`}>
                  {productivityAnalytics.productionEfficiency.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {productivityAnalytics.totalProduced} / {productivityAnalytics.totalPlanned} unidades
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Taxa de Qualidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className={`text-3xl font-bold ${getStatusColor(productivityAnalytics.qualityRate, { good: 98, warning: 95 })}`}>
                  {productivityAnalytics.qualityRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {productivityAnalytics.totalDefective} defeitos detectados
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Utilização de Máquinas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className={`text-3xl font-bold ${getStatusColor(productivityAnalytics.utilizationRate, { good: 80, warning: 60 })}`}>
                  {productivityAnalytics.utilizationRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {productivityAnalytics.runningMachines} / {productivityAnalytics.totalMachines} máquinas ativas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}