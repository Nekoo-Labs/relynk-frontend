import { useMemo } from "react";
import { useAccount } from "wagmi";
import { usePaymentLinks } from "./use-payment-links";
import {
  PaymentLink,
  CreatorStats,
  LinkAnalytics,
  LinkType,
  DashboardData,
} from "@/types/relynk";
import { Address } from "viem";

/**
 * Hook to calculate comprehensive analytics from payment links data
 */
export function useAnalytics() {
  const { address } = useAccount();
  const {
    data: paymentLinks = [],
    isLoading,
    error,
  } = usePaymentLinks(address);

  const analytics = useMemo(() => {
    if (!paymentLinks.length || !address) {
      return {
        stats: getEmptyStats(address),
        linkAnalytics: [],
        dashboardData: getEmptyDashboardData(address),
      };
    }

    const stats = calculateCreatorStats(paymentLinks, address);
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
  }, [paymentLinks, address]);

  return {
    ...analytics,
    isLoading,
    error,
    refresh: () => {
      // This will be handled by the payment links query invalidation
    },
  };
}

/**
 * Calculate comprehensive creator statistics
 */
function calculateCreatorStats(
  links: PaymentLink[],
  creator: Address
): CreatorStats {
  const now = new Date();
  const activeLinks = links.filter(
    (link) =>
      link.isActive && !link.isExpired && (!link.isUsed || link.usageType !== 0) // ONE_TIME = 0
  );

  // Calculate earnings by token
  const totalEarnings: Record<Address, bigint> = {};
  const formattedTotalEarnings: Record<Address, string> = {};

  // For demo purposes, simulate some earnings based on link data
  links.forEach((link) => {
    const tokenAddress = link.token;
    const amount = BigInt(parseFloat(link.amount) * Math.pow(10, 18)); // Assume 18 decimals

    if (!totalEarnings[tokenAddress]) {
      totalEarnings[tokenAddress] = BigInt(0);
    }

    // Simulate some earnings (10-50% of link amount)
    const simulatedEarnings =
      (amount * BigInt(Math.floor(Math.random() * 40 + 10))) / BigInt(100);
    totalEarnings[tokenAddress] += simulatedEarnings;

    formattedTotalEarnings[tokenAddress] = (
      Number(totalEarnings[tokenAddress]) / Math.pow(10, 18)
    ).toFixed(4);
  });

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

  // Calculate monthly earnings (last 6 months)
  const monthlyEarnings: Record<string, Record<Address, bigint>> = {};
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    monthlyEarnings[monthKey] = {};

    Object.keys(totalEarnings).forEach((token) => {
      const monthlyAmount = totalEarnings[token as Address] / BigInt(6); // Distribute evenly
      monthlyEarnings[monthKey][token as Address] = monthlyAmount;
    });
  }

  // Simulate some metrics
  const totalPayments = Math.floor(Math.random() * 50 + 10);
  const totalClicks = Math.floor(Math.random() * 200 + 50);
  const totalViews = Math.floor(Math.random() * 500 + 100);

  return {
    address: creator,
    totalLinks: links.length,
    activeLinks: activeLinks.length,
    totalEarnings,
    formattedTotalEarnings,
    totalPayments,
    totalClicks,
    totalViews,
    conversionRate: totalClicks > 0 ? (totalPayments / totalClicks) * 100 : 0,
    topPerformingLink: links.length > 0 ? links[0] : undefined,
    recentPayments: [], // Would be populated from blockchain events
    monthlyEarnings,
    linksByType,
    averageOrderValue: totalEarnings, // Simplified calculation
  };
}

/**
 * Calculate analytics for a specific link
 */
function calculateLinkAnalytics(link: PaymentLink): LinkAnalytics {
  // Simulate analytics data based on link properties
  const views = Math.floor(Math.random() * 100 + 10);
  const clicks = Math.floor(Math.random() * 50 + 5);
  const payments = Math.floor(Math.random() * 10 + 1);
  const totalAmount =
    BigInt(parseFloat(link.amount) * Math.pow(10, 18)) * BigInt(payments);

  return {
    title: link.title,
    linkId: link.id,
    views,
    clicks,
    payments,
    conversionRate: clicks > 0 ? (payments / clicks) * 100 : 0,
    totalAmount,
    averageAmount: payments > 0 ? totalAmount / BigInt(payments) : BigInt(0),
    formattedTotalAmount: (Number(totalAmount) / Math.pow(10, 18)).toFixed(4),
    formattedAverageAmount:
      payments > 0
        ? (Number(totalAmount / BigInt(payments)) / Math.pow(10, 18)).toFixed(4)
        : "0",
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
    tokens: [
      {
        address: "0x0000000000000000000000000000000000000000" as Address,
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
        isNative: true,
        logoUrl: "/tokens/eth.svg",
        priceUSD: 2000,
      },
      {
        address: "0xA0b86a33E6441c8C0E6C8C8C8C8C8C8C8C8C8C8C" as Address,
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        isNative: false,
        logoUrl: "/tokens/usdc.svg",
        priceUSD: 1,
      },
    ],
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
export function useRevenueTrends() {
  const { stats } = useAnalytics();

  return useMemo(() => {
    const trends = Object.entries(stats.monthlyEarnings)
      .map(([month, earnings]) => {
        const totalForMonth = Object.values(earnings).reduce(
          (sum, amount) => sum + Number(amount) / Math.pow(10, 18),
          0
        );

        return {
          month,
          revenue: totalForMonth,
          formatted: totalForMonth.toFixed(4),
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    return trends;
  }, [stats.monthlyEarnings]);
}
