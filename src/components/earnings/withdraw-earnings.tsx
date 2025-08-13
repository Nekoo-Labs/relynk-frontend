"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useProfileRegistry } from "@/hooks/use-profile-registry";
import { getTokenConfig } from "@/lib/contracts";
import { normalizeNumberForParseUnits } from "@/lib/utils";
import { formatUnits, parseUnits } from "viem";
import { Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function WithdrawEarnings() {
  const { address } = useAccount();
  const chainId = useChainId();
  const {
    useGetProfileByOwner,
    useGetCreatorEarnings,
    useGetProfileFeeConfig,
    withdrawEarnings,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  } = useProfileRegistry();

  // Get chain-specific token configuration
  const SUPPORTED_TOKENS = getTokenConfig(chainId);
  const [selectedToken, setSelectedToken] =
    useState<keyof typeof SUPPORTED_TOKENS>("USDC");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Get profile to get username
  const { data: profileResult } = useGetProfileByOwner(
    address || "0x0000000000000000000000000000000000000000"
  );
  const [_profile, username] = (profileResult as
    | [unknown, string]
    | undefined) || [null, ""];

  // Get earnings for selected token
  const earnings = useGetCreatorEarnings(
    address || "0x0000000000000000000000000000000000000000",
    SUPPORTED_TOKENS[selectedToken].address
  );

  // Get fee configuration
  const feeConfig = useGetProfileFeeConfig(username || "");
  const { refetch: refetchFeeConfig } = feeConfig;

  // Calculate available amount
  const getAvailableAmount = () => {
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

  const availableAmount = getAvailableAmount();
  const tokenInfo = SUPPORTED_TOKENS[selectedToken];

  // Calculate withdrawal preview
  const calculateWithdrawPreview = () => {
    const configData = feeConfig.data as
      | { useCustomFees?: boolean; platformFeePercent?: bigint }
      | undefined;
    if (!withdrawAmount || !configData) return null;

    try {
      const amount = parseUnits(normalizeNumberForParseUnits(withdrawAmount), tokenInfo.decimals);
      const feePercent = configData.useCustomFees
        ? configData.platformFeePercent || BigInt(250)
        : BigInt(250); // Default 2.5%

      const platformFee = (amount * feePercent) / BigInt(10000);
      const netAmount = amount - platformFee;

      return {
        grossAmount: amount,
        platformFee,
        netAmount,
        feePercent: Number(feePercent) / 100, // Convert to percentage
      };
    } catch {
      return null;
    }
  };

  const withdrawPreview = calculateWithdrawPreview();

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawPreview) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (withdrawPreview.grossAmount > availableAmount) {
      toast.error("Insufficient earnings available");
      return;
    }

    try {
      withdrawEarnings(
        SUPPORTED_TOKENS[selectedToken].address,
        withdrawPreview.grossAmount
      );

      toast.success("Withdrawal initiated! Please confirm the transaction.");
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to initiate withdrawal");
    }
  };

  const handleMaxClick = () => {
    const maxAmount = formatUnits(availableAmount, tokenInfo.decimals);
    setWithdrawAmount(maxAmount);
  };

  // Don't show anything if no address
  if (!address) {
    return null;
  }

  // Render loading state
  if (earnings.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Withdraw Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render no profile message
  if (!username) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Withdraw Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-foreground/60">
            <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No profile found.</p>
            <p className="text-sm">
              Create a profile first to withdraw earnings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Withdraw Earnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Selection */}
        <div className="space-y-2">
          <Label>Select Token</Label>
          <div className="flex gap-2">
            {Object.entries(SUPPORTED_TOKENS).map(([key, token]) => (
              <Button
                key={key}
                variant={selectedToken === key ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSelectedToken(key as keyof typeof SUPPORTED_TOKENS)
                }
                className="flex items-center gap-2"
              >
                {token.symbol}
              </Button>
            ))}
          </div>
        </div>

        {/* Available Balance */}
        <div className="p-4 bg-secondary/20 rounded-base border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/80">
              Available Balance:
            </span>
            <span className="font-bold text-foreground">
              {formatUnits(availableAmount, tokenInfo.decimals)}{" "}
              {tokenInfo.symbol}
            </span>
          </div>
          {availableAmount === BigInt(0) && (
            <div className="mt-2 text-xs text-foreground/60">
              💡 No earnings available yet. Make sure:
              <ul className="mt-1 ml-4 list-disc">
                <li>You have received payments to your payment links</li>
                <li>You&apos;re connected to the correct network</li>
                <li>You have a profile created</li>
              </ul>
            </div>
          )}
        </div>

        {/* Withdrawal Amount */}
        <div className="space-y-2">
          <Label>Withdrawal Amount</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="flex-1"
              disabled={isPending || isConfirming}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleMaxClick}
              disabled={availableAmount === BigInt(0)}
            >
              Max
            </Button>
          </div>
        </div>

        {/* Withdrawal Preview */}
        {withdrawPreview && (
          <div className="p-4 bg-blue-50 rounded-base border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              Your Withdrawal Preview
            </h4>
            <p className="text-xs text-blue-700 mb-3">
              Based on your personal fee settings:
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Gross Amount:</span>
                <span className="font-medium">
                  {formatUnits(withdrawPreview.grossAmount, tokenInfo.decimals)}{" "}
                  {tokenInfo.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">
                  Your Platform Fee ({withdrawPreview.feePercent}%):
                </span>
                <span className="font-medium text-red-600">
                  -
                  {formatUnits(withdrawPreview.platformFee, tokenInfo.decimals)}{" "}
                  {tokenInfo.symbol}
                </span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-1">
                <span className="text-blue-900 font-semibold">
                  You Receive:
                </span>
                <span className="font-bold text-green-600">
                  {formatUnits(withdrawPreview.netAmount, tokenInfo.decimals)}{" "}
                  {tokenInfo.symbol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={
            !withdrawAmount ||
            !withdrawPreview ||
            withdrawPreview.grossAmount > availableAmount ||
            isPending ||
            isConfirming ||
            availableAmount === BigInt(0)
          }
          className="w-full"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isPending ? "Confirming..." : "Processing..."}
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Withdraw {tokenInfo.symbol}
            </>
          )}
        </Button>

        {/* Transaction Status */}
        {isSuccess && hash && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-base border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Withdrawal successful!
              <a
                href={`https://sepolia-blockscout.lisk.com/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 underline hover:no-underline"
              >
                View transaction
              </a>
            </span>
          </div>
        )}

        {/* No Earnings Warning */}
        {availableAmount === BigInt(0) && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-base border border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              No {tokenInfo.symbol} earnings available for withdrawal.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
