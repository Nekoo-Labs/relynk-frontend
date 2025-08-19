"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import {
  Search,
  TrendingUp,
  Users,
  DollarSign,
  Link as LinkIcon,
  Clock,
  ExternalLink,
  Copy,
  Filter,
  SortDesc,
  Eye,
  Heart,
  ShoppingBag,
  FileText,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import ConnectWallet from "@/components/ui/connect-wallet";
import { toast } from "sonner";
import { useExplorerStats, mockExplorerData } from "@/hooks/use-public-explorer";
import { PaymentModal } from "@/components/explorer/payment-modal";
import { TrendingCreators } from "@/components/explorer/trending-creators";
import { CreatorsGrid } from "@/components/explorer/creators-grid";
import { ProductsGrid } from "@/components/explorer/products-grid";
import { ContentGrid } from "@/components/explorer/content-grid";

// Use mock data for now (in real implementation, this would come from the API)
const mockLinks = mockExplorerData.links.map(link => ({
  id: link.id,
  title: link.title,
  description: link.description,
  creator: `${link.creator.slice(0, 6)}...${link.creator.slice(-4)}`,
  creatorUsername: link.creatorUsername,
  type: link.linkType,
  price: link.linkType === "DONATION" ? "Any amount" : `${link.amount} ${link.token === "0x0000000000000000000000000000000000000000" ? "ETH" : "USDC"}`,
  clicks: link.clicks || 0,
  sales: link.sales || 0,
  createdAt: link.createdAt.split('T')[0],
  isActive: link.isActive,
  thumbnail: link.thumbnail,
}));

const typeIcons = {
  PAYMENT: <DollarSign className="w-4 h-4" />,
  DONATION: <Heart className="w-4 h-4" />,
  PRODUCT: <ShoppingBag className="w-4 h-4" />,
  CONTENT: <FileText className="w-4 h-4" />,
};

const typeColors = {
  PAYMENT: "bg-blue-100 text-blue-800 border-blue-200",
  DONATION: "bg-pink-100 text-pink-800 border-pink-200",
  PRODUCT: "bg-green-100 text-green-800 border-green-200",
  CONTENT: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function ExplorerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedLink, setSelectedLink] = useState<typeof mockLinks[0] | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("creators");
  const { isConnected } = useAccount();

  // Get explorer stats (using mock data for now)
  const { data: stats } = useExplorerStats();
  const mockStats = stats || mockExplorerData.stats;

  // Mock trending creators data
  const trendingCreators = [
    { username: "artcreator", address: "0x1234...5678", links: 45, volume: "12,500", rank: 1, verified: true },
    { username: "developer", address: "0x5678...9012", links: 23, volume: "8,900", rank: 2 },
    { username: "contentcreator", address: "0x9012...3456", links: 156, volume: "21,000", rank: 3, verified: true },
    { username: "web3teacher", address: "0x3456...7890", links: 34, volume: "5,600", rank: 4 },
  ];

  // Mock creators data for creators tab
  const allCreators = [
    {
      id: "1",
      username: "artcreator",
      displayName: "Digital Art Creator",
      bio: "Creating unique NFT collections and digital art pieces",
      address: "0x1234...5678",
      followers: 1250,
      totalLinks: 45,
      totalVolume: "12,500",
      verified: true,
      avatar: "🎨",
      joinedDate: "2024-01-10",
    },
    {
      id: "2",
      username: "developer",
      displayName: "Open Source Developer",
      bio: "Building the future of Web3 with open source tools",
      address: "0x5678...9012",
      followers: 890,
      totalLinks: 23,
      totalVolume: "8,900",
      verified: false,
      avatar: "💻",
      joinedDate: "2024-01-12",
    },
    {
      id: "3",
      username: "contentcreator",
      displayName: "Content Creator",
      bio: "Educational content about blockchain and crypto",
      address: "0x9012...3456",
      followers: 2100,
      totalLinks: 156,
      totalVolume: "21,000",
      verified: true,
      avatar: "📚",
      joinedDate: "2024-01-08",
    },
    {
      id: "4",
      username: "web3teacher",
      displayName: "Web3 Educator",
      bio: "Teaching advanced Web3 development techniques",
      address: "0x3456...7890",
      followers: 567,
      totalLinks: 34,
      totalVolume: "5,600",
      verified: true,
      avatar: "🎓",
      joinedDate: "2024-01-15",
    },
  ];

  // Filter content by type for different tabs
  const productLinks = mockLinks.filter(link => link.type === "PRODUCT");
  const contentLinks = mockLinks.filter(link => link.type === "CONTENT");

  const filteredLinks = mockLinks.filter((link) => {
    const matchesSearch = 
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.creatorUsername.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || link.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const sortedLinks = [...filteredLinks].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.clicks - a.clicks;
      case "sales":
        return b.sales - a.sales;
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary-background/30">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-heading text-main">
                Relynk
              </Link>
              <Badge variant="outline" className="hidden sm:flex">
                Explorer
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              {!isConnected && (
                <ConnectWallet className="hidden sm:flex" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-heading text-foreground">
            Explore Relynk 🔍
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Discover amazing products, and content from creators around the world.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <LinkIcon className="w-5 h-5 text-main" />
              </div>
              <div className="text-2xl font-heading text-foreground">
                {mockStats.totalLinks.toLocaleString()}
              </div>
              <div className="text-sm text-foreground/60">Total Links</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-main" />
              </div>
              <div className="text-2xl font-heading text-foreground">
                {mockStats.totalCreators}
              </div>
              <div className="text-sm text-foreground/60">Creators</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5 text-main" />
              </div>
              <div className="text-2xl font-heading text-foreground">
                ${mockStats.totalVolume}
              </div>
              <div className="text-sm text-foreground/60">Total Volume</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-main" />
              </div>
              <div className="text-2xl font-heading text-foreground">
                {mockStats.totalTransactions.toLocaleString()}
              </div>
              <div className="text-sm text-foreground/60">Transactions</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="creators" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Creators
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content
              </TabsTrigger>
            </TabsList>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-4 h-4" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {(activeTab === "products" || activeTab === "content") && (
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-border rounded-base bg-background text-foreground"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="popular">Most Popular</option>
                      <option value="sales">Most Sales</option>
                    </select>
                  </div>
                )}
              </div>
            </div>



            {/* Tab Content */}
            <TabsContent value="creators" className="space-y-6">
              <CreatorsGrid
                creators={allCreators}
                searchTerm={searchTerm}
              />
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <ProductsGrid
                products={productLinks}
                searchTerm={searchTerm}
                sortBy={sortBy}
                onPayClick={(product) => {
                  setSelectedLink(product);
                  setIsPaymentModalOpen(true);
                }}
                isConnected={isConnected}
              />
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <ContentGrid
                content={contentLinks}
                searchTerm={searchTerm}
                sortBy={sortBy}
                onPayClick={(content) => {
                  setSelectedLink(content);
                  setIsPaymentModalOpen(true);
                }}
                isConnected={isConnected}
              />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Payment Modal */}
        {selectedLink && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedLink(null);
            }}
            link={selectedLink}
          />
        )}
      </div>
    </div>
  );
}
