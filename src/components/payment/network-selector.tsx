"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Address } from "viem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTokenApproval } from "@/hooks/use-token-approval";
import { SUPPORTED_CHAINS, getTokenConfig } from "@/lib/contracts";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Network,
  ArrowRight,
} from "lucide-react";

interface NetworkSelectorProps {
  tokenAddress: Address;
  tokenSymbol: string;
  requiredAmount: bigint;
  onNetworkChange?: (chainId: number) => void;
  className?: string;
}

export function NetworkSelector({
  tokenAddress,
  tokenSymbol,
  requiredAmount,
  onNetworkChange,
  className,
}: NetworkSelectorProps) {
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [switchingToChain, setSwitchingToChain] = useState<number | null>(null);

  const {
    useTokenAllowance,
    needsApproval,
    approveMax,
    getApprovalState,
  } = useTokenApproval();

  const supportedChains = Object.values(SUPPORTED_CHAINS);

  // Get token configs for each chain
  const liskSepoliaTokens = getTokenConfig(4202);
  const scrollSepoliaTokens = getTokenConfig(534351);
  const morphHoleskyTokens = getTokenConfig(2810);
  const celoSepoliaTokens = getTokenConfig(11142220);
  const mantleSepoliaTokens = getTokenConfig(5003);

  const liskSepoliaTokenConfig = Object.values(liskSepoliaTokens).find(t => t.symbol === tokenSymbol);
  const scrollSepoliaTokenConfig = Object.values(scrollSepoliaTokens).find(t => t.symbol === tokenSymbol);
  const morphHoleskyTokenConfig = Object.values(morphHoleskyTokens).find(t => t.symbol === tokenSymbol);
  const celoSepoliaTokenConfig = Object.values(celoSepoliaTokens).find(t => t.symbol === tokenSymbol);
  const mantleSepoliaTokenConfig = Object.values(mantleSepoliaTokens).find(t => t.symbol === tokenSymbol);

  // Get allowances for each chain
  const { data: liskSepoliaAllowance } = useTokenAllowance(liskSepoliaTokenConfig?.address as Address, 4202);
  const { data: scrollSepoliaAllowance } = useTokenAllowance(scrollSepoliaTokenConfig?.address as Address, 534351);
  const { data: morphHoleskyAllowance } = useTokenAllowance(morphHoleskyTokenConfig?.address as Address, 2810);
  const { data: celoSepoliaAllowance } = useTokenAllowance(celoSepoliaTokenConfig?.address as Address, 11142220);
  const { data: mantleSepoliaAllowance } = useTokenAllowance(mantleSepoliaTokenConfig?.address as Address, 5003);

  // Get approval states for each chain
  const liskSepoliaApprovalState = getApprovalState(4202, liskSepoliaTokenConfig?.address);
  const scrollSepoliaApprovalState = getApprovalState(534351, scrollSepoliaTokenConfig?.address);
  const morphHoleskyApprovalState = getApprovalState(2810, morphHoleskyTokenConfig?.address);
  const celoSepoliaApprovalState = getApprovalState(11142220, celoSepoliaTokenConfig?.address);
  const mantleSepoliaApprovalState = getApprovalState(5003, mantleSepoliaTokenConfig?.address);

  // Create chain data lookup
  const chainDataMap = {
    4202: { allowance: liskSepoliaAllowance, approvalState: liskSepoliaApprovalState, tokenConfig: liskSepoliaTokenConfig },
    534351: { allowance: scrollSepoliaAllowance, approvalState: scrollSepoliaApprovalState, tokenConfig: scrollSepoliaTokenConfig },
    2810: { allowance: morphHoleskyAllowance, approvalState: morphHoleskyApprovalState, tokenConfig: morphHoleskyTokenConfig },
    11142220: { allowance: celoSepoliaAllowance, approvalState: celoSepoliaApprovalState, tokenConfig: celoSepoliaTokenConfig },
    5003: { allowance: mantleSepoliaAllowance, approvalState: mantleSepoliaApprovalState, tokenConfig: mantleSepoliaTokenConfig },
  };

  const handleNetworkSwitch = async (targetChainId: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (targetChainId === currentChainId) {
      return;
    }

    try {
      setSwitchingToChain(targetChainId);
      await switchChain({ chainId: targetChainId });
      onNetworkChange?.(targetChainId);
      const chainName = supportedChains.find(chain => chain.id === targetChainId)?.name || 'Unknown Network';
      toast.success(`Switched to ${chainName}`);
    } catch (error) {
      console.error("Network switch failed:", error);
      toast.error("Failed to switch network");
    } finally {
      setSwitchingToChain(null);
    }
  };

  const handleApproval = async (chainId: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Switch to the target chain first if needed
    if (chainId !== currentChainId) {
      await handleNetworkSwitch(chainId);
      return;
    }

    const result = await approveMax(tokenAddress, chainId);
    if (!result.success) {
      toast.error(result.error || "Token approval failed");
    }
  };

  const getNetworkStatus = (chainId: number, allowance?: bigint, approvalState?: any) => {
    const tokens = getTokenConfig(chainId);
    const tokenConfig = Object.values(tokens).find(
      (t) => t.symbol === tokenSymbol
    );

    if (!tokenConfig) {
      return {
        status: "unsupported" as const,
        message: `${tokenSymbol} not supported`,
        icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
      };
    }

    if (approvalState?.isApproving) {
      return {
        status: "approving" as const,
        message: "Approving...",
        icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
      };
    }

    if (approvalState?.error) {
      return {
        status: "error" as const,
        message: approvalState.error,
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      };
    }

    if (allowance !== undefined && !needsApproval(allowance, requiredAmount)) {
      return {
        status: "approved" as const,
        message: "Approved",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      };
    }

    return {
      status: "needs_approval" as const,
      message: "Needs approval",
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
    };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Network Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {supportedChains.map((chain, index) => {
          const isCurrentChain = chain.id === currentChainId;
          const isSwitchingToThis = switchingToChain === chain.id;

          // Get pre-computed data for this chain
          const data = chainDataMap[chain.id as keyof typeof chainDataMap];
          const networkStatus = getNetworkStatus(chain.id, data?.allowance, data?.approvalState);

          return (
            <div key={chain.id}>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{chain.name}</span>
                      {isCurrentChain && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {networkStatus.icon}
                      <span>{networkStatus.message}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isCurrentChain && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNetworkSwitch(chain.id)}
                      disabled={isSwitching || !isConnected}
                    >
                      {isSwitchingToThis ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Switching...
                        </>
                      ) : (
                        <>
                          Switch
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}

                  {isCurrentChain &&
                   networkStatus.status === "needs_approval" &&
                   data?.tokenConfig && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproval(chain.id)}
                      disabled={!isConnected}
                    >
                      Approve {tokenSymbol}
                    </Button>
                  )}

                  {isCurrentChain && networkStatus.status === "approved" && (
                    <Badge variant="default" className="bg-green-500">
                      Ready
                    </Badge>
                  )}

                  {isCurrentChain && networkStatus.status === "approving" && (
                    <Badge variant="secondary">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Approving...
                    </Badge>
                  )}
                </div>
              </div>

              {index < supportedChains.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          );
        })}

        {!isConnected && (
          <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
            Connect your wallet to see network options and approval states
          </div>
        )}
      </CardContent>
    </Card>
  );
}
