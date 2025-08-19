import { useQuery } from "@tanstack/react-query";
import { PaymentLink, LinkType } from "@/types/relynk";
import { UnifiedIPFSService } from "@/lib/unified-ipfs-service";

/**
 * Hook to fetch all public payment links for the explorer
 * This doesn't require authentication and shows all active links
 */
export function usePublicPaymentLinks() {
  return useQuery({
    queryKey: ["public-payment-links"],
    queryFn: async (): Promise<PaymentLink[]> => {
      try {
        // Get all payment links from IPFS
        // Note: This is a simplified approach. In a real implementation,
        // you might want to have a dedicated API endpoint that aggregates
        // all public links from multiple creators
        const allLinks: PaymentLink[] = [];
        
        // For now, we'll return mock data since we don't have a public API
        // In a real implementation, this would fetch from a public API endpoint
        return [];
      } catch (error) {
        console.error("Failed to fetch public payment links:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook to get explorer statistics
 */
export function useExplorerStats() {
  return useQuery({
    queryKey: ["explorer-stats"],
    queryFn: async () => {
      try {
        // In a real implementation, this would fetch from an analytics API
        // For now, return mock data
        return {
          totalLinks: 1247,
          totalCreators: 89,
          totalVolume: "125,430",
          totalTransactions: 3456,
          topCreators: [
            { username: "artcreator", links: 45, volume: "12,500" },
            { username: "developer", links: 23, volume: "8,900" },
            { username: "contentcreator", links: 156, volume: "21,000" },
          ],
        };
      } catch (error) {
        console.error("Failed to fetch explorer stats:", error);
        return {
          totalLinks: 0,
          totalCreators: 0,
          totalVolume: "0",
          totalTransactions: 0,
          topCreators: [],
        };
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook to search payment links by various criteria
 */
export function useSearchPaymentLinks(
  searchTerm: string,
  type?: string,
  sortBy?: string
) {
  const { data: allLinks = [] } = usePublicPaymentLinks();

  return useQuery({
    queryKey: ["search-payment-links", searchTerm, type, sortBy],
    queryFn: async () => {
      let filteredLinks = allLinks;

      // Filter by search term
      if (searchTerm.trim()) {
        filteredLinks = filteredLinks.filter((link) =>
          link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          link.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by type
      if (type && type !== "all") {
        // Convert string type to LinkType enum
        const linkTypeMap: Record<string, LinkType> = {
          "payment": LinkType.PAYMENT,
          "donation": LinkType.DONATION,
          "product": LinkType.PRODUCT,
          "content": LinkType.CONTENT,
        };
        const targetLinkType = linkTypeMap[type.toLowerCase()];
        if (targetLinkType !== undefined) {
          filteredLinks = filteredLinks.filter((link) => link.linkType === targetLinkType);
        }
      }

      // Sort results
      switch (sortBy) {
        case "popular":
          // Sort by clicks (would need to be tracked)
          break;
        case "recent":
          filteredLinks.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "price-low":
          filteredLinks.sort((a, b) => 
            parseFloat(a.amount) - parseFloat(b.amount)
          );
          break;
        case "price-high":
          filteredLinks.sort((a, b) => 
            parseFloat(b.amount) - parseFloat(a.amount)
          );
          break;
        default:
          // Default to recent
          filteredLinks.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }

      return filteredLinks;
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Mock data for development
 */
export const mockExplorerData = {
  links: [
    {
      id: "1",
      title: "Premium NFT Collection",
      description: "Exclusive digital art collection with utility tokens",
      creator: "0x1234567890123456789012345678901234567890",
      creatorUsername: "artcreator",
      linkType: "PRODUCT",
      amount: "0.1",
      token: "0x0000000000000000000000000000000000000000", // ETH
      clicks: 1250,
      sales: 45,
      createdAt: new Date("2024-01-15").toISOString(),
      isActive: true,
      thumbnail: "🎨",
      usageType: 1, // MULTIPLE
      isExpired: false,
      isUsed: false,
    },
    {
      id: "2",
      title: "Support My Project",
      description: "Help fund my open-source development work",
      creator: "0x5678901234567890123456789012345678901234",
      creatorUsername: "developer",
      linkType: "DONATION",
      amount: "0",
      token: "0x0000000000000000000000000000000000000000",
      clicks: 890,
      sales: 23,
      createdAt: new Date("2024-01-14").toISOString(),
      isActive: true,
      thumbnail: "💻",
      usageType: 1,
      isExpired: false,
      isUsed: false,
    },
    {
      id: "3",
      title: "Monthly Subscription",
      description: "Access to premium content and community",
      creator: "0x9012345678901234567890123456789012345678",
      creatorUsername: "contentcreator",
      linkType: "PAYMENT",
      amount: "10",
      token: "0xA0b86a33E6441b8dB2B2B0b0b0b0b0b0b0b0b0b0", // USDC
      clicks: 2100,
      sales: 156,
      createdAt: new Date("2024-01-13").toISOString(),
      isActive: true,
      thumbnail: "📚",
      usageType: 1,
      isExpired: false,
      isUsed: false,
    },
    {
      id: "4",
      title: "Exclusive Tutorial Series",
      description: "Learn advanced Web3 development techniques",
      creator: "0x3456789012345678901234567890123456789012",
      creatorUsername: "web3teacher",
      linkType: "CONTENT",
      amount: "25",
      token: "0xA0b86a33E6441b8dB2B2B0b0b0b0b0b0b0b0b0b0",
      clicks: 567,
      sales: 34,
      createdAt: new Date("2024-01-12").toISOString(),
      isActive: true,
      thumbnail: "🎓",
      usageType: 1,
      isExpired: false,
      isUsed: false,
    },
  ],
  stats: {
    totalLinks: 1247,
    totalCreators: 89,
    totalVolume: "125,430",
    totalTransactions: 3456,
  },
};
