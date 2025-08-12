"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
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
import {
  PaymentLink,
  LinkType,
  CreatorStats,

} from "@/types/relynk";
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
} from "lucide-react";

import { toast } from "sonner";
import Link from "next/link";

// Mock data - replace with actual API calls
const mockPaymentLinks: PaymentLink[] = [
  {
    id: "link_1",
    title: "Coffee Support",
    description: "Buy me a coffee to support my work!",
    creator: "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e" as Address,
    linkType: LinkType.DONATION,
    amountType: 1,
    usageType: 1,
    amount: "0.01",
    token: "0x0000000000000000000000000000000000000000" as Address,
    tokenSymbol: "ETH",
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true,
    isUsed: false,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    metadata: {
      linkType: LinkType.DONATION,
      title: "Coffee Support",
      description: "Buy me a coffee to support my work!",
      category: "Support",
      cause: "Support my development work",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    ipfsHash: "QmExample1",
    signature:
      "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
    originalLinkData: {
      linkId: "link_1",
      creator: "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e" as Address,
      linkType: LinkType.DONATION,
      amountType: 1,
      usageType: 1,
      amount: BigInt("10000000000000000"), // 0.01 ETH in wei
      token: "0x0000000000000000000000000000000000000000" as Address,
      expires: BigInt(Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000)),
      metadata: "QmExample1",
      nonce: BigInt(1),
    },
    isExpired: false,
    formattedAmount: "0.01 ETH",
    shortId: "link_1",
  },
  {
    id: "link_2",
    title: "Premium Course",
    description: "Access to blockchain development course",
    creator: "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e" as Address,
    linkType: LinkType.CONTENT,
    amountType: 0,
    usageType: 0,
    amount: "0.1",
    token: "0x0000000000000000000000000000000000000000" as Address,
    tokenSymbol: "ETH",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    isUsed: false,
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
    metadata: {
      linkType: LinkType.CONTENT,
      title: "Premium Course",
      description: "Access to blockchain development course",
      category: "Education",
      contentType: "course",
      previewContent: {
        description: "Learn blockchain development from scratch",
      },
      contentDetails: {
        language: "English",
        level: "beginner",
      },
      deliveryMethod: "encrypted_ipfs",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    ipfsHash: "QmExample2",
    signature:
      "0x1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`,
    originalLinkData: {
      linkId: "link_2",
      creator: "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e" as Address,
      linkType: LinkType.CONTENT,
      amountType: 0,
      usageType: 0,
      amount: BigInt("100000000000000000"), // 0.1 ETH in wei
      token: "0x0000000000000000000000000000000000000000" as Address,
      expires: BigInt(
        Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000)
      ),
      metadata: "QmExample2",
      nonce: BigInt(2),
    },
    isExpired: false,
    formattedAmount: "0.1 ETH",
    shortId: "link_2",
  },
  {
    id: "link_3",
    title: "Digital Art NFT",
    description: "Exclusive digital art piece",
    creator: "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e" as Address,
    linkType: LinkType.PRODUCT,
    amountType: 0,
    usageType: 0,
    amount: "0.05",
    token: "0x0000000000000000000000000000000000000000" as Address,
    tokenSymbol: "ETH",
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: false,
    isUsed: false,
    createdAt: new Date("2024-01-13"),
    updatedAt: new Date("2024-01-13"),
    metadata: {
      linkType: LinkType.PRODUCT,
      title: "Digital Art NFT",
      description: "Exclusive digital art piece",
      category: "Art",
      productName: "Digital Art NFT",
      images: [],
      specifications: {},
      shipping: {
        required: false,
        freeShipping: true,
      },
      digitalDelivery: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    ipfsHash: "QmExample3",
    signature:
      "0x2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222" as `0x${string}`,
    originalLinkData: {
      linkId: "link_3",
      creator: "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e" as Address,
      linkType: LinkType.PRODUCT,
      amountType: 0,
      usageType: 0,
      amount: BigInt("50000000000000000"), // 0.05 ETH in wei
      token: "0x0000000000000000000000000000000000000000" as Address,
      expires: BigInt(
        Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
      ),
      metadata: "QmExample3",
      nonce: BigInt(3),
    },
    isExpired: false,
    formattedAmount: "0.05 ETH",
    shortId: "link_3",
  },
];

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
  topPerformingLink: mockPaymentLinks[0],
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
  const { address } = useAccount();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [stats, setStats] = useState<CreatorStats>(mockStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterEnum>("all");
  const [_isLoading, setIsLoading] = useState(true);

  // Load payment links from storage
  useEffect(() => {
    const loadPaymentLinks = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        const { UnifiedIPFSService } = await import(
          "@/lib/unified-ipfs-service"
        );
        const links = await UnifiedIPFSService.getPaymentLinksByCreator(
          address
        );
        setPaymentLinks(links);

        // Update stats based on loaded links
        const activeLinks = links.filter(
          (link) => new Date(link.expires) > new Date()
        ).length;
        setStats((prev) => ({
          ...prev,
          totalLinks: links.length,
          activeLinks,
          topPerformingLink: links[0] || undefined,
        }));
      } catch (error) {
        console.error("Failed to load payment links:", error);
        toast.error("Failed to load payment links");
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentLinks();
  }, [address]);

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

  const filteredLinks = paymentLinks.filter((link) => {
    const matchesSearch =
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Determine if link is active based on expiration date
    const isActive = new Date(link.expires) > new Date();

    const matchesFilter =
      filterType === "all" ||
      (filterType === "active" && isActive) ||
      (filterType === "inactive" && !isActive);

    return matchesSearch && matchesFilter;
  });

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Links</p>
                <p className="text-2xl font-bold">{stats.totalLinks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active Links</p>
                <p className="text-2xl font-bold">{stats.activeLinks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Earnings</p>
                <p className="text-2xl font-bold">
                  ${stats.totalVolumeUSD || "0.00"} USD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Total Payments</p>
                <p className="text-2xl font-bold">{stats.totalPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Links</CardTitle>
              <CardDescription>
                Manage your payment links and track performance
              </CardDescription>
            </div>
            <Link href="/dashboard/links/create">
              <Button>
                <LinkIcon className="mr-2 h-4 w-4" />
                Create Link
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs
              value={filterType}
              onValueChange={(val) => setFilterType(val as FilterEnum)}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Links List */}
          <div className="space-y-4">
            {filteredLinks.length === 0 ? (
              <div className="text-center py-8">
                <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No payment links found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterType !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Create your first payment link to get started."}
                </p>
                <Link href="/dashboard/links/create">
                  <Button>Create Your First Link</Button>
                </Link>
              </div>
            ) : (
              filteredLinks.map((link) => {
                const isActive = new Date(link.expires) > new Date();
                return (
                  <Card
                    key={link.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="p-2 rounded-lg bg-muted">
                            {getTypeIcon(link.linkType)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">
                                {link.title}
                              </h3>
                              <Badge
                                className={getTypeBadgeColor(link.linkType)}
                              >
                                {getTypeLabel(link.linkType)}
                              </Badge>
                              <Badge
                                variant={isActive ? "default" : "secondary"}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {link.description}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-medium">
                                {link.amount} {link.tokenSymbol}
                              </span>
                              <span>
                                Expires: {link.expires.toLocaleDateString()}
                              </span>
                              <span>
                                Created: {link.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyLinkToClipboard(link.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => shareLink(link.id, link.title)}
                          >
                            <Share className="h-4 w-4" />
                          </Button>

                          <Link href={`/pay/${link.id}`} target="_blank">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
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
