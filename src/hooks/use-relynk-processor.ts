"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { Address } from "viem";
import {
  LinkData,
  PaymentRequest,
  PaymentResult,
  CreateLinkFormData,
  PaymentLink,
  LinkMetadata,
} from "@/types/relynk";
import { getContractConfig, getTokenConfig } from "@/lib/contracts";

export function useRelynkProcessor() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get contract configuration for current chain
  const contracts = getContractConfig(chainId);
  const relynkProcessorConfig = contracts.RelynkProcessor;

  // Get supported tokens for current chain
  const supportedTokens = getTokenConfig(chainId);
  const supportedTokensArray = Object.values(supportedTokens);

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read functions
  const useIsSupportedToken = (tokenAddress: Address) => {
    return useReadContract({
      address: relynkProcessorConfig.address,
      abi: relynkProcessorConfig.abi,
      functionName: "supportedTokens",
      args: [tokenAddress],
      query: {
        enabled: !!tokenAddress,
      },
    });
  };

  const useIsLinkUsed = (linkId: string) => {
    return useReadContract({
      address: relynkProcessorConfig.address,
      abi: relynkProcessorConfig.abi,
      functionName: "usedLinks",
      args: [linkId],
      query: {
        enabled: !!linkId,
      },
    });
  };

  // Helper to detect user cancellation
  const isUserRejection = (error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message || error.toString();
    const rejectionPatterns = [
      'user rejected',
      'user denied',
      'user cancelled',
      'user canceled',
      'rejected by user',
      'denied by user',
      'cancelled by user',
      'canceled by user',
      'transaction was rejected',
      'transaction rejected',
      'user rejected the request',
      'user rejected transaction',
      'ACTION_REJECTED',
      'UNAUTHORIZED',
      'User rejected',
      'User denied',
    ];

    return rejectionPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  // Write functions
  const processPayment = async (
    paymentRequest: PaymentRequest
  ): Promise<PaymentResult> => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setIsProcessing(true);

      writeContract({
        address: relynkProcessorConfig.address,
        abi: relynkProcessorConfig.abi,
        functionName: "processPayment",
        args: [
          paymentRequest.linkData,
          paymentRequest.signature,
          paymentRequest.message || "",
          paymentRequest.customAmount || BigInt(0),
        ],
      });

      return { success: true };
    } catch (error) {
      console.error("Payment processing failed:", error);

      if (isUserRejection(error)) {
        return {
          success: false,
          error: "Transaction was canceled by user",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const processDonation = async (
    paymentRequest: PaymentRequest
  ): Promise<PaymentResult> => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setIsProcessing(true);

      writeContract({
        address: relynkProcessorConfig.address,
        abi: relynkProcessorConfig.abi,
        functionName: "processDonation",
        args: [
          paymentRequest.linkData,
          paymentRequest.signature,
          paymentRequest.message || "",
          paymentRequest.customAmount || BigInt(0),
        ],
      });

      return { success: true };
    } catch (error) {
      console.error("Donation processing failed:", error);

      if (isUserRejection(error)) {
        return {
          success: false,
          error: "Transaction was canceled by user",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const purchaseProduct = async (
    paymentRequest: PaymentRequest
  ): Promise<PaymentResult> => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setIsProcessing(true);

      writeContract({
        address: relynkProcessorConfig.address,
        abi: relynkProcessorConfig.abi,
        functionName: "purchaseProduct",
        args: [paymentRequest.linkData, paymentRequest.signature],
      });

      return { success: true };
    } catch (error) {
      console.error("Product purchase failed:", error);

      if (isUserRejection(error)) {
        return {
          success: false,
          error: "Transaction was canceled by user",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const purchaseContent = async (
    paymentRequest: PaymentRequest
  ): Promise<PaymentResult> => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setIsProcessing(true);

      const hash = await writeContract({
        address: relynkProcessorConfig.address,
        abi: relynkProcessorConfig.abi,
        functionName: "purchaseContent",
        args: [paymentRequest.linkData, paymentRequest.signature],
      });

      return {
        success: true,
        transactionHash: hash as unknown as `0x${string}`,
      };
    } catch (error) {
      console.error("Content purchase failed:", error);

      if (isUserRejection(error)) {
        return {
          success: false,
          error: "Transaction was canceled by user",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions
  const generateLinkId = (): string => {
    return `link_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  };

  const createLinkData = async (
    formData: CreateLinkFormData & { metadata?: string }, // Add metadata parameter
    creator: Address
  ): Promise<LinkData> => {
    console.log(
      "createLinkData called with creator:",
      creator,
      "type:",
      typeof creator
    );

    // Validate creator address
    if (
      !creator ||
      typeof creator !== "string" ||
      !creator.startsWith("0x") ||
      creator.length !== 42
    ) {
      throw new Error(
        `Invalid creator address: ${creator} (type: ${typeof creator})`
      );
    }

    const linkId = generateLinkId();
    const expiresTimestamp = BigInt(
      Math.floor(Date.now() / 1000) + formData.expiresIn * 3600
    );

    return {
      linkId,
      creator,
      linkType: formData.linkType,
      amountType: formData.amountType,
      usageType: formData.usageType,
      amount: BigInt(formData.amount), // Amount should already be formatted with proper decimals
      token: formData.token,
      expires: expiresTimestamp,
      metadata: formData.metadata || "", // Use provided metadata or empty string
      nonce: BigInt(Math.floor(Math.random() * 1000000)),
    };
  };

  const formatLinkForDisplay = async (
    linkData: LinkData,
    tokenSymbol: string,
    signature: `0x${string}`
  ): Promise<PaymentLink> => {
    // Get token decimals for proper formatting
    const getTokenDecimals = (symbol: string): number => {
      const token = supportedTokensArray.find(
        (t) => t.symbol === symbol
      );
      return token?.decimals || 18; // Default to 18 decimals
    };

    const decimals = getTokenDecimals(tokenSymbol);
    const formattedAmount = (
      Number(linkData.amount) / Math.pow(10, decimals)
    ).toString();

    // Handle metadata - could be IPFS hash or fallback JSON string
    let metadata: Record<string, unknown>;
    let fullMetadata: Record<string, unknown> | null = null;

    try {
      const { UnifiedIPFSService } = await import("@/lib/unified-ipfs-service");

      // Check if it's a fallback metadata format
      if (UnifiedIPFSService?.isFallbackMetadata(linkData.metadata)) {
        // Parse fallback JSON directly
        metadata = JSON.parse(linkData.metadata);
      } else {
        // Try to retrieve from IPFS
        try {
          fullMetadata = await UnifiedIPFSService.retrieveMetadata(
            linkData.metadata
          ) as unknown as Record<string, unknown>;
          metadata = {
            title: fullMetadata?.title,
            description: fullMetadata?.description,
            // Extract basic fields for backward compatibility
            redirectUrl: fullMetadata?.redirectUrl,
            successMessage: fullMetadata?.successMessage,
            tags: fullMetadata?.tags || [],
            category: fullMetadata?.category,
          };
        } catch (ipfsError) {
          console.warn(
            "Failed to retrieve metadata from IPFS, treating as JSON:",
            ipfsError
          );
          // Fallback to parsing as JSON
          metadata = JSON.parse(linkData.metadata);
        }
      }
    } catch (error) {
      console.error("Error processing metadata:", error);
      // Ultimate fallback
      metadata = {
        title: "Unknown Link",
        description: "",
        tags: [],
      };
    }

    return {
      id: linkData.linkId,
      title: (metadata.title as string) || "Unknown Link",
      description: (metadata.description as string) || "",
      creator: linkData.creator,
      linkType: linkData.linkType,
      amountType: linkData.amountType,
      usageType: linkData.usageType,
      amount: formattedAmount,
      token: linkData.token,
      tokenSymbol,
      expires: new Date(Number(linkData.expires) * 1000),
      isActive: Number(linkData.expires) * 1000 > Date.now(),
      isUsed: false, // This should be determined by contract state
      createdAt: new Date((fullMetadata?.createdAt as number) || Date.now()),
      updatedAt: new Date((fullMetadata?.updatedAt as number) || Date.now()),
      metadata: (fullMetadata || metadata) as unknown as LinkMetadata, // Use full metadata if available
      ipfsHash: linkData.metadata, // Store the IPFS hash
      signature, // Creator's signature for link validation
      originalLinkData: linkData, // Original linkData that was signed
      isExpired: Number(linkData.expires) * 1000 <= Date.now(),
      formattedAmount: `${formattedAmount} ${tokenSymbol}`,
      shortId: linkData.linkId.slice(0, 8),
      previewImage:
        (fullMetadata as { images?: string[]; previewContent?: { images?: string[] } })?.images?.[0] ||
        (fullMetadata as { images?: string[]; previewContent?: { images?: string[] } })?.previewContent?.images?.[0],
    };
  };

  return {
    // Read functions
    useIsSupportedToken,
    useIsLinkUsed,

    // Write functions
    processPayment,
    processDonation,
    purchaseProduct,
    purchaseContent,

    // Helper functions
    generateLinkId,
    createLinkData,
    formatLinkForDisplay,

    // State
    isProcessing,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
