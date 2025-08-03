"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileCreationForm } from "@/components/profile-creation-form";
import { UsernameSetup } from "@/components/username-setup";
import { useCurrentUserProfile } from "@/hooks/use-profile-data";
import { usePaymentLinks } from "@/hooks/use-payment-links";
import { useAnalytics } from "@/hooks/use-analytics";
import { useStableLoading } from "@/hooks/use-stable-loading";
import {
  User,
  ExternalLink,
  Edit,
  Plus,
  Eye,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { address, isConnecting } = useAccount();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get user's profile data using React Query
  const {
    profile,
    username,
    profileData,
    isLoading: isLoadingProfile,
  } = useCurrentUserProfile();

  // Get payment links data
  const { data: paymentLinks = [], isLoading: isLoadingLinks } =
    usePaymentLinks(address!);

  // Get analytics data
  const { stats: analyticsData, isLoading: isLoadingAnalytics } =
    useAnalytics();

  // Use stable loading to prevent flashing
  const stableLoading = useStableLoading(isConnecting || isLoadingProfile, 500);

  // Show loading state while connecting wallet or loading profile
  // Add a small delay to prevent flashing during quick state transitions
  if (stableLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show username setup if no profile exists (only after loading is complete and we have an address)
  if (!username && !profile && address) {
    return <UsernameSetup />;
  }

  // Show profile editing form if user wants to edit
  if (showCreateForm) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading text-foreground">
                ✨ Edit Profile
              </h1>
              <p className="text-foreground/60 mt-1">
                Update your profile information and links
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>

          <ProfileCreationForm existingUsername={username} isEditing={true} />
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
              👤 Your Profile
            </h1>
            <p className="text-foreground/60 mt-1">
              Manage your profile and links
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${username}`} target="_blank">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View Profile
              </Button>
            </Link>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Profile Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground/60">
                  Username
                </label>
                <p className="font-medium">@{username}</p>
              </div>

              {profileData && (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground/60">
                      Display Name
                    </label>
                    <p className="font-medium">{profileData.name}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground/60">
                      Bio
                    </Label>
                    <p className="text-sm">
                      {profileData.bio || "No bio added"}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground/60">
                      Profile URL
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-secondary px-2 py-1 rounded">
                        /{username}
                      </code>
                      <Link href={`/${username}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Profile Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Profile Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-secondary rounded-base">
                  <p className="text-2xl font-bold text-main">
                    {paymentLinks.filter((l) => l.isActive).length || 0}
                  </p>
                  <p className="text-sm text-foreground/60">Active Links</p>
                </div>
                <div className="text-center p-3 bg-secondary rounded-base">
                  <p className="text-2xl font-bold text-main">
                    {analyticsData?.totalClicks || 0}
                  </p>
                  <p className="text-sm text-foreground/60">Total Clicks</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-secondary rounded-base">
                  <p className="text-2xl font-bold text-main">
                    {analyticsData?.totalViews || 0}
                  </p>
                  <p className="text-sm text-foreground/60">Total Views</p>
                </div>
                <div className="text-center p-3 bg-secondary rounded-base">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4 text-main" />
                    <p className="text-2xl font-bold text-main">
                      {analyticsData?.totalVolumeUSD || "0.00"}
                    </p>
                  </div>
                  <p className="text-sm text-foreground/60">Total Revenue</p>
                </div>
              </div>

              <div className="text-center p-3 bg-secondary rounded-base">
                <p className="text-2xl font-bold text-main">
                  {profile
                    ? new Date(
                        Number(profile.createdAt) * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="text-sm text-foreground/60">Profile Created</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Links Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                🔗 Your Payment Links
              </span>
              <Link href="/dashboard/links">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Link
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLinks ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-main border-t-transparent rounded-full animate-spin" />
              </div>
            ) : paymentLinks && paymentLinks.length > 0 ? (
              <div className="space-y-3">
                {paymentLinks
                  .slice(0, 5) // Show only first 5 links
                  .map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-4 border border-border rounded-base bg-secondary-background"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={link.isActive ? "default" : "secondary"}
                        >
                          {link.linkType === 0
                            ? "Donation"
                            : link.linkType === 1
                            ? "Service"
                            : link.linkType === 2
                            ? "Product"
                            : "Content"}
                        </Badge>
                        <div>
                          <h4 className="font-medium">{link.title}</h4>
                          <p className="text-sm text-foreground/60">
                            {link.formattedAmount}
                          </p>
                          <p className="text-xs text-foreground/40">
                            {link.clicks || 0} clicks • {link.views || 0} views
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={link.isActive ? "default" : "secondary"}
                        >
                          {link.isActive ? "Active" : "Expired"}
                        </Badge>
                        <Link href={`/dashboard/links`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}

                {paymentLinks.length > 5 && (
                  <div className="text-center pt-4">
                    <Link href="/dashboard/links">
                      <Button variant="outline" size="sm">
                        View All {paymentLinks.length} Links
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <p>No payment links created yet</p>
                <p className="text-sm mt-1">
                  Create your first payment link to get started!
                </p>
                <Link href="/dashboard/links">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Link
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
