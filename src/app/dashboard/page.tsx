"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardWelcomeCard } from "@/components/dashboard-welcome-card";
import { DashboardUsernameSetup } from "@/components/dashboard-username-setup";
import { PaymentLinksDashboard } from "@/components/dashboard/payment-links-dashboard";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { LinkTypeChart } from "@/components/charts/link-type-chart";
import { TopLinks } from "@/components/charts/top-links";
import { useAccount } from "wagmi";
import { useProfileRegistry } from "@/hooks/use-profile-registry";
import { useSearchParams } from "next/navigation";
import {
  useAnalytics,
  useRevenueTrends,
  useTopPerformingLinks,
} from "@/hooks/use-analytics";
import {
  CreditCard,
  Link as LinkIcon,
  MousePointer,
  Plus,
  TrendingUp,
  User,
  ExternalLink,
} from "lucide-react";
import { Suspense } from "react";

function DashboardContent() {
  const { address } = useAccount();
  const { useGetProfileByOwner } = useProfileRegistry();
  const searchParams = useSearchParams();

  // Get analytics data
  const { stats, isLoading: loadingAnalytics } = useAnalytics();
  const revenueTrends = useRevenueTrends();
  const topPerformingLinks = useTopPerformingLinks(5);

  // Get user's profile
  const { data: profileResult, isLoading: loadingProfile } =
    useGetProfileByOwner(address!);
  const [profile, username] = (profileResult as
    | [unknown, string]
    | undefined) || [null, ""];
  const hasProfile = !!profile;

  if (loadingProfile || loadingAnalytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary-background/30">
        <Card className="w-full max-w-md mx-4 glow-soft">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
            <p className="text-foreground/60 text-center">
              {loadingProfile
                ? "Checking your profile..."
                : "Loading analytics..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has skipped setup
  const hasSkippedSetup = searchParams.get("skipSetup") === "true";

  // Show username setup page if user doesn't have profile and hasn't skipped
  if (!hasProfile && !hasSkippedSetup) {
    return <DashboardUsernameSetup />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="float-animation">
            <h1 className="text-3xl font-heading text-foreground">
              💖 Welcome back, cutie!
            </h1>
            <p className="text-foreground/60 mt-1">
              Here&apos;s what&apos;s happening with your links today~ ✨
            </p>
          </div>
          <div className="flex gap-2">
            {hasProfile && (
              <Link href={`/${username}`} target="_blank">
                <Button variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Profile
                </Button>
              </Link>
            )}
            <Link href="/dashboard/links/create">
              <Button className="bg-main text-main-foreground hover:bg-main/90 shadow-shadow glow-hover hover:scale-105 transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            </Link>
          </div>
        </div>

        {/* Username Setup Welcome Card - only show if user has skipped setup */}
        {hasSkippedSetup && (
          <DashboardWelcomeCard
            hasProfile={hasProfile}
            username={username}
            onSkip={() => {
              // User has already skipped, so just hide the card
              window.history.replaceState({}, "", "/dashboard");
            }}
          />
        )}

        {/* Profile Status Badge */}
        {hasProfile && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Profile Active: @{username}
            </Badge>
            <Link href="/dashboard/profile">
              <Badge
                variant="outline"
                className="hover:bg-secondary cursor-pointer"
              >
                Manage Profile
              </Badge>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="hover:scale-105 transition-transform duration-300">
            <StatCard
              title="Total Links 🔗"
              value={stats.totalLinks}
              icon={<LinkIcon className="h-4 w-4" />}
              trend={{ value: 12, isPositive: true }}
            />
          </div>
          <div className="hover:scale-105 transition-transform duration-300">
            <StatCard
              title="Total Clicks 👆"
              value={stats.totalClicks}
              icon={<MousePointer className="h-4 w-4" />}
              trend={{ value: 8, isPositive: true }}
            />
          </div>
          <div className="hover:scale-105 transition-transform duration-300">
            <StatCard
              title="Conversions 📈"
              value={stats.totalPayments}
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{
                value: stats.conversionRate,
                isPositive: stats.conversionRate > 0,
              }}
            />
          </div>
          <div className="hover:scale-105 transition-transform duration-300">
            <StatCard
              title="Total Volume 💰"
              value={`$${stats.totalVolumeUSD || "0"}`}
              icon={<CreditCard className="h-4 w-4" />}
              trend={{ value: 22, isPositive: true }}
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <RevenueChart data={revenueTrends} />
          <LinkTypeChart linksByType={stats.linksByType} />
        </div>

        {/* Top Performing Links */}
        <TopLinks analytics={topPerformingLinks} />

        {/* Payment Links Dashboard */}
        <PaymentLinksDashboard />
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
