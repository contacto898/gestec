import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, icon: Icon, trend, trendLabel, className }) {
  return (
    <Card className={cn("p-6 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
          {trendLabel && (
            <p className={cn(
              "text-xs font-medium",
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"
            )}>
              {trendLabel}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}