"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Edit,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { PaymentLink, LinkType } from "@/types/relynk";
import { toast } from "sonner";
import {
  useUserPaymentLinks,
  useDeletePaymentLink,
} from "@/hooks/use-payment-links";

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

  const handleCopyLink = async (linkId: string) => {
    const linkUrl = `${window.location.origin}/pay/${linkId}`;
    try {
      await navigator.clipboard.writeText(linkUrl);
      toast.success("Link copied to clipboard! 📋");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!address) return;

    deletePaymentLinkMutation.mutate(linkId);
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
            <Link href="/dashboard/links/create">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Links</h1>
            <p className="text-muted-foreground">
              Manage your payment links and track their performance
            </p>
          </div>
          <Link href="/dashboard/links/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Link
            </Button>
          </Link>
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
            <CardTitle className="flex items-center gap-2">
              All Links ({filteredLinks.length})
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
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
                {!searchTerm && (
                  <Link href="/dashboard/links/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Link
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 border border-border rounded-base bg-secondary-background hover:bg-background transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{link.title}</h3>
                        <Badge
                          className={`text-xs ${linkTypeStyles[link.linkType]}`}
                        >
                          {linkTypeLabels[link.linkType]}
                        </Badge>
                        <StatusBadge status={getStatusFromLink(link)} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate max-w-md">
                          {generateLinkUrl(link.id)}
                        </span>
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

                    <div className="flex items-center gap-6 text-sm">
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
