import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ProductionMetricsCard } from "@/components/dashboard/ProductionMetricsCard";
import { ProductionEfficiencyCard } from "@/components/dashboard/ProductionEfficiencyCard";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Package, 
  User, 
  CheckCircle,
  AlertCircle,
  StopCircle,
  Timer,
  BarChart3,
  Trash2
} from "lucide-react";
import { useState, useMemo } from "react";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useProductionRecords } from "@/hooks/useProductionRecords";
import { useMachines } from "@/hooks/useMachines";
import { useOperators } from "@/hooks/useOperators";
import { useDowntimeTypes } from "@/hooks/useDowntimeTypes";
import { materialsData } from "@/integrations/data/materialsData";
import { TonnageByShiftCard } from "@/components/TonnageByShiftCard";

export default function Production() {
  // Esta página mostra apenas as ordens de produção do dia atual
  const { orders, updateOrder } = useProductionOrders();
  const { 
    createRecord, 
    createDowntimeRecord, 
    getTotalProduced, 
    records,
    getAverageEfficiency,
    getAverageProductionRate,
    getAverageCycleTime,
    getLatestRecord,
    clearAllRecords
  } = useProductionRecords();
  const { machines } = useMachines();
  const { operators } = useOperators();
  const { downtimeTypes } = useDowntimeTypes();
  const [selectedOrder, setSelectedOrder] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  
  // Production form state
  const [productionShift, setProductionShift] = useState("");
  const [productionStartTime, setProductionStartTime] = useState("");
  const [productionEndTime, setProductionEndTime] = useState("");
  const [productionTimeHours, setProductionTimeHours] = useState("");
  
  // Downtime form state
  const [downtimeTypeId, setDowntimeTypeId] = useState("");
  const [downtimeStartTime, setDowntimeStartTime] = useState("");
  const [downtimeEndTime, setDowntimeEndTime] = useState("");
  const [downtimeDescription, setDowntimeDescription] = useState("");
  
  const { toast } = useToast();

  // Filter orders that can be produced (pending or running)
  const activeOrders = useMemo(() => {
    return orders.filter(order => 
      order.status === 'pending' || order.status === 'running'
    ).map(order => {
      const machine = machines.find(m => m.id === order.machine_id);
      const produced = getTotalProduced(order.id);
      
      return {
        ...order,
        machine_name: machine?.name || 'Máquina não encontrada',
        produced
      };
    });
  }, [orders, machines, getTotalProduced]);

  const currentOrder = activeOrders.find(order => order.id === selectedOrder);

  const handleStartProduction = async () => {
    if (!selectedOrder) return;
    
    try {
      await updateOrder(selectedOrder, { status: 'running' });
      toast({
        title: "Produção iniciada!",
        description: `Ordem ${currentOrder?.code} foi iniciada com sucesso.`,
        variant: "default",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handlePauseProduction = async () => {
    if (!selectedOrder) return;
    
    try {
      await updateOrder(selectedOrder, { status: 'pending' });
      toast({
        title: "Produção pausada",
        description: `Ordem ${currentOrder?.code} foi pausada.`,
        variant: "default",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleStopProduction = async () => {
    if (!selectedOrder) return;
    
    try {
      await updateOrder(selectedOrder, { status: 'completed' });
      toast({
        title: "Produção finalizada",
        description: `Ordem ${currentOrder?.code} foi finalizada.`,
        variant: "default",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAddProduction = async () => {
    if (!quantityInput || !selectedOrder || !productionShift || !productionStartTime || !productionEndTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validate time range
    const startTime = new Date(`2000-01-01T${productionStartTime}:00`);
    const endTime = new Date(`2000-01-01T${productionEndTime}:00`);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      toast({
        title: "Horário inválido",
        description: "Por favor, insira horários válidos.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate production value: Quantidade Produzida / Und
      const material = materialsData.find(m => m.Material === currentOrder?.product_name);
      const calculatedQuantity = material && material.Und ? 
        Math.round(parseInt(quantityInput) / material.Und) : 
        parseInt(quantityInput);

      await createRecord({
        order_id: selectedOrder,
        operator_id: null,
        produced_quantity: calculatedQuantity,
        reject_quantity: 0,
        downtime_minutes: 0,
        recorded_at: new Date().toISOString()
      });

      const calculatedBoxes = material && material.Und ? 
        Math.round(parseInt(quantityInput) / material.Und) : 
        parseInt(quantityInput);

      toast({
        title: "Produção registrada!",
        description: `${calculatedQuantity} unidades (${calculatedBoxes} caixas) registradas. Turno: ${productionShift === 'morning' ? 'Manhã' : productionShift === 'afternoon' ? 'Tarde' : 'Noite'}, ${productionTimeHours}`,
        variant: "default",
      });

      setQuantityInput("");
      setProductionShift("");
      setProductionStartTime("");
      setProductionEndTime("");
      setProductionTimeHours("");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAddDowntime = async () => {
    if (!downtimeTypeId || !downtimeStartTime || !downtimeEndTime || !selectedOrder) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios da parada.",
        variant: "destructive",
      });
      return;
    }

    // Validate time range
    const startTime = new Date(downtimeStartTime);
    const endTime = new Date(downtimeEndTime);
    
    // Check if dates are valid
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      toast({
        title: "Horário inválido",
        description: "Por favor, insira horários válidos.",
        variant: "destructive",
      });
      return;
    }
    
    if (endTime <= startTime) {
      toast({
        title: "Horário inválido",
        description: "O horário de fim deve ser posterior ao horário de início.",
        variant: "destructive",
      });
      return;
    }

    // Check if the downtime period is reasonable (not more than 48 hours)
    const downtimeHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (downtimeHours > 48) {
      toast({
        title: "Período muito longo",
        description: "O período de parada não pode ser superior a 48 horas.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDowntimeRecord({
        order_id: selectedOrder,
        operator_id: null,
        machine_id: currentOrder?.machine_id || '',
        downtime_type_id: downtimeTypeId,
        downtime_start_time: downtimeStartTime,
        downtime_end_time: downtimeEndTime,
        downtime_description: downtimeDescription,
      });

      // Clear form
      setDowntimeTypeId("");
      setDowntimeStartTime("");
      setDowntimeEndTime("");
      setDowntimeDescription("");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleClearRecords = async () => {
    if (window.confirm('Tem certeza que deseja limpar todos os registros de produção? Os registros serão arquivados no histórico.')) {
      await clearAllRecords();
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Apontamento de Produção</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Controle e registre a produção em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearRecords}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar Registros
            </Button>
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-muted-foreground">Ao vivo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Production Control */}
          <div className="space-y-6">
            {/* Order Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Seleção de Ordem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ordem de Produção Ativa</Label>
                  <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecionar ordem..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {activeOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id} className="py-3">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{order.code} - {order.product_name}</span>
                            <span className="text-sm text-muted-foreground">({order.machine_name})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentOrder && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Produto</p>
                      <p className="font-medium">{currentOrder.product_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Máquina</p>
                      <p className="font-medium">{currentOrder.machine_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantidade Total</p>
                      <p className="font-medium">
                        {(() => {
                          const material = materialsData.find(m => m.Material === currentOrder.product_name);
                          const totalQuantity = material ? currentOrder.planned_quantity * material.Und : currentOrder.planned_quantity;
                          return totalQuantity.toLocaleString();
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Produzido</p>
                      <p className="font-medium text-primary">
                        {currentOrder.produced.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Production Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Controles de Produção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <Button 
                    onClick={handleStartProduction}
                    className="bg-green-600 hover:bg-green-700 text-white h-12 sm:h-16"
                    disabled={!selectedOrder}
                  >
                    <Play className="h-6 w-6 mr-2" />
                    Iniciar
                  </Button>
                  <Button 
                    onClick={handlePauseProduction}
                    variant="outline"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 h-12 sm:h-16"
                    disabled={!selectedOrder}
                  >
                    <Pause className="h-6 w-6 mr-2" />
                    Pausar
                  </Button>
                  <Button 
                    onClick={handleStopProduction}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 h-12 sm:h-16"
                    disabled={!selectedOrder}
                  >
                    <Square className="h-6 w-6 mr-2" />
                    Finalizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Production Registration */}
            <Card>
              <CardHeader>
                <CardTitle>Registrar Produção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade Produzida *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Ex: 500"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boxes">Número de Caixas (Calculado)</Label>
                    <div className="p-3 bg-muted rounded-md border">
                      <p className="font-medium text-center">
                        {(() => {
                          if (!quantityInput || !currentOrder) return "0";
                          const material = materialsData.find(m => m.Material === currentOrder.product_name);
                          const calculatedBoxes = material && material.Und ? 
                            Math.round(parseInt(quantityInput) / material.Und) : 
                            parseInt(quantityInput);
                          return calculatedBoxes.toLocaleString();
                        })()}
                      </p>
                      {currentOrder && (() => {
                        const material = materialsData.find(m => m.Material === currentOrder.product_name);
                        return material ? (
                          <p className="text-xs text-muted-foreground text-center mt-1">
                            {quantityInput || 0} ÷ {material.Und}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productionShift">Turno *</Label>
                    <Select value={productionShift} onValueChange={setProductionShift}>
                      <SelectTrigger>
                        <SelectValue placeholder="Turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manhã">Manhã</SelectItem>
                <SelectItem value="Tarde">Tarde</SelectItem>
                <SelectItem value="Noite">Noite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productionStartTime">Hora Início *</Label>
                    <Input
                      id="productionStartTime"
                      type="time"
                      value={productionStartTime}
                      onChange={(e) => {
                        setProductionStartTime(e.target.value);
                        if (productionEndTime) {
                          const start = new Date(`2000-01-01T${e.target.value}:00`);
                          const end = new Date(`2000-01-01T${productionEndTime}:00`);
                          let diffMs = end.getTime() - start.getTime();
                          if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          setProductionTimeHours(`${hours}h ${minutes}min`);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productionEndTime">Hora Fim *</Label>
                    <Input
                      id="productionEndTime"
                      type="time"
                      value={productionEndTime}
                      onChange={(e) => {
                        setProductionEndTime(e.target.value);
                        if (productionStartTime) {
                          const start = new Date(`2000-01-01T${productionStartTime}:00`);
                          const end = new Date(`2000-01-01T${e.target.value}:00`);
                          let diffMs = end.getTime() - start.getTime();
                          if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          setProductionTimeHours(`${hours}h ${minutes}min`);
                        }
                      }}
                    />
                  </div>
                </div>

                {productionTimeHours && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <Timer className="inline h-4 w-4 mr-1" />
                      Tempo Total: <span className="font-medium text-foreground">{productionTimeHours}</span>
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={handleAddProduction}
                  className="w-full bg-primary hover:bg-primary/90 h-12"
                  disabled={!selectedOrder}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Registrar Produção
                </Button>
              </CardContent>
            </Card>

            {/* Downtime Registration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StopCircle className="h-5 w-5 text-red-500" />
                  Registrar Parada Indesejada
                </CardTitle>
                {currentOrder && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    <strong>Máquina:</strong> {currentOrder.machine_name} - <strong>Ordem:</strong> {currentOrder.code}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Parada *</Label>
                  <Select value={downtimeTypeId} onValueChange={setDowntimeTypeId}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecionar tipo de parada..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {downtimeTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id} className="py-3">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{type.name}</span>
                            <span className="text-sm text-muted-foreground">({type.category})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora Início *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={downtimeStartTime}
                      onChange={(e) => setDowntimeStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora Fim *</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={downtimeEndTime}
                      onChange={(e) => setDowntimeEndTime(e.target.value)}
                      min={downtimeStartTime}
                    />
                  </div>
                </div>

                {downtimeStartTime && downtimeEndTime && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="h-4 w-4" />
                      <span className="font-medium">Tempo de Parada:</span>
                      <span className="text-red-600">
                        {Math.round((new Date(downtimeEndTime).getTime() - new Date(downtimeStartTime).getTime()) / (1000 * 60))} minutos
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="downtimeDesc">Descrição (opcional)</Label>
                  <Input
                    id="downtimeDesc"
                    placeholder="Detalhes adicionais sobre a parada..."
                    value={downtimeDescription}
                    onChange={(e) => setDowntimeDescription(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleAddDowntime}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
                  disabled={!selectedOrder}
                >
                  <StopCircle className="h-5 w-5 mr-2" />
                  Registrar Parada
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status Panel */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Atual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentOrder ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={
                        currentOrder.status === 'running' ? 'bg-green-500 animate-pulse' :
                        currentOrder.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                      }>
                        {currentOrder.status === 'running' ? 'Rodando' : 
                         currentOrder.status === 'pending' ? 'Pendente' : 'Finalizada'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Progresso</span>
                        <span className="text-sm font-medium">
                          {Math.round((currentOrder.produced / currentOrder.planned_quantity) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((currentOrder.produced / currentOrder.planned_quantity) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Restante</span>
                      <span className="text-sm font-medium">
                        {Math.max(0, currentOrder.planned_quantity - currentOrder.produced).toLocaleString()} unidades
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhuma ordem selecionada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Production Metrics - Real-time */}
            {selectedOrder && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Métricas em Tempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const orderRecords = records
                      .filter(record => record.order_id === selectedOrder && record.produced_quantity > 0)
                      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                      .slice(0, 3);

                    if (orderRecords.length === 0) {
                      return (
                        <div className="text-center py-4">
                          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Nenhum registro de produção ainda
                          </p>
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Eficiência Média</p>
                            <p className="font-bold text-primary">
                              {getAverageEfficiency(selectedOrder).toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Taxa Média</p>
                            <p className="font-bold text-blue-600">
                              {getAverageProductionRate(selectedOrder).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">un/min</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Ciclo Médio</p>
                            <p className="font-bold text-green-600">
                              {getAverageCycleTime(selectedOrder).toFixed(1)}
                            </p>
                            <p className="text-xs text-muted-foreground">min/un</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-muted-foreground">Eficiência em Tempo Real:</p>
                          {(() => {
                            const latestRecord = getLatestRecord(selectedOrder);
                            return latestRecord ? (
                              <ProductionEfficiencyCard 
                                record={latestRecord}
                                className="border-l-4 border-l-green-500"
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                Nenhum registro de produção encontrado
                              </p>
                            );
                          })()}
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-muted-foreground">Últimos Registros:</p>
                          {orderRecords.map((record) => (
                            <ProductionMetricsCard 
                              key={record.id} 
                              record={record}
                              className="border-l-4 border-l-primary"
                            />
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Tonnage by Shift Card */}
            {selectedOrder && (
              <TonnageByShiftCard 
                orderId={selectedOrder}
                className="border-l-4 border-l-purple-500"
              />
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ordens Ativas</span>
                    <span className="font-medium">{activeOrders.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ordens em Produção</span>
                    <span className="font-medium text-green-600">
                      {activeOrders.filter(o => o.status === 'running').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Máquinas Disponíveis</span>
                    <span className="font-medium">{machines.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}