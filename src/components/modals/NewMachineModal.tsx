import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Factory } from "lucide-react";
import { useMachines } from "@/hooks/useMachines";
import { useToast } from "@/hooks/use-toast";

interface NewMachineModalProps {
  children?: React.ReactNode;
}

export function NewMachineModal({ children }: NewMachineModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    model: string;
    location: string;
    status: "ativa" | "inativa" | "manutencao";
  }>({
    name: "",
    code: "",
    model: "",
    location: "",
    status: "inativa"
  });
  const { toast } = useToast();
  const { createMachine, machines } = useMachines();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast({
        title: "Erro",
        description: "Nome e código da máquina são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Check if machine code already exists
    const existingMachine = machines.find(machine => 
      machine.code.toLowerCase() === formData.code.toLowerCase()
    );
    
    if (existingMachine) {
      toast({
        title: "Código já existe",
        description: `O código "${formData.code}" já está sendo usado pela máquina "${existingMachine.name}". Por favor, escolha um código diferente.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await createMachine({
        name: formData.name,
        code: formData.code,
        model: formData.model || null,
        location: formData.location || null,
        status: formData.status
      });

      toast({
        title: "Sucesso",
        description: "Máquina cadastrada com sucesso!",
        variant: "default",
      });

      // Reset form
      setFormData({
        name: "",
        code: "",
        model: "",
        location: "",
        status: "inativa"
      });
      setOpen(false);
      
      // Recarregar a página para atualizar a lista de máquinas
      window.location.reload();
    } catch (error) {
      console.error("Erro ao cadastrar máquina:", error);
      
      // Check if it's a duplicate machine code error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("Machine code already exists") || errorMessage.includes("already exists")) {
        toast({
          title: "Código já existe",
          description: `O código "${formData.code}" já está sendo usado por outra máquina. Por favor, escolha um código diferente.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao cadastrar máquina. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Máquina
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            Cadastrar Nova Máquina
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar uma nova máquina no sistema
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Máquina *</Label>
              <Input
                id="name"
                placeholder="Ex: Linha 01"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                placeholder="Ex: M001"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                placeholder="Ex: Model A"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                placeholder="Ex: Setor 1"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Inicial</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as "ativa" | "inativa" | "manutencao"})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Cadastrar Máquina
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}