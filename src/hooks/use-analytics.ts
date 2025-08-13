import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { usePaymentLinks } from "./use-payment-links";
import {
  PaymentLink,
  CreatorStats,
  LinkAnalytics,
  LinkType,
  DashboardData,
} from "@/types/relynk";
import { Address, formatUnits } from "viem";
import {
  fetchCreatorAnalytics,
  type CreatorAnalyticsData,
} from "@/services/graphql";
import { SUPPORTED_TOKENS } from "@/lib/contracts";

// Convert SUPPORTED_TOKENS object to array for easier iteration
const SUPPORTED_TOKENS_ARRAY = Object.values(SUPPORTED_TOKENS);

// Helper function to format token amounts
function formatTokenAmount(amount: string, tokenAddress: string): string {
  const token = SUPPORTED_TOKENS_ARRAY.find(
    (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
  );
  if (!token) return "0";

  return formatUnits(BigInt(amount), token.decimals);
}

// Helper function to get token symbol
function _getTokenSymbol(tokenAddress: string): string {
  const token = SUPPORTED_TOKENS_ARRAY.find(
    (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
  );
  return token?.symbol || "UNKNOWN";
}

// Helper function to calculate USD value (simplified - in real app you'd fetch current prices)
function calculateUSDValue(amount: string, tokenSymbol: string): number {
  const numAmount = parseFloat(amount);
  // Mock exchange rates - in production, fetch from price API
  const rates: Record<string, number> = {
    USDC: 1.0,
    USDT: 1.0,
    IDRX: 0.000065, // Assuming 1 IDRX = 0.000065 USD (mock rate)
  };

  return numAmount * (rates[tokenSymbol] || 0);
}

/**
 * Hook to calculate comprehensive analytics from payment links data
 */
export function useAnalytics() {
  const { address } = useAccount();
  const {
    data: paymentLinks = [],
    isLoading: linksLoading,
    error: linksError,
  } = usePaymentLinks(address);

  // Fetch real analytics data from GraphQL
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
    isRefetching: analyticsRefetching,
  } = useQuery({
    queryKey: ["creator-analytics", address],
    queryFn: () => (address ? fetchCreatorAnalytics(address) : null),
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce refetching
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false, // Disable aggressive refetching
    refetchOnMount: false, // Only refetch if stale
    // Remove refetchInterval to stop constant polling
  });

  const analytics = useMemo(() => {
    if (!address) {
      return {
        stats: getEmptyStats(address),
        linkAnalytics: [],
        dashboardData: getEmptyDashboardData(address),
      };
    }

    const stats = calculateCreatorStats(
      analyticsData || undefined,
      paymentLinks,
      address
    );
    const linkAnalytics = paymentLinks.map((link) =>
      calculateLinkAnalytics(link)
    );
    const dashboardData = createDashboardData(
      stats,
      paymentLinks,
      linkAnalytics
    );

    return {
      stats,
      linkAnalytics,
      dashboardData,
    };
  }, [analyticsData, paymentLinks, address]);

  return {
    ...analytics,
    isLoading: linksLoading || analyticsLoading || analyticsRefetching,
    error: linksError || analyticsError,
    refresh: () => {
      refetchAnalytics();
      // This will be handled by the payment links query invalidation
    },
  };
}

/**
 * Calculate comprehensive creator statistics from real GraphQL data
 */
function calculateCreatorStats(
  analyticsData: CreatorAnalyticsData | undefined,
  links: PaymentLink[],
  creator: Address
): CreatorStats {
  const _now = new Date();
  const activeLinks = links.filter(
    (link) =>
      link.isActive && !link.isExpired && (!link.isUsed || link.usageType !== 0) // ONE_TIME = 0
  );

  // Calculate earnings by token from real data
  const totalEarnings: Record<Address, bigint> = {};
  const formattedTotalEarnings: Record<Address, string> = {};

  if (analyticsData) {
    const { payments, donations, productPurchases, contentPurchases } =
      analyticsData;

    // Process all transaction types
    [
      ...payments,
      ...donations,
      ...productPurchases,
      ...contentPurchases,
    ].forEach((tx) => {
      const tokenAddress = tx.token as Address;
      const amount = BigInt(tx.amount);

      if (!totalEarnings[tokenAddress]) {
        totalEarnings[tokenAddress] = BigInt(0);
      }

      totalEarnings[tokenAddress] += amount;

      const token = SUPPORTED_TOKENS_ARRAY.find(
        (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
      );
      if (token) {
        formattedTotalEarnings[tokenAddress] = formatUnits(
          totalEarnings[tokenAddress],
          token.decimals
        );
      }
    });
  }

  // Calculate links by type
  const linksByType: Record<LinkType, number> = {
    [LinkType.PAYMENT]: 0,
    [LinkType.DONATION]: 0,
    [LinkType.PRODUCT]: 0,
    [LinkType.CONTENT]: 0,
  };

  links.forEach((link) => {
    linksByType[link.linkType]++;
  });

  // Calculate monthly earnings from real transaction data
  const monthlyEarnings = calculateMonthlyEarnings(analyticsData);

  // Calculate real metrics from analytics data
  const totalPayments = analyticsData
    ? analyticsData.payments.length +
      analyticsData.donations.length +
      analyticsData.productPurchases.length +
      analyticsData.contentPurchases.length
    : 0;
  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
  const totalViews = links.reduce((sum, link) => sum + (link.views || 0), 0);

  // Calculate average order value per token
  const averageOrderValue: Record<Address, bigint> = {};
  Object.entries(totalEarnings).forEach(([tokenAddress, totalAmount]) => {
    averageOrderValue[tokenAddress as Address] =
      totalPayments > 0 ? totalAmount / BigInt(totalPayments) : BigInt(0);
  });

  // Calculate total volume in USD
  let totalVolumeUSD = 0;
  Object.entries(totalEarnings).forEach(([tokenAddress, amount]) => {
    const token = SUPPORTED_TOKENS_ARRAY.find(
      (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    if (token) {
      const formattedAmount = formatUnits(amount, token.decimals);
      const usdValue = calculateUSDValue(formattedAmount, token.symbol);
      totalVolumeUSD += usdValue;
    }
  });

  return {
    address: creator,
    totalLinks: links.length,
    activeLinks: activeLinks.length,
    totalEarnings,
    formattedTotalEarnings,
    totalVolumeUSD: totalVolumeUSD.toFixed(2),
    totalPayments,
    totalClicks,
    totalViews,
    conversionRate: totalClicks > 0 ? (totalPayments / totalClicks) * 100 : 0,
    topPerformingLink: links.length > 0 ? links[0] : undefined,
    recentPayments: [], // Would be populated from blockchain events
    monthlyEarnings,
    linksByType,
    averageOrderValue,
  };
}

/**
 * Calculate monthly earnings from transaction data
 */
function calculateMonthlyEarnings(
  analyticsData: CreatorAnalyticsData | undefined
): Record<string, Record<Address, bigint>> {
  const monthlyEarnings: Record<string, Record<Address, bigint>> = {};

  if (!analyticsData) return monthlyEarnings;

  const { payments, donations, productPurchases, contentPurchases } =
    analyticsData;
  const allTransactions = [
    ...payments,
    ...donations,
    ...productPurchases,
    ...contentPurchases,
  ];

  allTransactions.forEach((tx) => {
    const date = new Date(parseInt(tx.timestamp_) * 1000);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const tokenAddress = tx.token as Address;
    const amount = BigInt(tx.amount);

    if (!monthlyEarnings[monthKey]) {
      monthlyEarnings[monthKey] = {};
    }

    if (!monthlyEarnings[monthKey][tokenAddress]) {
      monthlyEarnings[monthKey][tokenAddress] = BigInt(0);
    }

    monthlyEarnings[monthKey][tokenAddress] += amount;
  });

  return monthlyEarnings;
}

/**
 * Calculate analytics for a specific link
 */
function calculateLinkAnalytics(link: PaymentLink): LinkAnalytics {
  // Simulate analytics data based on link properties
  const views = Math.floor(Math.random() * 100 + 10);
  const clicks = Math.floor(Math.random() * 50 + 5);
  const payments = Math.floor(Math.random() * 10 + 1);

  // Find the token to get correct decimals
  const token = SUPPORTED_TOKENS_ARRAY.find(
    (t) => t.address.toLowerCase() === link.token.toLowerCase()
  );
  const decimals = token?.decimals || 18;
  const tokenSymbol = token?.symbol || "UNKNOWN";

  // Calculate total amount using correct decimals
  const totalAmount =
    BigInt(parseFloat(link.amount) * Math.pow(10, decimals)) * BigInt(payments);
  const averageAmount =
    payments > 0 ? totalAmount / BigInt(payments) : BigInt(0);

  // Format amounts in token units
  const formattedTotalAmount = formatTokenAmount(
    totalAmount.toString(),
    link.token
  );
  const formattedAverageAmount =
    payments > 0
      ? formatTokenAmount(averageAmount.toString(), link.token)
      : "0";

  // Calculate USD values
  const totalAmountUSD = calculateUSDValue(formattedTotalAmount, tokenSymbol);
  const averageAmountUSD =
    payments > 0 ? calculateUSDValue(formattedAverageAmount, tokenSymbol) : 0;

  return {
    title: link.title,
    linkId: link.id,
    views,
    clicks,
    payments,
    conversionRate: clicks > 0 ? (payments / clicks) * 100 : 0,
    totalAmount,
    averageAmount,
    formattedTotalAmount: `${parseFloat(formattedTotalAmount).toFixed(
      4
    )} ${tokenSymbol}`,
    formattedAverageAmount: `${parseFloat(formattedAverageAmount).toFixed(
      4
    )} ${tokenSymbol}`,
    formattedTotalAmountUSD: totalAmountUSD.toFixed(2),
    formattedAverageAmountUSD: averageAmountUSD.toFixed(2),
    topPaymentAmount: totalAmount,
    recentPayments: [], // Would be populated from blockchain events
    paymentsByToken: { [link.token]: totalAmount },
    geographicData: {
      "United States": Math.floor(Math.random() * 50 + 10),
      "United Kingdom": Math.floor(Math.random() * 30 + 5),
      Germany: Math.floor(Math.random() * 20 + 3),
      Canada: Math.floor(Math.random() * 15 + 2),
    },
    deviceData: {
      mobile: Math.floor(Math.random() * 60 + 20),
      desktop: Math.floor(Math.random() * 40 + 15),
      tablet: Math.floor(Math.random() * 10 + 2),
    },
  };
}

/**
 * Create comprehensive dashboard data
 */
function createDashboardData(
  stats: CreatorStats,
  links: PaymentLink[],
  analytics: LinkAnalytics[]
): DashboardData {
  return {
    stats,
    links,
    analytics,
    tokens: SUPPORTED_TOKENS_ARRAY.map((token) => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      isNative: false,
      logoUrl: `/tokens/${token.symbol.toLowerCase()}.svg`,
      priceUSD:
        token.symbol === "USDC" || token.symbol === "USDT" ? 1 : 0.000065, // Mock prices
    })),
    recentActivity: [], // Would be populated from blockchain events
    pendingWithdrawals: {}, // Would be calculated from contract state
  };
}

/**
 * Get empty stats for when no data is available
 */
function getEmptyStats(address?: Address): CreatorStats {
  return {
    address:
      address || ("0x0000000000000000000000000000000000000000" as Address),
    totalLinks: 0,
    activeLinks: 0,
    totalEarnings: {},
    formattedTotalEarnings: {},
    totalVolumeUSD: "0.00",
    totalPayments: 0,
    totalClicks: 0,
    totalViews: 0,
    conversionRate: 0,
    recentPayments: [],
    monthlyEarnings: {},
    linksByType: {
      [LinkType.PAYMENT]: 0,
      [LinkType.DONATION]: 0,
      [LinkType.PRODUCT]: 0,
      [LinkType.CONTENT]: 0,
    },
    averageOrderValue: {},
  };
}

/**
 * Get empty dashboard data
 */
function getEmptyDashboardData(address?: Address): DashboardData {
  return {
    stats: getEmptyStats(address),
    links: [],
    analytics: [],
    tokens: [],
    recentActivity: [],
    pendingWithdrawals: {},
  };
}

/**
 * Hook to get analytics for a specific time period
 */
export function useTimeRangeAnalytics(
  timeRange: "7d" | "30d" | "90d" | "1y" = "30d"
) {
  const { stats, linkAnalytics } = useAnalytics();

  return useMemo(() => {
    const now = new Date();
    const daysBack =
      timeRange === "7d"
        ? 7
        : timeRange === "30d"
        ? 30
        : timeRange === "90d"
        ? 90
        : 365;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Filter and aggregate data for the time range
    // This would typically filter based on actual transaction timestamps
    // For now, we'll return the full stats as demo data

    return {
      stats,
      linkAnalytics,
      timeRange,
      startDate,
      endDate: now,
    };
  }, [stats, linkAnalytics, timeRange]);
}

/**
 * Hook to get top performing links
 */
export function useTopPerformingLinks(limit: number = 5) {
  const { linkAnalytics } = useAnalytics();

  return useMemo(() => {
    return linkAnalytics
      .sort((a, b) => Number(b.totalAmount - a.totalAmount))
      .slice(0, limit);
  }, [linkAnalytics, limit]);
}

/**
 * Hook to get revenue trends
 */
export function useRevenueTrends(_timeRange: "7d" | "30d" | "90d" = "30d") {
  const { stats } = useAnalytics();

  return useMemo(() => {
    const trends = Object.entries(stats.monthlyEarnings)
      .map(([month, earnings]) => {
        const totalUSD = Object.entries(earnings).reduce(
          (sum, [tokenAddress, amount]) => {
            const token = SUPPORTED_TOKENS_ARRAY.find(
              (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
            );
            if (!token) return sum;

            const formattedAmount = formatUnits(amount, token.decimals);
            const usdValue = calculateUSDValue(formattedAmount, token.symbol);
            return sum + usdValue;
          },
          0
        );

        return {
          month,
          revenue: totalUSD,
          formatted: totalUSD.toFixed(4),
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    return trends.slice(-6); // Last 6 months
  }, [stats.monthlyEarnings]);
}
