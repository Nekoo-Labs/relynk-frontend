"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  Edit,
  ExternalLink,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import CreateLinkLauncher from "@/components/payment/create-link-launcher";
import { PaymentLink, LinkType } from "@/types/relynk";
import { ProfileData, ProfileLink } from "@/types/profile";
import { toast } from "sonner";
import { invalidatePaymentRelatedCaches } from "@/services/api";
import {
  useUserPaymentLinks,
  useDeletePaymentLink,
} from "@/hooks/use-payment-links";
import {
  useProfileByOwner,
  useUpdateProfileData,
} from "@/hooks/use-profile-data";

const linkTypeLabels = {
  [LinkType.PAYMENT]: "Payment",
  [LinkType.DONATION]: "Donation",
  [LinkType.PRODUCT]: "Product",
  [LinkType.CONTENT]: "Content",
};

const linkTypeStyles = {
  [LinkType.PAYMENT]: "bg-chart-3 text-white",
  [LinkType.DONATION]: "bg-chart-4 text-white",
  [LinkType.PRODUCT]: "bg-chart-1 text-white",
  [LinkType.CONTENT]: "bg-chart-2 text-white",
};

export default function LinksPage() {
  const { address } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingToggle, setPendingToggle] = useState<string | null>(null);

  // Use React Query hooks for data fetching
  const {
    data: filteredLinks = [],
    totalCount,
    filteredCount,
    isLoading,
    error,
    refetch,
  } = useUserPaymentLinks(searchTerm);

  const deletePaymentLinkMutation = useDeletePaymentLink();

  // Profile data hooks for link-in-bio functionality
  const {
    profileData,
    isLoading: isLoadingProfile,
  } = useProfileByOwner(address);

  const updateProfileMutation = useUpdateProfileData();
  const queryClient = useQueryClient();

  // Helper function to check if a payment link is in the profile
  const isLinkInProfile = (paymentLinkId: string): boolean => {
    if (!profileData) return false;
    const linkUrl = `${window.location.origin}/pay/${paymentLinkId}`;
    return profileData.links.some(link => link.url === linkUrl);
  };

  // Helper function to convert PaymentLink to ProfileLink
  const convertPaymentLinkToProfileLink = (paymentLink: PaymentLink): ProfileLink => {
    const getTypeFromLinkType = (linkType: LinkType): ProfileLink["type"] => {
      switch (linkType) {
        case LinkType.PAYMENT:
          return "payment";
        case LinkType.DONATION:
          return "donation";
        case LinkType.PRODUCT:
          return "product";
        case LinkType.CONTENT:
          return "content";
        default:
          return "payment";
      }
    };

    const getAmountTypeString = (amountType: any): 'FIXED' | 'DYNAMIC' => {
      return amountType === 0 ? 'FIXED' : 'DYNAMIC';
    };

    return {
      id: paymentLink.id,
      title: paymentLink.title,
      url: `${window.location.origin}/pay/${paymentLink.id}`,
      description: paymentLink.description,
      icon: "",
      isActive: paymentLink.isActive && !paymentLink.isExpired,
      order: profileData?.links.length || 0,
      type: getTypeFromLinkType(paymentLink.linkType),
      amount: paymentLink.amount,
      amountType: getAmountTypeString(paymentLink.amountType),
      tokenSymbol: paymentLink.tokenSymbol,
      formattedAmount: paymentLink.formattedAmount,
    };
  };

  // Handle toggling link in profile with optimistic updates
  const handleToggleLinkInProfile = useCallback(async (paymentLink: PaymentLink) => {
    if (!profileData || !address) {
      toast.error("Profile not found. Please create a profile first.");
      return;
    }

    // Set loading state for this specific link
    setPendingToggle(paymentLink.id);

    const linkUrl = `${window.location.origin}/pay/${paymentLink.id}`;
    const isCurrentlyInProfile = isLinkInProfile(paymentLink.id);

    let updatedLinks: ProfileLink[];
    let actionMessage: string;

    if (isCurrentlyInProfile) {
      // Remove link from profile
      updatedLinks = profileData.links.filter(link => link.url !== linkUrl);
      actionMessage = `Removed "${paymentLink.title}" from profile`;
    } else {
      // Add link to profile
      const newProfileLink = convertPaymentLinkToProfileLink(paymentLink);
      updatedLinks = [...profileData.links, newProfileLink];
      actionMessage = `Added "${paymentLink.title}" to profile`;
    }

    // Prepare updated profile data
    const updatedProfileData: ProfileData = {
      ...profileData,
      links: updatedLinks,
    };

    try {
      // Optimistic update - immediately update the UI
      const profileQueryKey = ["profiles", "byOwner", address];

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileQueryKey });

      // Optimistically update to the new value
      queryClient.setQueryData(profileQueryKey, (old: any) => {
        if (old?.profileData) {
          return {
            ...old,
            profileData: updatedProfileData
          };
        }
        return old;
      });

      // Show loading toast
      const loadingToast = toast.loading("Signing transaction...");

      // Perform the mutation
      await updateProfileMutation.mutateAsync(updatedProfileData);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(actionMessage);

    } catch (error) {
      console.error("Failed to update profile:", error);

      // Revert optimistic update on error
      const profileQueryKey = ["profiles", "byOwner", address];
      queryClient.setQueryData(profileQueryKey, (old: any) => {
        if (old?.profileData) {
          return {
            ...old,
            profileData: profileData // Revert to original data
          };
        }
        return old;
      });

      toast.error("Failed to update profile. Please try again.");
    } finally {
      // Clear loading state
      setPendingToggle(null);
    }
  }, [profileData, address, queryClient, updateProfileMutation]);

  const handleCopyLink = async (linkId: string) => {
    const linkUrl = `${window.location.origin}/pay/${linkId}`;
    try {
      await navigator.clipboard.writeText(linkUrl);
      toast.success("Link copied to clipboard! 📋");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!address) return;

    deletePaymentLinkMutation.mutate(linkId);
  };

  const handleRefresh = async () => {
    if (address) {
      // Invalidate caches and refetch data
      invalidatePaymentRelatedCaches(address);
      await refetch();
      toast.success("Data refreshed! 🔄");
    }
  };

  const getStatusFromLink = (
    link: PaymentLink
  ): "active" | "paused" | "completed" => {
    if (!link.isActive) return "paused";
    if (link.expires && new Date(link.expires) < new Date()) return "completed";
    return "active";
  };

  const formatAmount = (link: PaymentLink): string => {
    return `${link.amount} ${link.tokenSymbol}`;
  };

  const generateLinkUrl = (linkId: string): string => {
    return `${window.location.origin}/pay/${linkId}`;
  };

  if (!address) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-heading text-foreground mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-foreground/60">
              Please connect your wallet to view your payment links.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Payment Links
              </h1>
              <p className="text-muted-foreground">
                Manage your payment links and track their performance
              </p>
            </div>
            <Link href="/dashboard/links">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Link
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">
                Failed to load payment links
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap gap-y-2 items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Links</h1>
            <p className="text-muted-foreground">
              Manage your payment links and track their performance
            </p>
          </div>
          <CreateLinkLauncher />
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search links by title, description, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredLinks.filter((link) => link.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Filtered Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredCount || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Links Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                All Links ({filteredLinks.length})
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">
                  Loading your links...
                </span>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "No links found matching your search."
                    : "No payment links found."}
                </p>
                {!searchTerm && <CreateLinkLauncher />}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLinks.map((link) => {
                  const isInProfile = isLinkInProfile(link.id);
                  return (
                  <div
                    key={link.id}
                    className={`flex flex-wrap gap-y-2 items-center justify-between p-4 transition-all duration-300 ${
                      isInProfile
                        ? "border-2 border-main rounded-lg bg-main/5 hover:bg-main/10 shadow-lg hover:shadow-xl ring-1 ring-main/20"
                        : "border border-border rounded-base bg-secondary-background hover:bg-background"
                    }`}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold">{link.title}</h3>
                        <div className="flex gap-1">
                          <Badge
                            className={`text-xs ${
                              linkTypeStyles[link.linkType]
                            }`}
                          >
                            {linkTypeLabels[link.linkType]}
                          </Badge>
                          <StatusBadge status={getStatusFromLink(link)} />
                          {isInProfile && (
                            <Badge className="text-xs bg-main text-main-foreground">
                              In Profile
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground @container">
                        <div className="w-full overflow-x-auto">
                          <code className="max-w-md">
                            {generateLinkUrl(link.id)}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopyLink(link.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            window.open(generateLinkUrl(link.id), "_blank")
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 gap-y-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">-</p>
                        <p className="text-muted-foreground">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">-</p>
                        <p className="text-muted-foreground">Conversions</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-primary">
                          {formatAmount(link)}
                        </p>
                        <p className="text-muted-foreground">Amount</p>
                      </div>
                      <div className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative">
                                  <Switch
                                    checked={isLinkInProfile(link.id)}
                                    onCheckedChange={() => handleToggleLinkInProfile(link)}
                                    disabled={
                                      isLoadingProfile ||
                                      updateProfileMutation.isPending ||
                                      pendingToggle === link.id
                                    }
                                    className="scale-75 data-[state=checked]:bg-main data-[state=unchecked]:bg-gray-500 transition-all duration-200"
                                  />
                                  {pendingToggle === link.id && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Loader2 className="h-3 w-3 animate-spin text-white" />
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {isLinkInProfile(link.id)
                                    ? "Remove from link-in-bio profile"
                                    : "Add to link-in-bio profile"
                                  }
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <p className={`text-xs ${
                            isInProfile
                              ? "text-main font-medium"
                              : "text-muted-foreground"
                          }`}>
                            {pendingToggle === link.id
                              ? "Updating..."
                              : isInProfile
                                ? "In Profile ✓"
                                : "Add to profile"
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" title="Edit link">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLink(link.id)}
                          disabled={deletePaymentLinkMutation.isPending}
                          title="Delete link"
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          {deletePaymentLinkMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="More options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
