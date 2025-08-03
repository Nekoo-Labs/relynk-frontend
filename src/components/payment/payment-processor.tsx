"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatEther, parseEther, parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRelynkProcessor } from "@/hooks/use-relynk-processor";
import { useProfileRegistry } from "@/hooks/use-profile-registry";
import { useTokenApproval } from "@/hooks/use-token-approval";
import {
  PaymentLink,
  LinkType,
  AmountType,
  UsageType,
  PaymentRequest,
} from "@/types/relynk";
import { SUPPORTED_TOKENS } from "@/lib/contracts";
import { toast } from "sonner";
import {
  Loader2,
  CreditCard,
  Heart,
  ShoppingBag,
  FileText,
  ExternalLink,
  CheckCircle,
  WalletCards,
} from "lucide-react";
import ConnectWallet from "../ui/connect-wallet";

interface PaymentProcessorProps {
  paymentLink: PaymentLink;
  onSuccess?: (transactionHash: string) => void;
  onError?: (error: string) => void;
}

export function PaymentProcessor({
  paymentLink,
  onSuccess,
  onError,
}: PaymentProcessorProps) {
  const { address, isConnected } = useAccount();
  const {
    processPayment,
    processDonation,
    purchaseProduct,
    purchaseContent,
    useIsLinkUsed,
    isProcessing,
    isSuccess,
    hash,
  } = useRelynkProcessor();

  const { useGetProfile } = useProfileRegistry();

  const {
    useTokenAllowance,
    needsApproval,
    approveToken,
    approveMax,
    isApproving,
    isSuccess: approvalSuccess,
  } = useTokenApproval();

  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [needsTokenApproval, setNeedsTokenApproval] = useState(false);

  // Get creator profile
  const { data: creatorProfile } = useGetProfile(paymentLink.creator);

  // Check if link is already used (for single-use links)
  const { data: isLinkUsed } = useIsLinkUsed(paymentLink.id);

  // Get user's token balance
  const { data: balance } = useBalance({
    address,
    token:
      paymentLink.token === "0x0000000000000000000000000000000000000000"
        ? undefined
        : paymentLink.token,
  });

  // Get current token allowance
  const { data: currentAllowance } = useTokenAllowance(paymentLink.token);

  useEffect(() => {
    if (isSuccess && hash) {
      setIsCompleted(true);
      onSuccess?.(hash);
      toast.success("Payment completed successfully!");
    }
  }, [isSuccess, hash, onSuccess]);

  // Check if approval is needed when amount or allowance changes
  useEffect(() => {
    if (currentAllowance !== undefined && address) {
      const amountToCharge = getAmountToCharge();
      setNeedsTokenApproval(needsApproval(currentAllowance, amountToCharge));
    }
  }, [currentAllowance, customAmount, paymentLink.amount, address]);

  // Handle successful approval
  useEffect(() => {
    if (approvalSuccess) {
      setNeedsTokenApproval(false);
      toast.success(
        "Token approval successful! You can now proceed with payment."
      );
    }
  }, [approvalSuccess]);

  const getIcon = () => {
    switch (paymentLink.linkType) {
      case LinkType.PAYMENT:
        return <CreditCard className="h-6 w-6" />;
      case LinkType.DONATION:
        return <Heart className="h-6 w-6" />;
      case LinkType.PRODUCT:
        return <ShoppingBag className="h-6 w-6" />;
      case LinkType.CONTENT:
        return <FileText className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const getTypeLabel = () => {
    switch (paymentLink.linkType) {
      case LinkType.PAYMENT:
        return "Payment";
      case LinkType.DONATION:
        return "Donation";
      case LinkType.PRODUCT:
        return "Product Purchase";
      case LinkType.CONTENT:
        return "Content Access";
      default:
        return "Payment";
    }
  };

  // Get token decimals for proper amount parsing
  const getTokenDecimals = (tokenSymbol: string): number => {
    const token = Object.values(SUPPORTED_TOKENS).find(
      (t) => t.symbol === tokenSymbol
    );
    return token?.decimals || 18; // Default to 18 decimals if not found
  };

  const getAmountToCharge = () => {
    const decimals = getTokenDecimals(paymentLink.tokenSymbol);
    if (paymentLink.amountType === AmountType.DYNAMIC && customAmount) {
      return parseUnits(customAmount, decimals);
    }
    return parseUnits(paymentLink.amount, decimals);
  };

  const handleApproval = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    const amountToCharge = getAmountToCharge();
    const result = await approveMax(paymentLink.token);

    if (!result.success) {
      toast.error(result.error || "Token approval failed");
    }
  };

  const handlePayment = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!address) {
      toast.error("Wallet address not found");
      return;
    }

    // Validate custom amount for dynamic types
    if (paymentLink.amountType === AmountType.DYNAMIC) {
      if (!customAmount || parseFloat(customAmount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
    }

    // Check if user has sufficient balance
    const amountToCharge = getAmountToCharge();
    if (balance && balance.value < amountToCharge) {
      toast.error(`Insufficient ${paymentLink.tokenSymbol} balance`);
      return;
    }

    // Check if approval is still needed
    if (needsTokenApproval) {
      toast.error("Please approve token spending first");
      return;
    }

    try {
      // Create payment request
      const decimals = getTokenDecimals(paymentLink.tokenSymbol);
      const paymentRequest: PaymentRequest = {
        linkData: paymentLink.originalLinkData, // Use the exact linkData that was signed
        signature: paymentLink.signature, // Use the stored signature from link creation
        message: message,
        customAmount:
          paymentLink.amountType !== AmountType.FIXED
            ? amountToCharge
            : undefined,
      };

      // Process payment based on link type
      let result;
      switch (paymentLink.linkType) {
        case LinkType.PAYMENT:
          result = await processPayment(paymentRequest);
          break;
        case LinkType.DONATION:
          result = await processDonation(paymentRequest);
          break;
        case LinkType.PRODUCT:
          result = await purchaseProduct(paymentRequest);
          break;
        case LinkType.CONTENT:
          result = await purchaseContent(paymentRequest);
          break;
        default:
          result = await processPayment(paymentRequest);
      }

      if (!result.success) {
        onError?.(result.error || "Payment failed");
        toast.error(result.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Check if link is expired
  const isExpired = paymentLink.expires.getTime() < Date.now();

  // Check if link is already used (for single-use links)
  const isUsed =
    Boolean(isLinkUsed) && paymentLink.usageType === UsageType.ONE_TIME;

  if (isCompleted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">Payment Successful!</h3>
            <p className="text-muted-foreground">
              {paymentLink.metadata.linkType === 0 &&
              "successMessage" in paymentLink.metadata
                ? paymentLink.metadata.successMessage ||
                  "Your payment has been processed successfully."
                : "Your payment has been processed successfully."}
            </p>
            {paymentLink.metadata.linkType === 0 &&
              "redirectUrl" in paymentLink.metadata &&
              paymentLink.metadata.redirectUrl && (
                <Button asChild className="w-full">
                  <a
                    href={paymentLink.metadata.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Continue <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isExpired) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">
              <CreditCard className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Link Expired</h3>
              <p>This payment link has expired and is no longer valid.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isUsed) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">
              <CheckCircle className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Link Already Used</h3>
              <p>
                This payment link has already been used and cannot be used
                again.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">{getIcon()}</div>
        <CardTitle>{paymentLink.title}</CardTitle>
        <CardDescription>{paymentLink.description}</CardDescription>
        <Badge variant="secondary" className="w-fit mx-auto">
          {getTypeLabel()}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Creator Info */}
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>
              {paymentLink.creator.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {`${paymentLink.creator.slice(
                0,
                6
              )}...${paymentLink.creator.slice(-4)}`}
            </p>
            <p className="text-sm text-muted-foreground">Creator</p>
          </div>
        </div>

        <Separator />

        {/* Amount Section */}
        <div className="space-y-4">
          {paymentLink.amountType === AmountType.FIXED ? (
            <div className="text-center">
              <p className="text-2xl font-bold">
                {paymentLink.amount} {paymentLink.tokenSymbol}
              </p>
              <p className="text-sm text-muted-foreground">Fixed amount</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="amount">
                {paymentLink.amountType === AmountType.DYNAMIC
                  ? `Amount (${paymentLink.tokenSymbol})`
                  : `Amount (${paymentLink.tokenSymbol})`}
              </Label>
              <div className="flex">
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder={
                    paymentLink.amountType === AmountType.DYNAMIC
                      ? "0.00"
                      : paymentLink.amount
                  }
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="rounded-r-none focus:ring-1! focus:ring-offset-0!"
                />
                <div className="flex items-center px-3 border border-border border-l-0 rounded-r-md bg-muted">
                  <span className="text-sm font-medium">
                    {paymentLink.tokenSymbol}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Message for donations */}
          {paymentLink.linkType === LinkType.DONATION && (
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Leave a message with your donation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Balance Info */}
        {balance && (
          <div className="text-sm text-muted-foreground text-center">
            Your balance:{" "}
            {formatUnits(
              balance.value,
              getTokenDecimals(paymentLink.tokenSymbol)
            )}{" "}
            {paymentLink.tokenSymbol}
          </div>
        )}

        {/* Approval/Payment Button */}
        <div className="flex items-center gap-2">
          {needsTokenApproval ? (
            <Button
              onClick={handleApproval}
              disabled={isApproving || !isConnected || isExpired || isUsed}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve {paymentLink.tokenSymbol}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !isConnected || isExpired || isUsed}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {getIcon()}
                  <span className="ml-2">
                    {paymentLink.linkType === LinkType.DONATION
                      ? "Donate"
                      : "Pay"}
                    {paymentLink.amountType === AmountType.FIXED &&
                      ` ${paymentLink.amount} ${paymentLink.tokenSymbol}`}
                  </span>
                </>
              )}
            </Button>
          )}
          {!isConnected && (
            <ConnectWallet size="icon" variant="secondary">
              <WalletCards />
            </ConnectWallet>
          )}
        </div>
        {!isConnected && (
          <p className="text-sm text-center text-muted-foreground">
            Please connect your wallet to continue
          </p>
        )}

        {needsTokenApproval && isConnected && (
          <p className="text-sm text-center text-muted-foreground">
            You need to approve {paymentLink.tokenSymbol} spending before making
            the payment
          </p>
        )}

        {/* Expiry Info */}
        <div className="text-xs text-center text-muted-foreground">
          Expires: {paymentLink.expires.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
