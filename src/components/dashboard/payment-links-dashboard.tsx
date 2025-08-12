"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkType, CreatorStats } from "@/types/relynk";
import { Address } from "viem";
import {
  Copy,
  Search,
  TrendingUp,
  DollarSign,
  Users,
  Link as LinkIcon,
  CreditCard,
  Heart,
  ShoppingBag,
  FileText,
  Eye,
  Share,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useUserPaymentLinks } from "@/hooks/use-payment-links";

const mockStats: CreatorStats = {
  address: "0x0000000000000000000000000000000000000000" as Address,
  totalLinks: 3,
  activeLinks: 2,
  totalEarnings: {
    "0x0000000000000000000000000000000000000000": BigInt("150000000000000000"), // 0.15 ETH
  } as Record<Address, bigint>,
  formattedTotalEarnings: {
    "0x0000000000000000000000000000000000000000": "0.15",
  } as Record<Address, string>,
  totalPayments: 12,
  totalClicks: 0,
  totalViews: 0,
  conversionRate: 0,
  // topPerformingLink: mockPaymentLinks[0],
  recentPayments: [],
  monthlyEarnings: {},
  linksByType: {
    [LinkType.PAYMENT]: 2,
    [LinkType.DONATION]: 1,
    [LinkType.PRODUCT]: 0,
    [LinkType.CONTENT]: 0,
  },
  averageOrderValue: {
    "0x0000000000000000000000000000000000000000": BigInt("50000000000000000"), // 0.05 ETH
  } as Record<Address, bigint>,
};

interface PaymentLinksDashboardProps {
  className?: string;
}

type FilterEnum = "all" | "active" | "inactive";

export function PaymentLinksDashboard({
  className,
}: PaymentLinksDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterEnum>("all");

  const {
    data: paymentLinks = [],
    totalCount,
    isLoading,
    activeLinks,
  } = useUserPaymentLinks(searchTerm, filterType);

  // Calculate stats from the loaded links
  // const activeLinks = paymentLinks.filter(
  //   (link) => new Date(link.expires) > new Date()
  // ).length;

  const stats: CreatorStats = {
    ...mockStats,
    totalLinks: totalCount || 0,
    activeLinks,
    topPerformingLink: paymentLinks[0] || undefined,
  };

  const getTypeIcon = (linkType: LinkType) => {
    switch (linkType) {
      case LinkType.PAYMENT:
        return <CreditCard className="h-4 w-4" />;
      case LinkType.DONATION:
        return <Heart className="h-4 w-4" />;
      case LinkType.PRODUCT:
        return <ShoppingBag className="h-4 w-4" />;
      case LinkType.CONTENT:
        return <FileText className="h-4 w-4" />;
      default:
        return <LinkIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (linkType: LinkType) => {
    switch (linkType) {
      case LinkType.PAYMENT:
        return "Payment";
      case LinkType.DONATION:
        return "Donation";
      case LinkType.PRODUCT:
        return "Product";
      case LinkType.CONTENT:
        return "Content";
      default:
        return "Link";
    }
  };

  const getTypeBadgeColor = (linkType: LinkType) => {
    switch (linkType) {
      case LinkType.PAYMENT:
        return "bg-blue-100 text-blue-800";
      case LinkType.DONATION:
        return "bg-pink-100 text-pink-800";
      case LinkType.PRODUCT:
        return "bg-green-100 text-green-800";
      case LinkType.CONTENT:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const copyLinkToClipboard = (linkId: string) => {
    const url = `${window.location.origin}/pay/${linkId}`;
    navigator.clipboard.writeText(url);
    toast.success("Payment link copied to clipboard!");
  };

  const shareLink = (linkId: string, title: string) => {
    const url = `${window.location.origin}/pay/${linkId}`;
    if (navigator.share) {
      navigator.share({
        title: `Payment Link: ${title}`,
        text: `Check out this payment link: ${title}`,
        url: url,
      });
    } else {
      copyLinkToClipboard(linkId);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-muted">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Links
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {stats.totalLinks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Active Links
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {stats.activeLinks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Earnings
                </p>
                <p className="text-lg sm:text-xl font-bold">
                  ${stats.totalVolumeUSD || "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Payments
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {stats.totalPayments}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Management */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl">
                Payment Links
              </CardTitle>
              <CardDescription className="text-sm">
                Manage your payment links and track performance
              </CardDescription>
            </div>
            <Link href="/dashboard/links/create" className="shrink-0">
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="sm:hidden">Create New Link</span>
                <span className="hidden sm:inline">Create Link</span>
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 sm:h-10"
              />
            </div>

            <Tabs
              value={filterType}
              onValueChange={(val) => setFilterType(val as FilterEnum)}
              className="w-full sm:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Links List */}
          <div className="space-y-3 sm:space-y-4">
            {paymentLinks.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <LinkIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                  No payment links found
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-md mx-auto">
                  {searchTerm || filterType !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Create your first payment link to get started."}
                </p>
                <Link href="/dashboard/links/create">
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Link
                  </Button>
                </Link>
              </div>
            ) : (
              paymentLinks.map((link) => {
                const isActive = new Date(link.expires) > new Date();
                return (
                  <Card
                    key={link.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        {/* Main content */}
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-muted shrink-0">
                            {getTypeIcon(link.linkType)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold text-sm sm:text-base truncate">
                                {link.title}
                              </h3>
                              <Badge
                                className={`${getTypeBadgeColor(
                                  link.linkType
                                )} text-xs`}
                              >
                                {getTypeLabel(link.linkType)}
                              </Badge>
                              <Badge
                                variant={isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>

                            <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                              {link.description}
                            </p>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <span className="font-medium">
                                {link.amount} {link.tokenSymbol}
                              </span>
                              <span className="hidden sm:inline">
                                Expires: {link.expires.toLocaleDateString()}
                              </span>
                              <span className="sm:hidden">
                                Exp: {link.expires.toLocaleDateString()}
                              </span>
                              <span className="hidden lg:inline">
                                Created: {link.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyLinkToClipboard(link.id)}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                          >
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => shareLink(link.id, link.title)}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                          >
                            <Share className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>

                          <Link href={`/pay/${link.id}`} target="_blank">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
