"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, Gift, Package, FileText } from "lucide-react";
import { LinkType } from "@/types/relynk";

interface LinkTypeData {
  type: LinkType;
  count: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
  label: string;
}

interface LinkTypeChartProps {
  linksByType: Record<LinkType, number>;
  className?: string;
}

const LINK_TYPE_CONFIG = {
  [LinkType.PAYMENT]: {
    label: "Payments",
    color: "bg-blue-500",
    icon: <CreditCard className="h-4 w-4" />,
  },
  [LinkType.DONATION]: {
    label: "Donations",
    color: "bg-green-500",
    icon: <Gift className="h-4 w-4" />,
  },
  [LinkType.PRODUCT]: {
    label: "Products",
    color: "bg-purple-500",
    icon: <Package className="h-4 w-4" />,
  },
  [LinkType.CONTENT]: {
    label: "Content",
    color: "bg-orange-500",
    icon: <FileText className="h-4 w-4" />,
  },
};

export function LinkTypeChart({ linksByType, className }: LinkTypeChartProps) {
  const chartData = useMemo(() => {
    const total = Object.values(linksByType).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return [];
    
    return Object.entries(linksByType)
      .map(([type, count]) => ({
        type: parseInt(type) as LinkType,
        count,
        percentage: (count / total) * 100,
        ...LINK_TYPE_CONFIG[parseInt(type) as LinkType],
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [linksByType]);

  const totalLinks = Object.values(linksByType).reduce((sum, count) => sum + count, 0);

  if (totalLinks === 0) {
    return (
      <Card className={`glow-hover ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-main" />
            Link Type Distribution 🥧
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-foreground/60">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No links created yet</p>
              <p className="text-sm">Create your first link to see analytics!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glow-hover ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-main" />
          Link Type Distribution 🥧
        </CardTitle>
        <p className="text-sm text-foreground/60">
          Total: {totalLinks} links
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Donut Chart Representation */}
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 rounded-full border-8 border-secondary"></div>
            {chartData.map((item, index) => {
              const circumference = 2 * Math.PI * 48; // radius = 48
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const rotation = chartData.slice(0, index).reduce((sum, prev) => sum + prev.percentage, 0) * 3.6;
              
              return (
                <svg
                  key={item.type}
                  className="absolute inset-0 w-full h-full -rotate-90"
                  style={{ transform: `rotate(${rotation - 90}deg)` }}
                >
                  <circle
                    cx="64"
                    cy="64"
                    r="48"
                    fill="none"
                    className={`${item.color.replace('bg-', 'stroke-')} opacity-80`}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                  />
                </svg>
              );
            })}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{totalLinks}</div>
                <div className="text-xs text-foreground/60">Links</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {chartData.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <div className="flex items-center gap-1">
                    {item.icon}
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">{item.count}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}