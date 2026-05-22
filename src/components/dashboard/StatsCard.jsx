import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, subValue, icon: Icon, trend, trendLabel, className }) {
  return (
    <Card className={cn("p-4 flex flex-col justify-between min-h-[130px] hover:shadow-lg transition-shadow duration-300", className)}>
      <div className="flex items-start justify-between gap-2 min-h-[2.25rem]">
        <p className="text-xs font-medium text-muted-foreground leading-tight line-clamp-2">{title}</p>
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div>
        <p className="text-xl lg:text-2xl font-bold tracking-tight leading-tight">{value}</p>
        {subValue !== undefined && (
          <p className="text-xl lg:text-2xl font-bold tracking-tight leading-tight">{subValue}</p>
        )}
      </div>
      <div className="h-4">
        {trendLabel && (
          <p className={cn(
            "text-xs font-medium",
            trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"
          )}>
            {trendLabel}
          </p>
        )}
      </div>
    </Card>
  );
}