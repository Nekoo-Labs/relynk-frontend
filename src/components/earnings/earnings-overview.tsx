"use client";

import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfileRegistry } from "@/hooks/use-profile-registry";
import { SUPPORTED_TOKENS } from "@/lib/contracts";
import { formatUnits } from "viem";
import { DollarSign, Wallet, AlertCircle } from "lucide-react";

export function EarningsOverview() {
  const { address } = useAccount();
  const { useGetCreatorEarnings } = useProfileRegistry();

  // Get earnings for each supported token (only if address exists)
  const usdcEarnings = useGetCreatorEarnings(
    (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    SUPPORTED_TOKENS.USDC.address
  );
  const usdtEarnings = useGetCreatorEarnings(
    (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    SUPPORTED_TOKENS.USDT.address
  );
  const idrxEarnings = useGetCreatorEarnings(
    (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    SUPPORTED_TOKENS.IDRX.address
  );

  // Calculate available amounts
  const getAvailableAmount = (earnings: {
    data?: unknown;
  }) => {
    if (!earnings.data) {
      return BigInt(0);
    }

    try {
      const data = earnings.data as any;
      let totalEarned: bigint;
      let totalWithdrawn: bigint;

      // Handle both array format [totalEarned, totalWithdrawn, available] and object format
      if (Array.isArray(data)) {
        totalEarned = BigInt(data[0] || 0);
        totalWithdrawn = BigInt(data[1] || 0);
      } else {
        totalEarned = BigInt(data.totalEarned || 0);
        totalWithdrawn = BigInt(data.totalWithdrawn || 0);
      }

      return totalEarned - totalWithdrawn;
    } catch (error) {
      console.error("Error calculating available amount:", error);
      return BigInt(0);
    }
  };

  const usdcAvailable = getAvailableAmount(usdcEarnings);
  const usdtAvailable = getAvailableAmount(usdtEarnings);
  const idrxAvailable = getAvailableAmount(idrxEarnings);

  // Format amounts for display
  const formatTokenAmount = (amount: bigint, decimals: number, symbol: string) => {
    const formatted = formatUnits(amount, decimals);
    return `${parseFloat(formatted).toFixed(2)} ${symbol}`;
  };

  // Calculate total USD value (mock exchange rates)
  const calculateUSDValue = () => {
    const usdcValue = parseFloat(formatUnits(usdcAvailable, 6)) * 1.0; // 1 USDC = $1
    const usdtValue = parseFloat(formatUnits(usdtAvailable, 6)) * 1.0; // 1 USDT = $1
    const idrxValue = parseFloat(formatUnits(idrxAvailable, 2)) * 0.000065; // Mock rate
    return (usdcValue + usdtValue + idrxValue).toFixed(2);
  };

  const totalUSDValue = calculateUSDValue();
  const hasEarnings = usdcAvailable > 0 || usdtAvailable > 0 || idrxAvailable > 0;

  // Show loading state if any earnings data is still loading
  const isLoading = usdcEarnings.isLoading || usdtEarnings.isLoading || idrxEarnings.isLoading;

  // Don't show anything if no address
  if (!address) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total USD Value */}
      <Card className="hover:scale-105 transition-transform duration-300">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-foreground/80">
                Total Available
              </p>
              <p className="text-2xl font-bold text-foreground">
                ${totalUSDValue}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USDC Earnings */}
      <Card className="hover:scale-105 transition-transform duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-foreground/80">USDC</p>
                <p className="text-xl font-bold text-foreground">
                  {formatTokenAmount(usdcAvailable, 6, "USDC")}
                </p>
              </div>
            </div>
            {usdcAvailable > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Available
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* USDT Earnings */}
      <Card className="hover:scale-105 transition-transform duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-foreground/80">USDT</p>
                <p className="text-xl font-bold text-foreground">
                  {formatTokenAmount(usdtAvailable, 6, "USDT")}
                </p>
              </div>
            </div>
            {usdtAvailable > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Available
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* IDRX Earnings */}
      <Card className="hover:scale-105 transition-transform duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-foreground/80">IDRX</p>
                <p className="text-xl font-bold text-foreground">
                  {formatTokenAmount(idrxAvailable, 2, "IDRX")}
                </p>
              </div>
            </div>
            {idrxAvailable > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Available
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No Earnings Message */}
      {!hasEarnings && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2 text-foreground/60">
              <AlertCircle className="h-5 w-5" />
              <p>No earnings available yet. Start creating payment links to earn!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
