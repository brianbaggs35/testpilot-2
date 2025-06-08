import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative";
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
}

export function MetricsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconBgColor,
  iconColor,
}: MetricsCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", iconBgColor)}>
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
              <dd className="text-lg font-medium text-foreground">{value}</dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {change && (
        <div className="bg-muted px-5 py-3">
          <div className="text-sm">
            <span className={cn(
              "font-medium",
              changeType === "positive" ? "text-green-600" : "text-red-600"
            )}>
              {change}
            </span>
            <span className="text-muted-foreground"> from last week</span>
          </div>
        </div>
      )}
    </Card>
  );
}
