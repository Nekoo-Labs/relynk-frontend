"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUPPORTED_TOKENS } from "@/lib/contracts";
import { formatUnits } from "viem";
import { History, ExternalLink, Calendar, DollarSign } from "lucide-react";

// Mock data for withdrawal history - In production, this would come from The Graph or event logs
const mockWithdrawHistory = [
  {
    id: "1",
    token: "USDC",
    amount: "500000000", // 500 USDC (6 decimals)
    platformFee: "12500000", // 12.5 USDC (2.5% fee)
    netAmount: "487500000", // 487.5 USDC
    timestamp: new Date("2024-01-15T10:30:00Z"),
    txHash: "0x1234567890abcdef1234567890abcdef12345678",
    status: "completed",
  },
  {
    id: "2",
    token: "USDT",
    amount: "250000000", // 250 USDT (6 decimals)
    platformFee: "6250000", // 6.25 USDT (2.5% fee)
    netAmount: "243750000", // 243.75 USDT
    timestamp: new Date("2024-01-10T14:20:00Z"),
    txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
    status: "completed",
  },
  {
    id: "3",
    token: "IDRX",
    amount: "10000000", // 100,000 IDRX (2 decimals)
    platformFee: "250000", // 2,500 IDRX (2.5% fee)
    netAmount: "9750000", // 97,500 IDRX
    timestamp: new Date("2024-01-05T09:15:00Z"),
    txHash: "0x567890abcdef1234567890abcdef1234567890ab",
    status: "completed",
  },
];

export function WithdrawHistory() {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getTokenInfo = (symbol: string) => {
    return Object.values(SUPPORTED_TOKENS).find(
      (token) => token.symbol === symbol
    );
  };

  const formatTokenAmount = (amount: string, symbol: string) => {
    const tokenInfo = getTokenInfo(symbol);
    if (!tokenInfo) return `${amount} ${symbol}`;

    const formatted = formatUnits(BigInt(amount), tokenInfo.decimals);
    return `${parseFloat(formatted).toFixed(2)} ${symbol}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Withdrawal History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mockWithdrawHistory.length === 0 ? (
          <div className="text-center py-8 text-foreground/60">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No withdrawal history yet.</p>
            <p className="text-sm">
              Your withdrawals will appear here once you make them.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mockWithdrawHistory.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="p-4 border border-border rounded-base hover:bg-secondary/20 transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-y-2 items-center justify-between mb-3">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-foreground">
                        {formatTokenAmount(
                          withdrawal.netAmount,
                          withdrawal.token
                        )}
                      </span>
                    </div>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground/60">
                    <Calendar className="h-4 w-4" />
                    {formatDate(withdrawal.timestamp)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-foreground/60">Gross Amount:</span>
                    <p className="font-medium">
                      {formatTokenAmount(withdrawal.amount, withdrawal.token)}
                    </p>
                  </div>
                  <div>
                    <span className="text-foreground/60">Platform Fee:</span>
                    <p className="font-medium text-red-600">
                      -
                      {formatTokenAmount(
                        withdrawal.platformFee,
                        withdrawal.token
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-y-4 items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="text-sm flex flex-col sm:flex-row items-center gap-2">
                    <span className="text-foreground/60">Transaction:</span>
                    <code className="ml-2 text-xs bg-secondary/50 px-2 py-1 rounded">
                      {withdrawal.txHash.substring(0, 10)}...
                      {withdrawal.txHash.substring(
                        withdrawal.txHash.length - 8
                      )}
                    </code>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://sepolia-blockscout.lisk.com/tx/${withdrawal.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button (for future pagination) */}
        {mockWithdrawHistory.length > 0 && (
          <div className="text-center pt-4">
            <Button variant="outline" size="sm" disabled>
              Load More History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
