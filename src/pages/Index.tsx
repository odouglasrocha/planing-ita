import { MainLayout } from "@/components/layout/MainLayout";
import { OEECard } from "@/components/dashboard/OEECard";
import { MachineStatusCard } from "@/components/dashboard/MachineStatusCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  Zap, 
  Target, 
  BarChart3, 
  TrendingUp,
  AlertTriangle,
  Factory
} from "lucide-react";
import { useMachines } from "@/hooks/useMachines";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useProductionRecords } from "@/hooks/useProductionRecords";
import { useMemo } from "react";

export default function Index() {
  const { machines, loading: machinesLoading } = useMachines();
  const { orders } = useProductionOrders();
  const { records, getTotalProduced } = useProductionRecords();

  // Calculate OEE data based on real data
  const oeeData = useMemo(() => {
    const runningMachines = machines.filter(m => m.status === 'running').length;
    const totalMachines = machines.length;
    const availability = totalMachines > 0 ? (runningMachines / totalMachines) * 100 : 0;
    
    // Calculate performance based on production records
    const activeOrders = orders.filter(o => o.status === 'running');
    const performance = activeOrders.length > 0 ? 
      activeOrders.reduce((acc, order) => {
        const produced = getTotalProduced(order.id);
        return acc + (produced / order.planned_quantity) * 100;
      }, 0) / activeOrders.length : 0;

    // Quality calculated as percentage of good production
    const totalProduced = records.reduce((acc, r) => acc + r.produced_quantity, 0);
    const totalRejects = records.reduce((acc, r) => acc + r.reject_quantity, 0);
    const quality = totalProduced > 0 ? ((totalProduced - totalRejects) / totalProduced) * 100 : 0;

    // Overall OEE
    const overall = (availability * performance * quality) / 10000;

    return {
      availability: { value: availability, target: 85, trend: "up" as const },
      performance: { value: performance, target: 90, trend: "up" as const },
      quality: { value: quality, target: 95, trend: "down" as const },
      overall: { value: overall, target: 80, trend: "up" as const }
    };
  }, [machines, orders, records, getTotalProduced]);

  const enrichedMachines = useMemo(() => {
    return machines.map(machine => {
      const currentOrder = orders.find(order => 
        order.machine_id === machine.id && order.status === 'running'
      );
      
      const produced = currentOrder ? getTotalProduced(currentOrder.id) : 0;
      const efficiency = currentOrder && currentOrder.planned_quantity > 0 ? 
        Math.min((produced / currentOrder.planned_quantity) * 100, 100) : 0;

      const getValidStatus = (status: string) => {
        const validStatuses = ['running', 'stopped', 'maintenance', 'idle'];
        return validStatuses.includes(status) ? status as any : 'idle';
      };

      return {
        name: machine.name,
        status: getValidStatus(machine.status),
        lastUpdate: new Date(machine.updated_at).toLocaleString('pt-BR'),
        currentOrder: currentOrder?.code,
        efficiency: Math.round(efficiency)
      };
    });
  }, [machines, orders, getTotalProduced]);

  const lossData = [
    { type: "Filme", amount: 120, color: "bg-red-500" },
    { type: "Orgânico", amount: 85, color: "bg-orange-500" },
    { type: "Setup", amount: 45, color: "bg-yellow-500" },
    { type: "Outros", amount: 23, color: "bg-purple-500" }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard OEE</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visão geral da eficiência em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm">Atualizado em tempo real</span>
          </div>
        </div>

        {/* OEE KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <OEECard
            title="Disponibilidade"
            value={oeeData.availability.value}
            target={oeeData.availability.target}
            trend={oeeData.availability.trend}
            type="availability"
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <OEECard
            title="Performance"
            value={oeeData.performance.value}
            target={oeeData.performance.target}
            trend={oeeData.performance.trend}
            type="performance"
            icon={<Zap className="h-5 w-5" />}
          />
          <OEECard
            title="Qualidade"
            value={oeeData.quality.value}
            target={oeeData.quality.target}
            trend={oeeData.quality.trend}
            type="quality"
            icon={<Target className="h-5 w-5" />}
          />
          <OEECard
            title="OEE Geral"
            value={oeeData.overall.value}
            target={oeeData.overall.target}
            trend={oeeData.overall.trend}
            type="oee"
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Machine Status */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">Status das Máquinas</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {machinesLoading ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  Carregando máquinas...
                </div>
              ) : enrichedMachines.length > 0 ? (
                enrichedMachines.map((machine, index) => (
                  <MachineStatusCard key={index} {...machine} />
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  Nenhuma máquina cadastrada
                </div>
              )}
            </div>
          </div>

          {/* Losses Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-losses" />
              <h2 className="text-lg sm:text-xl font-semibold">Perdas do Turno</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breakdown por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lossData.map((loss, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${loss.color}`} />
                      <span className="font-medium">{loss.type}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {loss.amount} kg
                    </span>
                  </div>
                ))}
                
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-losses">
                      {lossData.reduce((sum, loss) => sum + loss.amount, 0)} kg
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="font-medium">Registrar Perda</div>
                  <div className="text-sm text-muted-foreground">
                    Filme ou material orgânico
                  </div>
                </button>
                <button className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="font-medium">Apontar Produção</div>
                  <div className="text-sm text-muted-foreground">
                    Iniciar/finalizar ordem
                  </div>
                </button>
                <button className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="font-medium">Relatório Turno</div>
                  <div className="text-sm text-muted-foreground">
                    Gerar resumo atual
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
