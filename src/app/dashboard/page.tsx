"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardWelcomeCard } from "@/components/dashboard-welcome-card";
import { DashboardUsernameSetup } from "@/components/dashboard-username-setup";
import { useAccount } from "wagmi";
import { useProfileRegistry } from "@/hooks/use-profile-registry";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Link as LinkIcon,
  MousePointer,
  Plus,
  TrendingUp,
  Users,
  User,
  ExternalLink,
} from "lucide-react";

// Mock data for the dashboard
const mockStats = {
  totalLinks: 24,
  totalClicks: 1247,
  totalConversions: 89,
  totalVolume: "$2,847",
};

const mockRecentLinks = [
  {
    id: 1,
    title: "Premium Design Pack",
    type: "Digital Product",
    clicks: 45,
    conversions: 12,
    revenue: "$240",
  },
  {
    id: 2,
    title: "Notion Template Bundle",
    type: "Digital Product",
    clicks: 32,
    conversions: 8,
    revenue: "$160",
  },
  {
    id: 3,
    title: "Coffee Donation",
    type: "Donation",
    clicks: 18,
    conversions: 15,
    revenue: "$75",
  },
];

export default function DashboardPage() {
  const { address } = useAccount();
  const { useGetProfileByOwner } = useProfileRegistry();
  const searchParams = useSearchParams();

  // Get user's profile
  const { data: profileResult } = useGetProfileByOwner(address!);
  const [profile, username] = profileResult || [null, ''];
  const hasProfile = !!profile;

  // Check if user has skipped setup
  const hasSkippedSetup = searchParams.get('skipSetup') === 'true';

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
              window.history.replaceState({}, '', '/dashboard');
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
              <Badge variant="outline" className="hover:bg-secondary cursor-pointer">
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
              value={mockStats.totalLinks}
              icon={<LinkIcon className="h-4 w-4" />}
              trend={{ value: 12, isPositive: true }}
            />
          </div>
          <div className="hover:scale-105 transition-transform duration-300">
            <StatCard
              title="Total Clicks 👆"
              value={mockStats.totalClicks}
              icon={<MousePointer className="h-4 w-4" />}
              trend={{ value: 8, isPositive: true }}
            />
          </div>
          <div className="hover:scale-105 transition-transform duration-300">
            <StatCard
              title="Conversions 📈"
              value={mockStats.totalConversions}
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{ value: 15, isPositive: true }}
            />
          </div>
          <div className="hover:scale-105 transition-transform duration-300">
            <StatCard
              title="Total Volume 💰"
              value={mockStats.totalVolume}
              icon={<CreditCard className="h-4 w-4" />}
              trend={{ value: 22, isPositive: true }}
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glow-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-main" />
                Performance Overview 📊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-foreground/60 shimmer rounded-base">
                📊 Performance chart will be implemented here ✨
              </div>
            </CardContent>
          </Card>

          <Card className="glow-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-main" />
                Link Type Distribution 🥧
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-foreground/60 shimmer rounded-base">
                🥧 Link type chart will be implemented here ✨
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Links */}
        <Card className="glow-hover">
          <CardHeader>
            <CardTitle>🔗 Recent Links ✨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 border border-border rounded-base bg-secondary-background hover:shadow-lg hover:scale-[1.02] transition-all duration-300 glow-hover"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-1">
                    <h3 className="font-heading text-foreground">
                      {link.title} 💕
                    </h3>
                    <p className="text-sm text-foreground/60">{link.type}</p>
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
                        {link.conversions}
                      </p>
                      <p className="text-foreground/60">Conversions</p>
                    </div>
                    <div className="text-center">
                      <p className="font-heading text-main">{link.revenue}</p>
                      <p className="text-foreground/60">Revenue</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
