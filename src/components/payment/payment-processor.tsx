/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { Address } from "viem";
import { parseUnits, formatUnits } from "viem";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRelynkProcessor } from "@/hooks/use-relynk-processor";
import { useProfileRegistry } from "@/hooks/use-profile-registry";
import { useTokenApproval } from "@/hooks/use-token-approval";
import { NetworkSelector } from "./network-selector";
import {
  PaymentLink,
  LinkType,
  AmountType,
  UsageType,
  PaymentRequest,
} from "@/types/relynk";
import { getTokenConfig, getTransactionUrl } from "@/lib/contracts";
import { normalizeNumberForParseUnits } from "@/lib/utils";
import { toast } from "sonner";
import { invalidatePaymentRelatedCaches } from "@/services/api";
import { EmailService } from "@/lib/email-service";
import { JWTService } from "@/lib/jwt-service";
import { storeAccessRecord } from "@/app/api/v1/content/verify-access/route";
import {
  Loader2,
  CreditCard,
  Heart,
  ShoppingBag,
  FileText,
  ExternalLink,
  CheckCircle,
  WalletCards,
  AlertTriangle,
  Network,
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
  const chainId = useChainId();

  // Debug logging
  console.log("PaymentProcessor - Payment Link:", paymentLink);
  console.log("PaymentProcessor - Current Chain ID:", chainId);
  console.log("PaymentProcessor - Token Symbol:", paymentLink.tokenSymbol);
  console.log("PaymentProcessor - Token Address:", paymentLink.token);
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

  const { useGetProfileByOwner } = useProfileRegistry();

  const {
    useTokenAllowance,
    needsApproval,
    approveMax,
    getApprovalState,
    isApproving,
    isSuccess: approvalSuccess,
  } = useTokenApproval();

  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [needsTokenApproval, setNeedsTokenApproval] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "idle" | "approving" | "processing" | "confirming" | "completed"
  >("idle");

  // Get creator profile and username
  const { data: creatorProfileData } = useGetProfileByOwner(
    paymentLink.creator as Address
  ) as {
    data:
      | [
          {
            owner: Address;
            ipfsHash: string;
            createdAt: bigint;
            updatedAt: bigint;
          },
          string
        ]
      | undefined;
  };

  // Check if link is already used (for single-use links)
  const { data: isLinkUsed } = useIsLinkUsed(paymentLink.id);

  // Get the correct token address for the current chain
  const getCurrentChainTokenAddress = useCallback(() => {
    const supportedTokens = getTokenConfig(chainId);
    const token = Object.values(supportedTokens).find(
      (t) => t.symbol === paymentLink.tokenSymbol
    );
    return token?.address || paymentLink.token; // Fallback to original if not found
  }, [chainId, paymentLink.tokenSymbol, paymentLink.token]);

  const currentChainTokenAddress = getCurrentChainTokenAddress();

  // Get user's token balance for current chain
  const { data: balance } = useBalance({
    address,
    token:
      currentChainTokenAddress === "0x0000000000000000000000000000000000000000"
        ? undefined
        : currentChainTokenAddress,
    chainId,
  });

  // Get current token allowance for the current chain
  const { data: currentAllowance } = useTokenAllowance(
    currentChainTokenAddress,
    chainId
  );

  useEffect(() => {
    if (isSuccess && hash) {
      setIsCompleted(true);
      setPaymentStep("completed");
      onSuccess?.(hash);
      toast.success("Payment completed successfully!");

      // Handle post-payment actions (email sending and access creation)
      handlePostPaymentActions(hash);

      // Invalidate payment-related caches for real-time updates
      if (address) {
        setTimeout(() => {
          invalidatePaymentRelatedCaches(address);
        }, 2000); // Wait 2 seconds for blockchain to update
      }
    }
  }, [isSuccess, hash, onSuccess, address]);

  // Handle approval success
  useEffect(() => {
    if (approvalSuccess) {
      setNeedsTokenApproval(false);
      setPaymentStep("idle");
      toast.success(
        "Token approval successful! You can now proceed with payment."
      );
    }
  }, [approvalSuccess]);

  // Get amount to charge function
  const getAmountToCharge = useCallback(() => {
    const decimals = getTokenDecimals(paymentLink.tokenSymbol);
    try {
      if (paymentLink.amountType === AmountType.DYNAMIC && customAmount) {
        const normalizedAmount = normalizeNumberForParseUnits(customAmount);
        return parseUnits(normalizedAmount, decimals);
      }
      const normalizedAmount = normalizeNumberForParseUnits(paymentLink.amount);
      return parseUnits(normalizedAmount, decimals);
    } catch (error) {
      console.error("Error parsing amount:", error);
      // Return 0 as fallback to prevent crashes
      return BigInt(0);
    }
  }, [
    paymentLink.tokenSymbol,
    paymentLink.amountType,
    paymentLink.amount,
    customAmount,
  ]);

  // Check if approval is needed when amount or allowance changes
  useEffect(() => {
    if (currentAllowance !== undefined && address) {
      const amountToCharge = getAmountToCharge();
      setNeedsTokenApproval(needsApproval(currentAllowance, amountToCharge));
    }
  }, [
    currentAllowance,
    customAmount,
    paymentLink.amount,
    address,
    getAmountToCharge,
    needsApproval,
    chainId,
  ]);

  // Reset approval state when chain changes
  useEffect(() => {
    setPaymentStep("idle");
    // Force re-check of approval when chain changes
    if (currentAllowance !== undefined && address) {
      const amountToCharge = getAmountToCharge();
      setNeedsTokenApproval(needsApproval(currentAllowance, amountToCharge));
    }
  }, [chainId, currentAllowance, address, getAmountToCharge, needsApproval]);

  // Handle post-payment actions (email sending and access creation)
  const handlePostPaymentActions = async (transactionHash: string) => {
    if (!address || !buyerEmail) return;

    try {
      // Send transaction receipt email
      await EmailService.sendTransactionReceipt({
        buyerEmail,
        transactionHash,
        linkId: paymentLink.id,
        linkType: paymentLink.linkType,
        amount: paymentLink.amountType === AmountType.DYNAMIC && customAmount 
          ? customAmount 
          : paymentLink.amount,
        token: paymentLink.tokenSymbol,
        creatorName: creatorProfileData?.[1] || paymentLink.creator,
        productTitle: paymentLink.linkType === LinkType.PRODUCT ? paymentLink.title : undefined,
        contentTitle: paymentLink.linkType === LinkType.CONTENT ? paymentLink.title : undefined,
        blockExplorerUrl: getTransactionUrl(chainId, transactionHash),
      });

      // For content and product purchases, create access records and send access emails
      if (paymentLink.linkType === LinkType.CONTENT || paymentLink.linkType === LinkType.PRODUCT) {
        // Generate JWT access token
        const accessToken = await JWTService.generateAccessToken(
          paymentLink.id,
          address,
          transactionHash,
          {
            buyerEmail: buyerEmail || undefined,
            linkType: paymentLink.linkType === LinkType.CONTENT ? 'content' : 'product',
            contentTitle: paymentLink.title,
            maxDownloads: paymentLink.linkType === LinkType.PRODUCT ? 5 : undefined,
            expiresIn: '30d'
          }
        );
        
        // TODO: FUTURE_IMPROVEMENT - Add error handling for JWT generation failures
        // FLAG: JWT_PAYMENT_INTEGRATION - Updated payment processor to use JWT tokens
        
        // Store access record
        storeAccessRecord({
          linkId: paymentLink.id,
          buyer: address,
          purchaseTransaction: transactionHash,
          accessToken,
          createdAt: Date.now(),
          expiresAt: paymentLink.linkType === LinkType.CONTENT ? Date.now() + (30 * 24 * 60 * 60 * 1000) : undefined, // 30 days for content
          downloadCount: 0,
          maxDownloads: paymentLink.linkType === LinkType.PRODUCT ? 5 : undefined, // 5 downloads for products
          buyerEmail,
        });

        // Generate access URL
        const accessUrl = `${window.location.origin}/access/${paymentLink.id}?token=${accessToken}`;
        
        // Send content access email
        await EmailService.sendContentAccessEmail({
          buyerEmail,
          contentTitle: paymentLink.title,
          creatorName: creatorProfileData?.[1] || paymentLink.creator,
          accessUrl,
          accessToken,
          transactionHash,
          purchaseDate: new Date().toISOString(),
        });

        toast.success("Access details sent to your email!");
      }
    } catch (error) {
      console.error('Post-payment actions failed:', error);
      // Don't show error to user as payment was successful
      // Just log for debugging
    }
  };

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

  // Render content preview for product and content types
  const renderContentPreview = () => {
    const metadata = paymentLink.metadata;

    if (paymentLink.linkType === LinkType.PRODUCT && "images" in metadata) {
      const productMetadata = metadata as any;
      const images = productMetadata.images || [];
      const videos = productMetadata.videos || [];

      return (
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Product Preview</h4>
          {images.length > 0 && (
            <div className="grid gap-2">
              {images.slice(0, 4).map((imageHash: string, index: number) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={`https://gateway.pinata.cloud/ipfs/${imageHash}`}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {videos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Product Video</p>
              <video
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: "200px" }}
              >
                <source
                  src={`https://gateway.pinata.cloud/ipfs/${videos[0]}`}
                />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      );
    }

    if (
      paymentLink.linkType === LinkType.CONTENT &&
      "previewContent" in metadata
    ) {
      const contentMetadata = metadata as any;
      const previewContent = contentMetadata.previewContent || {};
      const previewImages = previewContent.images || [];
      const previewVideo = previewContent.video;
      const previewAudio = previewContent.audio;

      return (
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Content Preview</h4>
          {previewImages.length > 0 && (
            <div className="grid gap-2">
              {previewImages
                .slice(0, 4)
                .map((imageHash: string, index: number) => (
                  <div
                    key={index}
                    className="h-40 rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={`https://gateway.pinata.cloud/ipfs/${imageHash}`}
                      alt={`Content preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                ))}
            </div>
          )}
          {previewVideo && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Preview Video</p>
              <video
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: "200px" }}
              >
                <source
                  src={`https://gateway.pinata.cloud/ipfs/${previewVideo}`}
                />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          {previewAudio && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Audio Preview</p>
              <audio controls className="w-full">
                <source
                  src={`https://gateway.pinata.cloud/ipfs/${previewAudio}`}
                />
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}
          {previewContent.description && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Description</p>
              <div className="p-2 bg-border/30 rounded-lg min-h-20">
                <p className="text-sm">{previewContent.description}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Get token decimals for proper amount parsing
  const getTokenDecimals = (tokenSymbol: string): number => {
    const supportedTokens = getTokenConfig(chainId);
    const token = Object.values(supportedTokens).find(
      (t) => t.symbol === tokenSymbol
    );
    return token?.decimals || 18; // Default to 18 decimals if not found
  };

  // Helper to detect user cancellation
  const isUserRejection = useCallback((error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message || error.toString();
    const rejectionPatterns = [
      "user rejected",
      "user denied",
      "user cancelled",
      "user canceled",
      "rejected by user",
      "denied by user",
      "cancelled by user",
      "canceled by user",
      "transaction was rejected",
      "transaction rejected",
      "user rejected the request",
      "user rejected transaction",
      "ACTION_REJECTED",
      "UNAUTHORIZED",
      "User rejected",
      "User denied",
    ];

    return rejectionPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }, []);

  const handleApproval = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    setPaymentStep("approving");

    try {
      const result = await approveMax(currentChainTokenAddress, chainId);

      if (!result.success) {
        if (isUserRejection(result.error)) {
          toast.error("Transaction was canceled by user");
        } else {
          toast.error(result.error || "Token approval failed");
        }
        setPaymentStep("idle");
      }
    } catch (error) {
      console.error("Approval error:", error);
      if (isUserRejection(error)) {
        toast.error("Transaction was canceled by user");
      } else {
        toast.error("Token approval failed");
      }
      setPaymentStep("idle");
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

    // Validate email for product and content purchases
    if ((paymentLink.linkType === LinkType.PRODUCT || paymentLink.linkType === LinkType.CONTENT) && !buyerEmail) {
      toast.error("Please enter your email address to receive the content");
      return;
    }

    // Basic email validation
    if (buyerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      toast.error("Please enter a valid email address");
      return;
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

    setPaymentStep("processing");

    try {
      // Create payment request with updated token address for current chain
      const updatedLinkData = {
        ...paymentLink.originalLinkData,
        token: currentChainTokenAddress, // Use the correct token address for current chain
      };

      const paymentRequest: PaymentRequest = {
        linkData: updatedLinkData,
        signature: paymentLink.signature, // Use the stored signature from link creation
        message: message,
        buyerEmail: buyerEmail || undefined,
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
        if (isUserRejection(result.error)) {
          toast.error("Transaction was canceled by user");
        } else {
          toast.error(result.error || "Payment failed");
        }
        onError?.(result.error || "Payment failed");
        setPaymentStep("idle");
      } else {
        setPaymentStep("confirming");
      }
    } catch (error) {
      console.error("Payment error:", error);

      if (isUserRejection(error)) {
        toast.error("Transaction was canceled by user");
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Payment failed";
        toast.error(errorMessage);
        onError?.(errorMessage);
      }

      setPaymentStep("idle");
    }
  };

  // Check if token is supported on current chain
  const isTokenSupportedOnCurrentChain = useCallback(() => {
    const supportedTokens = getTokenConfig(chainId);
    console.log("Checking token support - Chain ID:", chainId);
    console.log("Checking token support - Supported tokens:", supportedTokens);
    console.log(
      "Checking token support - Looking for symbol:",
      paymentLink.tokenSymbol
    );

    const isSupported = Object.values(supportedTokens).some(
      (t) => t.symbol === paymentLink.tokenSymbol
    );
    console.log("Checking token support - Is supported:", isSupported);

    return isSupported;
  }, [chainId, paymentLink.tokenSymbol]);

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

  if (!isTokenSupportedOnCurrentChain()) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-xl font-semibold">Token Not Supported</h3>
                <p>
                  {paymentLink.tokenSymbol} is not supported on the current
                  network. Please switch to a supported network to make this
                  payment.
                </p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNetworkSelector(!showNetworkSelector)}
                    className="w-full"
                  >
                    <Network className="mr-2 h-4 w-4" />
                    {showNetworkSelector ? "Hide" : "View"} Supported Networks
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Selector for unsupported token */}
        {showNetworkSelector && (
          <NetworkSelector
            tokenAddress={currentChainTokenAddress}
            tokenSymbol={paymentLink.tokenSymbol}
            requiredAmount={getAmountToCharge()}
            onNetworkChange={(newChainId) => {
              console.log("Network changed to:", newChainId);
              // The component will re-render when chain changes
            }}
            className="border-0 shadow-none"
          />
        )}
      </div>
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
        <div className="flex items-start space-x-3">
          <Avatar>
            <AvatarFallback>
              {paymentLink.creator.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            {creatorProfileData && creatorProfileData[1] ? (
              <>
                <p className="text-xs text-muted-foreground">Creator: </p>
                <p className="font-medium">@{creatorProfileData[1]}</p>
                <p className="text-xs text-muted-foreground">
                  {`${paymentLink.creator.slice(
                    0,
                    6
                  )}...${paymentLink.creator.slice(-4)}`}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">
                  {`${paymentLink.creator.slice(
                    0,
                    6
                  )}...${paymentLink.creator.slice(-4)}`}
                </p>
                <p className="text-sm text-muted-foreground">Creator</p>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Content Preview Section */}
        {(paymentLink.linkType === LinkType.PRODUCT ||
          paymentLink.linkType === LinkType.CONTENT) && (
          <>
            {renderContentPreview()}
            <Separator />
          </>
        )}

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

          {/* Email for product and content purchases */}
          {(paymentLink.linkType === LinkType.PRODUCT ||
            paymentLink.linkType === LinkType.CONTENT) && (
            <div className="space-y-2">
              <Label htmlFor="buyerEmail">
                Email Address *
                <span className="text-xs text-muted-foreground ml-1">
                  (for content delivery)
                </span>
              </Label>
              <Input
                id="buyerEmail"
                type="email"
                placeholder="your.email@example.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="border-2 border-border shadow-shadow"
                required
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

        {/* Network Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Network & Approval Status
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNetworkSelector(!showNetworkSelector)}
              className="text-xs"
            >
              {showNetworkSelector ? "Hide" : "Show"} Networks
            </Button>
          </div>

          {showNetworkSelector && (
            <NetworkSelector
              tokenAddress={currentChainTokenAddress}
              tokenSymbol={paymentLink.tokenSymbol}
              requiredAmount={getAmountToCharge()}
              onNetworkChange={(newChainId) => {
                // Handle network change if needed
                console.log("Network changed to:", newChainId);
              }}
              className="border-0 shadow-none"
            />
          )}
        </div>

        {/* Approval/Payment Button */}
        <div className="flex items-center gap-2">
          {needsTokenApproval ? (
            <Button
              onClick={handleApproval}
              disabled={
                paymentStep === "approving" ||
                !isConnected ||
                isExpired ||
                isUsed
              }
              className="w-full"
              size="lg"
              variant="outline"
            >
              {paymentStep === "approving" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving {paymentLink.tokenSymbol}...
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
              disabled={
                paymentStep !== "idle" || !isConnected || isExpired || isUsed
              }
              className="w-full"
              size="lg"
            >
              {paymentStep === "processing" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : paymentStep === "confirming" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming Transaction...
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

        {/* Status Messages */}
        {paymentStep === "approving" && (
          <div className="text-sm text-center text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
            Approving {paymentLink.tokenSymbol} spending... Please confirm in
            your wallet.
          </div>
        )}

        {paymentStep === "processing" && (
          <div className="text-sm text-center text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
            Processing payment... Please confirm the transaction in your wallet.
          </div>
        )}

        {paymentStep === "confirming" && (
          <div className="text-sm text-center text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
            Transaction submitted! Waiting for blockchain confirmation...
          </div>
        )}

        {needsTokenApproval && isConnected && paymentStep === "idle" && (
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
