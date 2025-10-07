import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, TrendingUp, Gauge, Activity } from 'lucide-react';
import { ProductionRecord } from '@/hooks/useProductionRecords';

interface ProductionEfficiencyCardProps {
  record: ProductionRecord;
  className?: string;
}

export function ProductionEfficiencyCard({ record, className }: ProductionEfficiencyCardProps) {
  const formatRate = (rate: number) => rate.toFixed(4);
  
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-green-600 dark:text-green-400';
    if (efficiency >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getEfficiencyBadgeVariant = (efficiency: number) => {
    if (efficiency >= 100) return 'default';
    if (efficiency >= 80) return 'secondary';
    return 'destructive';
  };

  if (record.produced_quantity === 0) {
    return null; // Don't show efficiency for downtime records
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Métricas de Eficiência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Production Quantity */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              Quantidade
            </div>
            <div className="text-lg font-semibold">{record.produced_quantity}</div>
          </div>

          {/* Efficiency Percentage */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Eficiência
            </div>
            <div className={`text-lg font-semibold ${getEfficiencyColor(record.efficiency_percentage || 0)}`}>
              {(record.efficiency_percentage || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          {/* Time Elapsed */}
          {record.time_elapsed_minutes !== undefined && record.time_elapsed_minutes > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                Tempo Decorrido
              </div>
              <span className="text-sm font-medium">
                {record.time_elapsed_minutes} min
              </span>
            </div>
          )}

          {/* Production Rate */}
          {record.production_rate_per_minute !== undefined && record.production_rate_per_minute > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Taxa de Produção</div>
              <span className="text-sm font-medium">
                {formatRate(record.production_rate_per_minute)} un/min
              </span>
            </div>
          )}

          {/* Cycle Time */}
          {record.cycle_time_minutes !== undefined && record.cycle_time_minutes > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tempo de Ciclo</div>
              <span className="text-sm font-medium">
                {record.cycle_time_minutes.toFixed(2)} min/un
              </span>
            </div>
          )}
        </div>

        {/* Efficiency Badge */}
        <div className="flex justify-center pt-2">
          <Badge variant={getEfficiencyBadgeVariant(record.efficiency_percentage || 0)}>
            {record.efficiency_percentage && record.efficiency_percentage >= 100 
              ? 'Acima da Meta' 
              : record.efficiency_percentage && record.efficiency_percentage >= 80 
                ? 'Dentro da Meta' 
                : 'Abaixo da Meta'
            }
          </Badge>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Registrado em: {new Date(record.recorded_at).toLocaleString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
}