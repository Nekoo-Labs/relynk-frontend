"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface RevenueData {
  month: string;
  revenue: number;
  formatted: string;
}

interface RevenueChartProps {
  data: RevenueData[];
  className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  const { maxRevenue, trend, totalRevenue } = useMemo(() => {
    if (!data || !data.length) return { maxRevenue: 0, trend: 0, totalRevenue: 0 };
    
    const max = Math.max(...data.map(d => d.revenue));
    const total = data.reduce((sum, d) => sum + d.revenue, 0);
    
    // Calculate trend (last month vs previous month)
    const lastMonth = data[data.length - 1]?.revenue || 0;
    const previousMonth = data[data.length - 2]?.revenue || 0;
    const trendPercent = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;
    
    return { maxRevenue: max, trend: trendPercent, totalRevenue: total };
  }, [data]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  return (
    <Card className={`glow-hover ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-main" />
            Revenue Trends 📈
          </CardTitle>
          <Badge variant={trend >= 0 ? "default" : "destructive"} className="flex items-center gap-1">
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </Badge>
        </div>
        <p className="text-sm text-foreground/60">
          Total: ${totalRevenue.toFixed(2)} USD
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple Bar Chart */}
          <div className="flex items-end justify-between h-32 gap-2">
            {data?.map((item, _index) => {
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={item.month} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-main to-main/60 rounded-t-sm transition-all duration-500 hover:from-main/80 hover:to-main/40 min-h-[4px]"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${formatMonth(item.month)}: $${item.formatted} USD`}
                    />
                  </div>
                  <span className="text-xs text-foreground/60 font-mono">
                    {formatMonth(item.month)}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data?.slice(-4).map((item) => (
              <div key={item.month} className="flex justify-between">
                <span className="text-foreground/60">{formatMonth(item.month)}:</span>
                <span className="font-mono text-foreground">${item.formatted} USD</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}