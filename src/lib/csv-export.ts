import { CreatorStats, PaymentLink, LinkAnalytics } from "@/types/relynk";
import { SUPPORTED_TOKENS } from "@/lib/contracts";

// Convert SUPPORTED_TOKENS object to array for easier iteration
const SUPPORTED_TOKENS_ARRAY = Object.values(SUPPORTED_TOKENS);

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(",");
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(",")
  );
  
  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Get link type label
 */
function getLinkTypeLabel(linkType: number): string {
  switch (linkType) {
    case 0: return "Payment";
    case 1: return "Donation";
    case 2: return "Product";
    case 3: return "Content";
    default: return "Unknown";
  }
}

/**
 * Get token symbol from address
 */
function getTokenSymbol(tokenAddress: string): string {
  const token = SUPPORTED_TOKENS_ARRAY.find(
    (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
  );
  return token?.symbol || "UNKNOWN";
}

/**
 * Export analytics overview data to CSV
 */
export function exportAnalyticsOverview(
  stats: CreatorStats,
  timeRange: string
): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `relynk-analytics-overview-${timeRange}-${timestamp}.csv`;
  
  // Prepare overview data
  const overviewData = [
    {
      metric: "Total Links",
      value: stats.totalLinks,
      description: "Total number of payment links created"
    },
    {
      metric: "Active Links",
      value: stats.activeLinks,
      description: "Currently active payment links"
    },
    {
      metric: "Total Clicks",
      value: stats.totalClicks,
      description: "Total clicks across all links"
    },
    {
      metric: "Total Views",
      value: stats.totalViews,
      description: "Total views across all links"
    },
    {
      metric: "Total Payments",
      value: stats.totalPayments,
      description: "Total successful payments received"
    },
    {
      metric: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(2)}%`,
      description: "Percentage of clicks that resulted in payments"
    },
    {
      metric: "Total Revenue (USD)",
      value: `$${stats.totalVolumeUSD}`,
      description: "Total revenue in USD across all tokens"
    }
  ];

  // Add links by type data
  Object.entries(stats.linksByType).forEach(([typeKey, count]) => {
    const typeNum = parseInt(typeKey);
    const typeLabel = getLinkTypeLabel(typeNum);
    overviewData.push({
      metric: `${typeLabel} Links`,
      value: count,
      description: `Number of ${typeLabel.toLowerCase()} links created`
    });
  });

  // Add earnings by token
  Object.entries(stats.formattedTotalEarnings).forEach(([tokenAddress, amount]) => {
    const symbol = getTokenSymbol(tokenAddress);
    overviewData.push({
      metric: `Total Earnings (${symbol})`,
      value: `${amount} ${symbol}`,
      description: `Total earnings in ${symbol} token`
    });
  });

  const headers = ["metric", "value", "description"];
  const csvContent = convertToCSV(overviewData, headers);
  downloadCSV(csvContent, filename);
}

/**
 * Export payment links data to CSV
 */
export function exportPaymentLinks(
  paymentLinks: PaymentLink[],
  linkAnalytics: LinkAnalytics[],
  timeRange: string
): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `relynk-payment-links-${timeRange}-${timestamp}.csv`;
  
  // Combine payment links with analytics data
  const linksData = paymentLinks.map((link, index) => {
    const analytics = linkAnalytics[index] || { payments: 0, revenue: 0 };
    const tokenSymbol = getTokenSymbol(link.token);
    const conversionRate = link.clicks && link.clicks > 0 ? 
      ((analytics.payments / link.clicks) * 100).toFixed(2) + '%' : '0%';
    
    return {
      linkId: link.id,
      title: link.title || 'Untitled',
      type: getLinkTypeLabel(link.linkType),
      amount: `${link.amount} ${tokenSymbol}`,
      token: tokenSymbol,
      status: link.isActive ? 'Active' : 'Inactive',
      clicks: link.clicks || 0,
      views: link.views || 0,
      payments: analytics.payments || 0,
      conversionRate: conversionRate,
      createdAt: link.createdAt.toISOString(),
      expiresAt: link.expires.toISOString(),
      description: link.description || '',
      category: link.metadata?.category || '',
      tags: link.metadata?.tags?.join(', ') || '',
      isExpired: link.isExpired ? 'Yes' : 'No'
    };
  });

  const headers = [
    "linkId", "title", "type", "amount", "token", "status",
    "clicks", "views", "payments", "conversionRate", "createdAt", 
    "expiresAt", "description", "category", "tags", "isExpired"
  ];
  
  const csvContent = convertToCSV(linksData, headers);
  downloadCSV(csvContent, filename);
}

/**
 * Export revenue trends data to CSV
 */
export function exportRevenueTrends(
  monthlyEarnings: Record<string, Record<string, bigint>>,
  timeRange: string
): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `relynk-revenue-trends-${timeRange}-${timestamp}.csv`;
  
  // Convert monthly earnings to CSV format
  const trendsData: any[] = [];
  
  Object.entries(monthlyEarnings).forEach(([month, tokenEarnings]) => {
    Object.entries(tokenEarnings).forEach(([tokenAddress, amount]) => {
      const token = SUPPORTED_TOKENS_ARRAY.find(
        (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
      );
      
      if (token) {
        const formattedAmount = parseFloat(
          (Number(amount) / Math.pow(10, token.decimals)).toFixed(6)
        );
        
        trendsData.push({
          month,
          token: token.symbol,
          tokenAddress,
          amount: formattedAmount,
          formattedAmount: `${formattedAmount} ${token.symbol}`
        });
      }
    });
  });

  // Sort by month
  trendsData.sort((a, b) => a.month.localeCompare(b.month));

  const headers = ["month", "token", "tokenAddress", "amount", "formattedAmount"];
  const csvContent = convertToCSV(trendsData, headers);
  downloadCSV(csvContent, filename);
}

/**
 * Export complete analytics data (all sheets in one file)
 */
export function exportCompleteAnalytics(
  stats: CreatorStats,
  paymentLinks: PaymentLink[],
  linkAnalytics: LinkAnalytics[],
  timeRange: string
): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `relynk-complete-analytics-${timeRange}-${timestamp}.csv`;
  
  let csvContent = "";
  
  // Section 1: Overview
  csvContent += "=== ANALYTICS OVERVIEW ===\n";
  csvContent += `Export Date,${new Date().toISOString()}\n`;
  csvContent += `Time Range,${timeRange}\n`;
  csvContent += `Creator Address,${stats.address}\n\n`;
  
  // Key metrics
  csvContent += "Metric,Value,Description\n";
  csvContent += `Total Links,${stats.totalLinks},Total number of payment links created\n`;
  csvContent += `Active Links,${stats.activeLinks},Currently active payment links\n`;
  csvContent += `Total Clicks,${stats.totalClicks},Total clicks across all links\n`;
  csvContent += `Total Views,${stats.totalViews},Total views across all links\n`;
  csvContent += `Total Payments,${stats.totalPayments},Total successful payments received\n`;
  csvContent += `Conversion Rate,${stats.conversionRate.toFixed(2)}%,Percentage of clicks that resulted in payments\n`;
  csvContent += `Total Revenue (USD),$${stats.totalVolumeUSD},Total revenue in USD across all tokens\n\n`;
  
  // Links by type
  csvContent += "=== LINKS BY TYPE ===\n";
  csvContent += "Link Type,Count\n";
  Object.entries(stats.linksByType).forEach(([typeKey, count]) => {
    const typeNum = parseInt(typeKey);
    const typeLabel = getLinkTypeLabel(typeNum);
    csvContent += `${typeLabel},${count}\n`;
  });
  csvContent += "\n";
  
  // Token earnings
  csvContent += "=== EARNINGS BY TOKEN ===\n";
  csvContent += "Token,Amount,Token Address\n";
  Object.entries(stats.formattedTotalEarnings).forEach(([tokenAddress, amount]) => {
    const symbol = getTokenSymbol(tokenAddress);
    csvContent += `${symbol},${amount},${tokenAddress}\n`;
  });
  csvContent += "\n";
  
  // Payment links details
  csvContent += "=== PAYMENT LINKS DETAILS ===\n";
  csvContent += "Link ID,Title,Type,Amount,Token,Active,Clicks,Views,Payments,Conversion Rate,Created At\n";
  paymentLinks.forEach((link, index) => {
    const analytics = linkAnalytics[index] || { payments: 0, revenue: 0 };
    const tokenSymbol = getTokenSymbol(link.token);
    const conversionRate = link.clicks && link.clicks > 0 ? 
      ((analytics.payments / link.clicks) * 100).toFixed(2) + '%' : '0%';
    
    csvContent += `${link.id},"${link.title || 'Untitled'}",${getLinkTypeLabel(link.linkType)},${link.amount} ${tokenSymbol},${tokenSymbol},${link.isActive ? 'Yes' : 'No'},${link.clicks || 0},${link.views || 0},${analytics.payments || 0},${conversionRate},${link.createdAt.toISOString()}\n`;
  });
  
  downloadCSV(csvContent, filename);
}