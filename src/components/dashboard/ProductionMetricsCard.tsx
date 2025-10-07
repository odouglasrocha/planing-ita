import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Gauge, Timer } from "lucide-react";
import { ProductionRecord } from "@/hooks/useProductionRecords";

interface ProductionMetricsCardProps {
  record: ProductionRecord;
  className?: string;
}

export function ProductionMetricsCard({ record, className }: ProductionMetricsCardProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes.toFixed(1)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return "text-green-600";
    if (efficiency >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getEfficiencyBadgeVariant = (efficiency: number): "default" | "secondary" | "destructive" => {
    if (efficiency >= 100) return "default";
    if (efficiency >= 80) return "secondary";
    return "destructive";
  };

  if (record.produced_quantity === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Métricas de Produção
        </CardTitle>
        <CardDescription>
          Registro de {record.produced_quantity} unidades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {record.time_elapsed_minutes !== undefined && record.time_elapsed_minutes > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tempo Decorrido</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(record.time_elapsed_minutes)}
                </p>
              </div>
            </div>
          )}

          {record.efficiency_percentage !== undefined && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Eficiência</p>
                <Badge variant={getEfficiencyBadgeVariant(record.efficiency_percentage)}>
                  {record.efficiency_percentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
          )}

          {record.production_rate_per_minute !== undefined && record.production_rate_per_minute > 0 && (
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Taxa de Produção</p>
                <p className="text-xs text-muted-foreground">
                  {record.production_rate_per_minute.toFixed(2)} un/min
                </p>
              </div>
            </div>
          )}

          {record.cycle_time_minutes !== undefined && record.cycle_time_minutes > 0 && (
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tempo de Ciclo</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(record.cycle_time_minutes)} por unidade
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Registrado em {new Date(record.recorded_at).toLocaleString('pt-BR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}