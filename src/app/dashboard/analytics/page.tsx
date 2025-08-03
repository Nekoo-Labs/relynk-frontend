"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Download,
  Eye,
  MousePointer,
  PieChart,
  TrendingUp,
  RefreshCw,
  Wallet,
  DollarSign,
} from "lucide-react";
import {
  useAnalytics,
  useTimeRangeAnalytics,
  useTopPerformingLinks,
  useRevenueTrends,
} from "@/hooks/use-analytics";

type TimeRange = "7d" | "30d" | "90d" | "1y";

const timeFilters: { label: string; value: TimeRange }[] = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "All time", value: "1y" },
];

export default function AnalyticsPage() {
  const { address, isConnected } = useAccount();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("30d");

  // Fetch analytics data using React Query
  const { stats, linkAnalytics, isLoading, error, refresh } = useAnalytics();
  const timeRangeAnalytics = useTimeRangeAnalytics(selectedTimeRange);
  const topPerformingLinks = useTopPerformingLinks(5);
  // Map 1y to 90d for revenue trends since the hook doesn't support 1y
  const revenueTrendsTimeRange =
    selectedTimeRange === "1y"
      ? "90d"
      : (selectedTimeRange as "7d" | "30d" | "90d");
  const revenueTrends = useRevenueTrends(revenueTrendsTimeRange);

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Wallet className="h-16 w-16 text-foreground/40" />
          <h2 className="text-2xl font-heading text-foreground">
            Connect Your Wallet
          </h2>
          <p className="text-foreground/60 text-center max-w-md">
            Connect your wallet to view your analytics and track your link
            performance.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading text-foreground">
              📊 Analytics
            </h1>
            <p className="text-foreground/60 mt-1">
              Deep insights into your link performance and revenue.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="border border-border shadow-shadow"
              onClick={refresh}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button className="bg-main text-main-foreground hover:bg-main/90 shadow-shadow">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Time Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-base text-foreground/60 mr-2">
                Time Period:
              </span>
              {timeFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={
                    selectedTimeRange === filter.value ? "default" : "neutral"
                  }
                  size="sm"
                  onClick={() => setSelectedTimeRange(filter.value)}
                  className={
                    selectedTimeRange === filter.value
                      ? "bg-main text-main-foreground shadow-shadow"
                      : "border border-border shadow-shadow"
                  }
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-12" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Total Clicks"
                value={stats.totalClicks}
                icon={<MousePointer className="h-4 w-4" />}
                trend={{ value: 12, isPositive: true }}
              />
              <StatCard
                title="Total Views"
                value={stats.totalViews}
                icon={<Eye className="h-4 w-4" />}
                trend={{ value: 8, isPositive: true }}
              />
              <StatCard
                title="Conversion Rate"
                value={`${stats.conversionRate.toFixed(1)}%`}
                icon={<TrendingUp className="h-4 w-4" />}
                trend={{ value: 2.3, isPositive: true }}
              />
              <StatCard
                title="Total Revenue"
                value={`$${stats.totalVolumeUSD}`}
                icon={<DollarSign className="h-4 w-4" />}
                trend={{ value: 25, isPositive: true }}
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : revenueTrends.length > 0 ? (
                <div className="h-[300px] space-y-4">
                  <div className="text-sm text-foreground/60 mb-4">
                    Monthly revenue for the last 6 months
                  </div>
                  {revenueTrends.map((trend, index) => (
                    <div
                      key={trend.month}
                      className="flex items-center justify-between p-3 border border-border rounded-base"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-main rounded-full" />
                        <span className="text-sm font-medium">
                          {trend.month}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-heading text-main">
                          ${trend.formatted}
                        </div>
                        <div className="text-xs text-foreground/60">USD</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-foreground/60 border border-dashed border-border rounded-base">
                  📈 No revenue data available yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Links by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-[300px] overflow-y-auto space-y-4">
                  <div className="text-sm text-foreground/60 mb-4">
                    Distribution of your payment links
                  </div>
                  {Object.entries(stats.linksByType).map(([typeKey, count]) => {
                    const typeNum = parseInt(typeKey);
                    const getTypeInfo = (type: number) => {
                      switch (type) {
                        case 0: // LinkType.PAYMENT
                          return {
                            label: "Payment",
                            color: "bg-blue-100 text-blue-800",
                            icon: "💳",
                          };
                        case 1: // LinkType.DONATION
                          return {
                            label: "Donation",
                            color: "bg-pink-100 text-pink-800",
                            icon: "💝",
                          };
                        case 2: // LinkType.PRODUCT
                          return {
                            label: "Product",
                            color: "bg-green-100 text-green-800",
                            icon: "🛍️",
                          };
                        case 3: // LinkType.CONTENT
                          return {
                            label: "Content",
                            color: "bg-purple-100 text-purple-800",
                            icon: "📄",
                          };
                        default:
                          return {
                            label: "Unknown",
                            color: "bg-gray-100 text-gray-800",
                            icon: "🔗",
                          };
                      }
                    };

                    const typeInfo = getTypeInfo(typeNum);

                    return (
                      <div
                        key={typeKey}
                        className="flex items-center justify-between p-3 border border-border rounded-base"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{typeInfo.icon}</span>
                          <Badge
                            variant="secondary"
                            className={`${typeInfo.color} border-0`}
                          >
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-heading text-foreground">
                            {count}
                          </div>
                          <div className="text-xs text-foreground/60">
                            {count === 1 ? "link" : "links"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {stats.totalLinks === 0 && (
                    <div className="text-center text-foreground/60 py-8 border border-dashed border-border rounded-base">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="font-medium">No links created yet</div>
                      <div className="text-sm text-foreground/40 mt-1">
                        Create your first payment link to see the distribution
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Links */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top Performing Links</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border border-border rounded-base bg-secondary-background"
                  >
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-base" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center space-y-1">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="text-center space-y-1">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="text-center space-y-1">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-foreground/60">
                  Failed to load analytics data
                </p>
                <Button variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : topPerformingLinks.length > 0 ? (
              <div className="space-y-4">
                {topPerformingLinks.map((link, index) => (
                  <div
                    key={link.linkId}
                    className="flex items-center justify-between p-4 border border-border rounded-base bg-secondary-background"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-base bg-main text-main-foreground font-heading text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-heading text-foreground">
                          {link.title}
                        </h3>
                        <p className="text-sm text-foreground/60">
                          Conversion Rate: {link.conversionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-heading text-foreground">
                          {link.clicks}
                        </p>
                        <p className="text-foreground/60">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-heading text-foreground">
                          {link.payments}
                        </p>
                        <p className="text-foreground/60">Payments</p>
                      </div>
                      <div className="text-center">
                        <p className="font-heading text-main">
                          ${link.formattedTotalAmountUSD}
                        </p>
                        <p className="text-foreground/60">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-foreground/60">No payment links found</p>
                <p className="text-sm text-foreground/40">
                  Create your first payment link to see analytics here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
