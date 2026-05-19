import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, icon: Icon, trend, trendLabel, className }) {
  return (
    <Card className={cn("p-4 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground leading-tight">{title}</p>
          <p className="text-lg lg:text-xl font-bold tracking-tight break-words leading-tight">{value}</p>
          {trendLabel && (
            <p className={cn(
              "text-xs font-medium truncate",
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"
            )}>
              {trendLabel}
            </p>
          )}
        </div>
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}