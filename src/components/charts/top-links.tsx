"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkAnalytics } from "@/types/relynk";
import {
  Trophy,
  ExternalLink,
  Eye,
  MousePointer,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface TopLinksProps {
  analytics: LinkAnalytics[];
  className?: string;
}

export function TopLinks({ analytics, className }: TopLinksProps) {
  if (!analytics.length) {
    return (
      <Card className={`glow-hover ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-main" />
            Top Performing Links 🏆
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-foreground/60">
            <div className="text-center">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No link data available</p>
              <p className="text-sm">
                Create and share links to see performance!
              </p>
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
          <Trophy className="h-5 w-5 text-main" />
          Top Performing Links 🏆
        </CardTitle>
        <p className="text-sm text-foreground/60">Based on total revenue</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analytics.map((link, index) => (
            <div
              key={link.linkId}
              className="overflow-hidden flex flex-col sm:flex-row flex-wrap gap-y-2 items-center justify-between p-3 rounded-lg border border-border/50 hover:border-main/30 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-main/10 text-main font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {link.title.length > 20
                        ? link.title.slice(0, 20) + "..."
                        : link.title}
                    </p>
                    <Link href={`/pay/${link.linkId}`}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  {/* <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-xs text-foreground/60">
                      <Eye className="h-3 w-3" />
                      {link.views}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-foreground/60">
                      <MousePointer className="h-3 w-3" />
                      {link.clicks}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-foreground/60">
                      <CreditCard className="h-3 w-3" />
                      {link.payments}
                    </div>
                  </div> */}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">
                  ${link.formattedTotalAmountUSD || "0.00"} USD
                </div>
                <Badge variant="outline" className="text-xs">
                  {link.conversionRate.toFixed(1)}% conv.
                </Badge>
              </div>
            </div>
          ))}

          {analytics.length === 0 && (
            <div className="text-center py-8 text-foreground/60">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No performance data yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
