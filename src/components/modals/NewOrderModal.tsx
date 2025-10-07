import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Calendar, Clock } from "lucide-react";
import { useMachines } from "@/hooks/useMachines";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useProductionRecords } from "@/hooks/useProductionRecords";
import { materialsData, Material } from "@/integrations/data/materialsData";

interface NewOrderModalProps {
  children?: React.ReactNode;
}

export function NewOrderModal({ children }: NewOrderModalProps) {
  const [open, setOpen] = useState(false);
  const { machines } = useMachines();
  const { orders, createOrder } = useProductionOrders();
  const { getTotalProduced } = useProductionRecords();
  
  const [formData, setFormData] = useState({
    orderId: "",
    product: "",
    machines: [] as string[],
    quantity: "",
    capacity: "",
    palletQuantity: "",
    priority: "medium",
    notes: "",
    calculatedTime: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.orderId || !formData.product || !formData.machines.length || !formData.quantity) {
      return;
    }

    try {
      // Buscar o material completo pelo código Mat
      const selectedMaterial = materialsData.find(material => material.Mat === formData.product);
      const productName = selectedMaterial ? selectedMaterial.Material : formData.product;

      // Criar uma ordem para cada máquina selecionada
      const quantityPerMachine = Math.ceil(parseInt(formData.quantity) / formData.machines.length);
      
      for (let i = 0; i < formData.machines.length; i++) {
        const machineId = formData.machines[i];
        const orderCode = formData.machines.length > 1 ? 
          `${formData.orderId}-${i + 1}` : formData.orderId;

        await createOrder({
          code: orderCode,
          product_name: productName,
          machine_id: machineId,
          planned_quantity: quantityPerMachine,
          pallet_quantity: parseInt(formData.palletQuantity) || 0,
          shift: 'morning',
          status: 'pending',
          priority: formData.priority,
          notes: formData.notes
        });
      }

      // Reset form and close modal
      setFormData({
        orderId: "",
        product: "",
        machines: [],
        quantity: "",
        capacity: "",
        palletQuantity: "",
        priority: "medium",
        notes: "",
        calculatedTime: ""
      });
      setOpen(false);
      
      // Recarregar o navegador após criar a ordem com sucesso
      window.location.reload();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMachineToggle = (machineId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      machines: checked 
        ? [...prev.machines, machineId]
        : prev.machines.filter(id => id !== machineId)
    }));
  };

  // Calculate pallet quantity and production time when quantity, product or machines change
  useEffect(() => {
    if (formData.quantity && formData.product) {
      const selectedMaterial = materialsData.find(material => material.Mat === formData.product);
      if (selectedMaterial) {
        const quantity = parseInt(formData.quantity);
        const caixas = selectedMaterial.Caixas;
        const palletQuantity = Math.ceil(quantity / caixas).toString();
        
        // Calculate production time
        let productionTime = "";
        if (formData.machines.length > 0) {
          // (Und * Quantidade / número_máquinas) / PPm = tempo em minutos
          const quantityPerMachine = Math.ceil(quantity / formData.machines.length);
          const unitsToProducePerMachine = selectedMaterial.Und * quantityPerMachine;
          const timeInMinutes = unitsToProducePerMachine / selectedMaterial.PPm;
          
          const hours = Math.floor(timeInMinutes / 60);
          const minutes = Math.round(timeInMinutes % 60);
          productionTime = `${hours}h ${minutes}min`;
        }
        
        setFormData(prev => ({ 
          ...prev, 
          palletQuantity,
          calculatedTime: productionTime
        }));
      }
    } else if (formData.product && !formData.quantity) {
      // Keep pallet quantity empty when quantity is empty but product is selected
      setFormData(prev => ({ ...prev, palletQuantity: "", calculatedTime: "" }));
    }
  }, [formData.quantity, formData.product, formData.machines.length]);

  // Calculate capacity and check for existing production when product changes
  useEffect(() => {
    if (formData.product) {
      const selectedMaterial = materialsData.find(material => material.Mat === formData.product);
      if (selectedMaterial) {
        const capacity = (selectedMaterial.PPm * 60).toString();
        
        // Check if this product is already in production
        const productInProduction = orders.find(order => {
          const orderMaterial = materialsData.find(m => m.Material === order.product_name);
          return orderMaterial?.Mat === formData.product && 
                 (order.status === 'running' || order.status === 'pending');
        });
        
        if (productInProduction) {
          // Get the total produced for this order
          const totalProduced = getTotalProduced(productInProduction.id);
          // Calculate remaining quantity (planned - produced)
          const remainingQuantity = productInProduction.planned_quantity - totalProduced;
          
          // Dynamic calculation using materialData Und
          // Show remaining quantity directly but maintain Und logic for consistency  
          const inputQuantity = remainingQuantity.toString();
          
          setFormData(prev => ({ 
            ...prev, 
            capacity,
            quantity: inputQuantity 
          }));
        } else {
          // Clear quantity if no production found
          setFormData(prev => ({ 
            ...prev, 
            capacity,
            quantity: "" 
          }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, capacity: "", quantity: "" }));
    }
  }, [formData.product]);

  // Gerar ID automático quando abrir o modal
  const generateOrderId = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `OP-${year}${month}${day}-${random}`;
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !formData.orderId) {
      setFormData(prev => ({ ...prev, orderId: generateOrderId() }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Ordem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Criar Ordem de Produção
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova ordem de produção
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">ID da Ordem *</Label>
              <Input
                id="orderId"
                value={formData.orderId}
                onChange={(e) => handleInputChange("orderId", e.target.value)}
                required
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Produto *</Label>
              <Select value={formData.product} onValueChange={(value) => handleInputChange("product", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar produto" />
                </SelectTrigger>
                <SelectContent>
                  {materialsData.map((material) => (
                    <SelectItem key={material.Mat} value={material.Mat}>
                      {material.Material} ({material.Mat})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="machines">Máquinas * (Selecione uma ou mais)</Label>
              <div className="border rounded-lg p-3">
                <ScrollArea className="h-[180px]">
                  <div className="space-y-3 pr-4">
                    {machines.map((machine) => (
                      <div key={machine.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`machine-${machine.id}`}
                          checked={formData.machines.includes(machine.id)}
                          onCheckedChange={(checked) => handleMachineToggle(machine.id, checked as boolean)}
                        />
                        <Label 
                          htmlFor={`machine-${machine.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {machine.name} ({machine.code})
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {formData.machines.length > 0 && (
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                    {formData.machines.length} máquina(s) selecionada(s)
                  </div>
                )}
              </div>
            </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  {(() => {
                    const productInProduction = orders.find(order => {
                      if (!formData.product) return false;
                      const orderMaterial = materialsData.find(m => m.Material === order.product_name);
                      return orderMaterial?.Mat === formData.product && 
                             (order.status === 'running' || order.status === 'pending');
                    });
                    
                    const quantityPerMachine = formData.machines.length > 1 && formData.quantity 
                      ? Math.ceil(parseInt(formData.quantity) / formData.machines.length)
                      : null;
                    
                    return productInProduction ? (
                      <div className="space-y-1">
                        <Input
                          id="quantity"
                          type="number"
                          placeholder="Ex: 10000"
                          value={formData.quantity}
                          onChange={(e) => handleInputChange("quantity", e.target.value)}
                          required
                          className="border-blue-200 bg-blue-50"
                        />
                        <p className="text-xs text-blue-600">
                          ✓ Quantidade pré-preenchida baseada na produção atual
                        </p>
                        {quantityPerMachine && (
                          <p className="text-xs text-muted-foreground">
                            📍 {quantityPerMachine.toLocaleString()} unidades por máquina ({formData.machines.length} máquinas)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Input
                          id="quantity"
                          type="number"
                          placeholder="Ex: 10000"
                          value={formData.quantity}
                          onChange={(e) => handleInputChange("quantity", e.target.value)}
                          required
                        />
                        {quantityPerMachine && (
                          <p className="text-xs text-muted-foreground">
                            📍 {quantityPerMachine.toLocaleString()} unidades por máquina ({formData.machines.length} máquinas)
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade (unidades/hora)</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="Calculado automaticamente"
                value={formData.capacity}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="palletQuantity">Qtd de pallets</Label>
              <Input
                id="palletQuantity"
                type="number"
                placeholder="Calculado automaticamente"
                value={formData.palletQuantity}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calculatedTime">Tempo Produção</Label>
              <Input
                id="calculatedTime"
                placeholder="Calculado automaticamente"
                value={formData.calculatedTime}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Instruções especiais, requisitos técnicos..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              <Clock className="h-4 w-4 mr-2" />
              Criar Ordem
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}