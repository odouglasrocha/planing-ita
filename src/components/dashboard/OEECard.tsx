import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface OEECardProps {
  title: string;
  value: number;
  target?: number;
  icon: React.ReactNode;
  type: "availability" | "performance" | "quality" | "oee";
  trend?: "up" | "down" | "stable";
  className?: string;
}

const colorMap = {
  availability: "bg-availability text-availability-foreground",
  performance: "bg-performance text-performance-foreground", 
  quality: "bg-quality text-quality-foreground",
  oee: "bg-oee text-oee-foreground"
};

const borderMap = {
  availability: "border-l-4 border-availability",
  performance: "border-l-4 border-performance",
  quality: "border-l-4 border-quality", 
  oee: "border-l-4 border-oee"
};

export function OEECard({ 
  title, 
  value, 
  target, 
  icon, 
  type, 
  trend = "stable",
  className 
}: OEECardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPerformanceColor = () => {
    if (value >= 85) return "text-green-600";
    if (value >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-lg", borderMap[type], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", colorMap[type])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className={cn("text-3xl font-bold", getPerformanceColor())}>
              {value.toFixed(1)}%
            </div>
            {target && (
              <p className="text-xs text-muted-foreground mt-1">
                Meta: {target}%
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className="text-xs text-muted-foreground">
              {trend === "up" ? "+2.5%" : trend === "down" ? "-1.2%" : "0%"}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={cn("h-1.5 rounded-full transition-all duration-300", colorMap[type])}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}