import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, Sunset, Moon } from 'lucide-react';
import { useProductionRecords } from '@/hooks/useProductionRecords';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { calculateTonnageByShift, getCurrentShift } from '@/lib/tonnage-calculator';

interface TonnageByShiftCardProps {
  className?: string;
  orderId?: string; // Optional: filter by specific order
}

export function TonnageByShiftCard({ className, orderId }: TonnageByShiftCardProps) {
  const { records } = useProductionRecords();
  const { orders } = useProductionOrders();
  const currentShift = getCurrentShift();
  
  // Debug logs
  console.log('🔍 TonnageByShiftCard Debug:');
  console.log('Records:', records);
  console.log('Orders:', orders);
  console.log('Current Shift:', currentShift);
  
  // Filter records by order if orderId is provided
  const filteredRecords = orderId 
    ? records.filter(record => record.order_id === orderId)
    : records;
  
  console.log('Filtered Records:', filteredRecords);
  
  // Get product name if filtering by specific order
  const currentOrder = orderId ? orders.find(order => order.id === orderId) : null;
  const productName = currentOrder?.product_name;
  
  // Calculate tonnage by shift
  const tonnageByShift = calculateTonnageByShift(filteredRecords, orders);
  
  console.log('Tonnage by Shift Result:', tonnageByShift);
  
  // Calculate total tonnage
  const totalTonnage = tonnageByShift.Manhã + tonnageByShift.Tarde + tonnageByShift.Noite;
  
  const shifts = [
    {
      name: 'Manhã',
      key: 'Manhã' as const,
      icon: Sun,
      tonnage: tonnageByShift.Manhã,
      percentage: totalTonnage > 0 ? (tonnageByShift.Manhã / totalTonnage) * 100 : 0,
      color: 'bg-yellow-100 text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    {
      name: 'Tarde',
      key: 'Tarde' as const,
      icon: Sunset,
      tonnage: tonnageByShift.Tarde,
      percentage: totalTonnage > 0 ? (tonnageByShift.Tarde / totalTonnage) * 100 : 0,
      color: 'bg-orange-100 text-orange-800',
      iconColor: 'text-orange-600'
    },
    {
      name: 'Noite',
      key: 'Noite' as const,
      icon: Moon,
      tonnage: tonnageByShift.Noite,
      percentage: totalTonnage > 0 ? (tonnageByShift.Noite / totalTonnage) * 100 : 0,
      color: 'bg-blue-100 text-blue-800',
      iconColor: 'text-blue-600'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Toneladas por Turno
          {productName && (
            <Badge variant="secondary" className="text-xs">
              {productName}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            Turno Atual: {currentShift === 'Manhã' ? 'Manhã' : currentShift === 'Tarde' ? 'Tarde' : 'Noite'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Tonnage */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {totalTonnage.toFixed(3)} t
            </p>
            <p className="text-sm text-muted-foreground">
              {orderId ? 'Total da Ordem' : 'Total Produzido'}
            </p>
          </div>
          
          {/* Shift Details */}
          <div className="space-y-3">
            {shifts.map((shift) => {
              const Icon = shift.icon;
              const isCurrentShift = currentShift === shift.key;
              
              return (
                <div 
                  key={shift.key}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isCurrentShift ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${shift.iconColor}`} />
                    <div>
                      <p className="font-medium">{shift.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {shift.tonnage.toFixed(3)} toneladas
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className={shift.color}>
                      {shift.percentage.toFixed(1)}%
                    </Badge>
                    {isCurrentShift && (
                      <p className="text-xs text-primary mt-1">Atual</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {totalTonnage === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {orderId ? 'Nenhuma produção registrada para esta ordem' : 'Nenhuma produção registrada ainda'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}