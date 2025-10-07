import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Factory, Clock, Wrench, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export type MachineStatus = "running" | "stopped" | "maintenance" | "idle";

interface MachineStatusCardProps {
  name: string;
  status: MachineStatus;
  lastUpdate: string;
  currentOrder?: string;
  efficiency?: number;
  className?: string;
}

const statusConfig = {
  running: {
    label: "Rodando",
    color: "bg-machine-running text-white",
    icon: Factory,
    pulse: true
  },
  stopped: {
    label: "Parada",
    color: "bg-machine-stopped text-white", 
    icon: Pause,
    pulse: false
  },
  maintenance: {
    label: "Manutenção",
    color: "bg-machine-maintenance text-white",
    icon: Wrench,
    pulse: false
  },
  idle: {
    label: "Idle",
    color: "bg-machine-idle text-white",
    icon: Clock,
    pulse: false
  }
};

export function MachineStatusCard({ 
  name, 
  status, 
  lastUpdate, 
  currentOrder,
  efficiency,
  className 
}: MachineStatusCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <Badge 
            className={cn(
              config.color,
              config.pulse && "animate-pulse"
            )}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentOrder && (
          <div>
            <p className="text-sm text-muted-foreground">Ordem Atual</p>
            <p className="font-medium">{currentOrder}</p>
          </div>
        )}
        
        {efficiency !== undefined && (
          <div>
            <p className="text-sm text-muted-foreground">Eficiência</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-semibold",
                efficiency >= 85 ? "text-green-600" : 
                efficiency >= 70 ? "text-yellow-600" : "text-red-600"
              )}>
                {efficiency}%
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    efficiency >= 85 ? "bg-green-500" : 
                    efficiency >= 70 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${efficiency}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        <div>
          <p className="text-xs text-muted-foreground">
            Última atualização: {lastUpdate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}