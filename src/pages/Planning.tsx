import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewOrderModal } from "@/components/modals/NewOrderModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, AlertCircle, Filter } from "lucide-react";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useMachines } from "@/hooks/useMachines";
import { useProductionRecords } from "@/hooks/useProductionRecords";
import { useMemo, useState, useEffect } from "react";
import { calculateCurrentShiftTotalTonnage } from "@/lib/tonnage-calculator";

// Função para determinar o turno ativo baseado no horário atual
const getCurrentActiveShift = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes; // Converter para minutos desde meia-noite
  
  // Horários em minutos desde meia-noite
  const morningStart = 5 * 60 + 32; // 05:32
  const morningEnd = 13 * 60 + 50;  // 13:50
  const afternoonEnd = 22 * 60 + 8; // 22:08
  const nightEnd = 5 * 60 + 30;     // 05:30 (do dia seguinte)
  
  if (currentTime >= morningStart && currentTime < morningEnd) {
    return "Manhã";
  } else if (currentTime >= morningEnd && currentTime < afternoonEnd) {
    return "Tarde";
  } else {
    // Noite: 22:08 até 05:30 (do dia seguinte)
    return "Noite";
  }
};

// Função para gerar o array de shifts com o turno ativo atualizado
const getShiftsWithActiveStatus = () => {
  const activeShift = getCurrentActiveShift();
  
  return [
    { name: "Manhã", period: "05:32 - 13:50", active: activeShift === "Manhã" },
    { name: "Tarde", period: "13:50 - 22:08", active: activeShift === "Tarde" },
    { name: "Noite", period: "22:08 - 05:30", active: activeShift === "Noite" }
  ];
};

export default function Planning() {
  // Esta página mostra apenas as ordens de produção do dia atual
  const { orders, createOrder, updateOrder, deleteOrder } = useProductionOrders();
  const { machines } = useMachines();
  const { records } = useProductionRecords();
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Estado para os turnos com atualização automática
  const [shifts, setShifts] = useState(getShiftsWithActiveStatus());
  
  // Filtros
  const [selectedShift, setSelectedShift] = useState<string>("all");
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Atualizar os turnos a cada minuto para manter sincronizado
  useEffect(() => {
    const updateShifts = () => {
      setShifts(getShiftsWithActiveStatus());
    };

    // Atualizar imediatamente
    updateShifts();

    // Configurar intervalo para atualizar a cada minuto
    const interval = setInterval(updateShifts, 60000);

    return () => clearInterval(interval);
  }, []);

  const enrichedOrders = useMemo(() => {
    let filteredOrders = orders;
    
    // Aplicar filtros
    if (selectedShift !== "all") {
      filteredOrders = filteredOrders.filter(order => order.shift === selectedShift);
    }
    
    if (selectedMachine !== "all") {
      filteredOrders = filteredOrders.filter(order => order.machine_id === selectedMachine);
    }
    
    if (selectedStatus !== "all") {
      filteredOrders = filteredOrders.filter(order => order.status === selectedStatus);
    }
    
    return filteredOrders.map(order => {
      const machine = machines.find(m => m.id === order.machine_id);
      const orderRecords = records.filter(r => r.order_id === order.id);
      const produced = orderRecords.reduce((sum, record) => sum + record.produced_quantity, 0);
      
      return {
        ...order,
        machine_name: machine?.name || 'Máquina não encontrada',
        produced,
        progress: Math.round((produced / order.planned_quantity) * 100)
      };
    });
  }, [orders, machines, records, selectedShift, selectedMachine, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      case 'completed': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'Em Produção';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Concluída';
      case 'pending': return 'Planejada';
      default: return 'Desconhecido';
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrder(orderId, { status: newStatus });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Planejamento de Produção</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie ordens de produção por turno e máquina
            </p>
            <Badge variant="outline" className="text-xs">MongoDB</Badge>
          </div>
        </div>
          <NewOrderModal />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Turno</label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os turnos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os turnos</SelectItem>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.name} value={shift.name}>
                      {shift.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Máquina</label>
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as máquinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as máquinas</SelectItem>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Planejada</SelectItem>
                  <SelectItem value="in_progress">Em Produção</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shift Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {shifts.map((shift, index) => {
          const shiftOrders = orders.filter(order => order.shift === shift.name);
          const activeOrders = shiftOrders.filter(order => order.status === 'in_progress').length;
          const totalOrders = shiftOrders.length;
          
          // Calcular tonelagem do turno
          const shiftTonnage = useMemo(() => {
            if (shift.active) {
              return calculateCurrentShiftTotalTonnage(records, orders);
            }
            return { totalTonnage: 0, materialBreakdown: [] };
          }, [shift.active, records, orders]);
          
          return (
            <Card key={index} className={`${shift.active ? 'border-primary border-2' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{shift.name}</h3>
                    <p className="text-sm text-muted-foreground">{shift.period}</p>
                  </div>
                  {shift.active && (
                    <Badge className="bg-primary text-primary-foreground animate-pulse">
                      Ativo
                    </Badge>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  {shift.active && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm font-medium text-blue-600">
                        {shiftTonnage.totalTonnage.toFixed(2)} ton produzidas
                      </p>
                      {shiftTonnage.materialBreakdown.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {shiftTonnage.materialBreakdown.map((material, idx) => (
                            <p key={idx} className="text-xs text-muted-foreground">
                              {material.name}: {material.tonnage.toFixed(2)} ton
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Production Orders */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Ordens de Produção</h2>
          <Badge variant="secondary">{enrichedOrders.length} ordens</Badge>
        </div>

        {enrichedOrders.length > 0 ? (
          <div className="grid gap-4">
            {enrichedOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base sm:text-lg">{order.code}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      {order.priority && (
                        <Badge variant={order.priority === 'high' ? 'destructive' : order.priority === 'medium' ? 'default' : 'secondary'}>
                          {order.priority === 'high' ? 'Alta' : order.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="self-start sm:self-auto">
                      {order.shift}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Produto</p>
                      <p className="font-medium">{order.product_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Máquina</p>
                      <p className="font-medium">{order.machine_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Criado em {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {order.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="text-sm">{order.notes}</p>
                    </div>
                  )}

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Progresso</p>
                      <span className="text-sm font-medium">
                        {order.produced.toLocaleString()} / {order.planned_quantity.toLocaleString()} unidades
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          order.progress >= 90 ? 'bg-green-500' :
                          order.progress >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(order.progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.progress}% concluído
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t gap-3">
                    <div className="flex items-center gap-2">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Planejada</SelectItem>
                          <SelectItem value="in_progress">Em Produção</SelectItem>
                          <SelectItem value="completed">Concluída</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {order.status === 'cancelled' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">Cancelada</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {selectedShift !== "all" || selectedMachine !== "all" || selectedStatus !== "all" 
              ? "Nenhuma ordem encontrada com os filtros aplicados."
              : "Nenhuma ordem de produção encontrada. Clique em 'Nova Ordem' para criar uma."
            }
          </div>
        )}
      </div>
      </div>
    </MainLayout>
  );
}