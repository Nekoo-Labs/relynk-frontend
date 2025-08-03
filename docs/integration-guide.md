# Relynk Frontend Integration Guide

## Overview

This comprehensive guide provides examples for integrating Relynk smart contracts with Next.js frontend, including proper handling of all 4 LinkTypes (PAYMENT, DONATION, PRODUCT, CONTENT) with IPFS media storage.

## Installation

```bash
npm install ethers @rainbow-me/rainbowkit wagmi viem
npm install @pinata/sdk axios
npm install crypto-js # For content encryption
```

## Contract Configuration

```typescript
// config/contracts.ts
export const CONTRACTS = {
  RelynkProcessor: {
    address: "0x..." as Address,
    abi: RelynkProcessorABI,
  },
  ProfileRegistry: {
    address: "0x..." as Address,
    abi: ProfileRegistryABI,
  },
  tokens: {
    USDC: {
      address: "0xA0b86a33E6411E3b9d7A9af718e3a1B857C1BC08" as Address,
      decimals: 6,
      symbol: "USDC",
      name: "USD Coin",
    },
    USDT: {
      address: "0x..." as Address,
      decimals: 6,
      symbol: "USDT",
      name: "Tether USD",
    },
    IDRX: {
      address: "0x..." as Address,
      decimals: 2,
      symbol: "IDRX",
      name: "Indonesian Rupiah Token",
    },
  },
};

export const PINATA_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
  secretApiKey: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!,
  gateway:
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud",
};
```

## IPFS Service Integration

```typescript
// services/ipfsService.ts
import pinataSDK from "@pinata/sdk";
import {
  IPFSService,
  MediaUploadResult,
  BatchUploadResult,
} from "../types/relynk";

class PinataIPFSService implements IPFSService {
  private pinata: any;

  constructor() {
    this.pinata = pinataSDK(PINATA_CONFIG.apiKey, PINATA_CONFIG.secretApiKey);
  }

  async uploadFile(file: File): Promise<MediaUploadResult> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const options = {
        pinataMetadata: {
          name: file.name,
          keyvalues: {
            fileType: file.type,
            uploadedAt: new Date().toISOString(),
            relynkMedia: "true",
          },
        },
      };

      const result = await this.pinata.pinFileToIPFS(formData, options);

      return {
        success: true,
        ipfsHash: result.IpfsHash,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };
    } catch (error) {
      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        error: error.message,
      };
    }
  }

  async uploadFiles(files: File[]): Promise<BatchUploadResult> {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file));
      const results = await Promise.all(uploadPromises);

      const failedUploads = results.filter((r) => !r.success);
      if (failedUploads.length > 0) {
        throw new Error(`${failedUploads.length} files failed to upload`);
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        error: error.message,
      };
    }
  }

  async uploadJSON(data: any): Promise<{ ipfsHash: string }> {
    const options = {
      pinataMetadata: {
        name: `relynk-metadata-${Date.now()}`,
        keyvalues: {
          type: "metadata",
          uploadedAt: new Date().toISOString(),
        },
      },
    };

    const result = await this.pinata.pinJSONToIPFS(data, options);
    return { ipfsHash: result.IpfsHash };
  }

  async retrieveData<T>(ipfsHash: string): Promise<T> {
    const response = await fetch(`${PINATA_CONFIG.gateway}/ipfs/${ipfsHash}`);
    if (!response.ok) {
      throw new Error(`Failed to retrieve IPFS data: ${response.statusText}`);
    }
    return response.json();
  }

  async pinContent(ipfsHash: string): Promise<void> {
    await this.pinata.pinByHash(ipfsHash);
  }

  async unpinContent(ipfsHash: string): Promise<void> {
    await this.pinata.unpin(ipfsHash);
  }
}

export const ipfsService = new PinataIPFSService();
```

## Link Creation Utilities

```typescript
// utils/linkCreation.ts
import { ethers } from "ethers";
import { LinkData, LinkType, AmountType, UsageType } from "../types/relynk";

export function createLinkData(params: {
  linkId: string;
  creator: string;
  linkType: LinkType;
  amountType: AmountType;
  usageType: UsageType;
  amount: string;
  token: string;
  expiresInHours: number;
  metadataHash: string; // IPFS hash of metadata
}): LinkData {
  const expires = Math.floor(Date.now() / 1000) + params.expiresInHours * 3600;
  const nonce = Math.floor(Math.random() * 1000000);

  return {
    linkId: params.linkId,
    creator: params.creator as Address,
    linkType: params.linkType,
    amountType: params.amountType,
    usageType: params.usageType,
    amount: BigInt(params.amount),
    token: params.token as Address,
    expires: BigInt(expires),
    metadata: params.metadataHash,
    nonce: BigInt(nonce),
  };
}

export function hashLinkData(linkData: LinkData): string {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      [
        "string",
        "address",
        "uint8",
        "uint8",
        "uint8",
        "uint256",
        "address",
        "uint256",
        "string",
        "uint256",
      ],
      [
        linkData.linkId,
        linkData.creator,
        linkData.linkType,
        linkData.amountType,
        linkData.usageType,
        linkData.amount.toString(),
        linkData.token,
        linkData.expires.toString(),
        linkData.metadata,
        linkData.nonce.toString(),
      ]
    )
  );
}

export async function signLinkData(
  linkData: LinkData,
  signer: ethers.Signer
): Promise<string> {
  const hash = hashLinkData(linkData);
  return await signer.signMessage(ethers.utils.arrayify(hash));
}

// Type-specific validation
export function validateLinkType(linkData: Partial<LinkData>): string[] {
  const errors: string[] = [];

  switch (linkData.linkType) {
    case LinkType.PRODUCT:
      if (linkData.amountType !== AmountType.FIXED) {
        errors.push("Products must have fixed pricing");
      }
      if (linkData.usageType !== UsageType.REUSABLE) {
        errors.push("Products should be reusable");
      }
      break;

    case LinkType.CONTENT:
      if (linkData.amountType !== AmountType.FIXED) {
        errors.push("Content must have fixed pricing");
      }
      if (linkData.usageType !== UsageType.REUSABLE) {
        errors.push("Content should be reusable");
      }
      break;

    case LinkType.DONATION:
      if (linkData.amountType !== AmountType.DYNAMIC) {
        errors.push("Donations should allow custom amounts");
      }
      break;
  }

  return errors;
}
```

## Enhanced Hooks

```typescript
// hooks/useIPFS.ts
import { useState, useCallback } from "react";
import { ipfsService } from "../services/ipfsService";
import { UseIPFSReturn, MediaUploadProgress } from "../types/relynk";

export function useIPFS(): UseIPFSReturn {
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setError(null);

    // Initialize progress tracking
    const progressItems: MediaUploadProgress[] = files.map((file) => ({
      fileId: `${file.name}-${Date.now()}`,
      fileName: file.name,
      progress: 0,
      status: "uploading",
    }));
    setUploadProgress(progressItems);

    try {
      const result = await ipfsService.uploadFiles(files);

      // Update progress
      setUploadProgress((prev) =>
        prev.map((item, index) => ({
          ...item,
          progress: 100,
          status: result.results[index]?.success ? "completed" : "error",
          ipfsHash: result.results[index]?.ipfsHash,
          error: result.results[index]?.error,
        }))
      );

      return result;
    } catch (error) {
      setError(error.message);
      setUploadProgress((prev) =>
        prev.map((item) => ({
          ...item,
          status: "error" as const,
          error: error.message,
        }))
      );
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadMetadata = useCallback(async (metadata: any) => {
    try {
      return await ipfsService.uploadJSON(metadata);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  const retrieveMetadata = useCallback(async (ipfsHash: string) => {
    try {
      return await ipfsService.retrieveData(ipfsHash);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  const retrieveLinkData = useCallback(async (ipfsHash: string) => {
    try {
      return await ipfsService.retrieveData(ipfsHash);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  return {
    uploadMedia,
    uploadMetadata,
    retrieveMetadata,
    retrieveLinkData,
    uploadProgress,
    isUploading,
    error,
  };
}
```

```typescript
// hooks/usePayments.ts
import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACTS } from "../config/contracts";
import {
  UsePaymentReturn,
  PaymentRequest,
  PaymentResult,
  PaymentErrorCode,
} from "../types/relynk";

export function usePayments(): UsePaymentReturn {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const processPayment = async (
    request: PaymentRequest
  ): Promise<PaymentResult> => {
    if (!address) throw new Error("Wallet not connected");

    setIsLoading(true);
    setError(null);

    try {
      const hash = await writeContract({
        address: CONTRACTS.RelynkProcessor.address,
        abi: CONTRACTS.RelynkProcessor.abi,
        functionName: "processPayment",
        args: [
          request.linkData,
          request.signature,
          request.message || "",
          request.customAmount || BigInt(0),
        ],
      });

      return {
        success: true,
        transactionHash: hash,
      };
    } catch (error: any) {
      const errorCode = mapErrorToCode(error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
        errorCode,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const processDonation = async (
    request: PaymentRequest
  ): Promise<PaymentResult> => {
    if (!address) throw new Error("Wallet not connected");
    if (!request.customAmount) throw new Error("Donation amount required");

    setIsLoading(true);
    setError(null);

    try {
      const hash = await writeContract({
        address: CONTRACTS.RelynkProcessor.address,
        abi: CONTRACTS.RelynkProcessor.abi,
        functionName: "processDonation",
        args: [
          request.linkData,
          request.signature,
          request.message || "",
          request.customAmount,
        ],
      });

      return {
        success: true,
        transactionHash: hash,
      };
    } catch (error: any) {
      const errorCode = mapErrorToCode(error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
        errorCode,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseContent = async (
    request: PaymentRequest
  ): Promise<PaymentResult> => {
    if (!address) throw new Error("Wallet not connected");

    setIsLoading(true);
    setError(null);

    try {
      const hash = await writeContract({
        address: CONTRACTS.RelynkProcessor.address,
        abi: CONTRACTS.RelynkProcessor.abi,
        functionName: "purchaseContent",
        args: [request.linkData, request.signature],
      });

      // Generate access token for content delivery
      const accessToken = await generateContentAccessToken(
        request.linkData.linkId,
        address
      );

      return {
        success: true,
        transactionHash: hash,
        accessToken,
      };
    } catch (error: any) {
      const errorCode = mapErrorToCode(error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
        errorCode,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseProduct = async (
    request: PaymentRequest
  ): Promise<PaymentResult> => {
    if (!address) throw new Error("Wallet not connected");

    setIsLoading(true);
    setError(null);

    try {
      const hash = await writeContract({
        address: CONTRACTS.RelynkProcessor.address,
        abi: CONTRACTS.RelynkProcessor.abi,
        functionName: "purchaseProduct",
        args: [request.linkData, request.signature],
      });

      return {
        success: true,
        transactionHash: hash,
      };
    } catch (error: any) {
      const errorCode = mapErrorToCode(error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
        errorCode,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processPayment,
    processDonation,
    purchaseContent,
    purchaseProduct,
    isLoading,
    error,
    clearError,
  };
}

function mapErrorToCode(error: any): PaymentErrorCode {
  const message = error.message.toLowerCase();

  if (message.includes("insufficient balance"))
    return PaymentErrorCode.INSUFFICIENT_BALANCE;
  if (message.includes("insufficient allowance"))
    return PaymentErrorCode.INSUFFICIENT_ALLOWANCE;
  if (message.includes("expired")) return PaymentErrorCode.LINK_EXPIRED;
  if (message.includes("already used"))
    return PaymentErrorCode.LINK_ALREADY_USED;
  if (message.includes("invalid signature"))
    return PaymentErrorCode.INVALID_SIGNATURE;
  if (message.includes("user rejected")) return PaymentErrorCode.USER_REJECTED;

  return PaymentErrorCode.TRANSACTION_FAILED;
}

async function generateContentAccessToken(
  linkId: string,
  buyer: string
): Promise<string> {
  // This would typically call your backend API to generate a secure access token
  const response = await fetch("/api/content/access-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ linkId, buyer }),
  });

  const data = await response.json();
  return data.accessToken;
}
```

## React Components

### 1. Universal Link Creator

```tsx
// components/LinkCreator.tsx
import React, { useState } from "react";
import { useSigner } from "wagmi";
import { useIPFS } from "../hooks/useIPFS";
import { createLinkData, signLinkData } from "../utils/linkCreation";
import {
  LinkType,
  AmountType,
  UsageType,
  CreateLinkFormData,
} from "../types/relynk";

export function LinkCreator() {
  const { data: signer } = useSigner();
  const { uploadMedia, uploadMetadata, isUploading } = useIPFS();

  const [formData, setFormData] = useState<CreateLinkFormData>({
    title: "",
    description: "",
    linkType: LinkType.PAYMENT,
    amountType: AmountType.FIXED,
    usageType: UsageType.ONE_TIME,
    amount: "",
    token: CONTRACTS.tokens.USDC.address,
    expiresIn: 24,
    images: [],
    videos: [],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleMediaUpload = async (
    files: File[],
    type: "images" | "videos"
  ) => {
    const result = await uploadMedia(files);
    if (result.success) {
      setFormData((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), ...files],
      }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep formData={formData} setFormData={setFormData} />;
      case 2:
        return (
          <MediaUploadStep
            formData={formData}
            onMediaUpload={handleMediaUpload}
            isUploading={isUploading}
          />
        );
      case 3:
        return (
          <TypeSpecificStep formData={formData} setFormData={setFormData} />
        );
      case 4:
        return <ReviewStep formData={formData} onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    if (!signer) return;

    try {
      // 1. Upload media files
      const mediaFiles = [
        ...(formData.images || []),
        ...(formData.videos || []),
      ];
      const mediaResult = await uploadMedia(mediaFiles);

      if (!mediaResult.success) throw new Error("Failed to upload media");

      // 2. Create metadata object
      const metadata = createMetadataForType(formData, mediaResult.results);

      // 3. Upload metadata to IPFS
      const metadataResult = await uploadMetadata(metadata);

      // 4. Create and sign link data
      const linkId = `${formData.linkType}-${Date.now()}`;
      const creatorAddress = await signer.getAddress();

      const linkData = createLinkData({
        linkId,
        creator: creatorAddress,
        linkType: formData.linkType,
        amountType: formData.amountType,
        usageType: formData.usageType,
        amount: parseUnits(formData.amount, 6).toString(),
        token: formData.token,
        expiresInHours: formData.expiresIn,
        metadataHash: metadataResult.ipfsHash,
      });

      const signature = await signLinkData(linkData, signer);

      // 5. Store complete link data
      const completeLinkData = {
        linkData,
        signature,
        metadata,
        version: "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const linkDataResult = await uploadMetadata(completeLinkData);

      // 6. Generate shareable link
      const shareableLink = `${window.location.origin}/pay/${linkDataResult.ipfsHash}`;
      setGeneratedLink(shareableLink);
    } catch (error) {
      console.error("Error creating link:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Create Payment Link</h2>
          <div className="text-sm text-gray-500">Step {currentStep} of 4</div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {renderStepContent()}

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>

        {currentStep < 4 ? (
          <button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isUploading ? "Creating..." : "Create Link"}
          </button>
        )}
      </div>

      {generatedLink && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">
            Link Created Successfully!
          </h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={generatedLink}
              readOnly
              className="flex-1 p-2 text-sm border border-green-300 rounded-md bg-white"
            />
            <button
              onClick={() => navigator.clipboard.writeText(generatedLink)}
              className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Step Components
function BasicInfoStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Link Type</label>
        <select
          value={formData.linkType}
          onChange={(e) =>
            setFormData({ ...formData, linkType: Number(e.target.value) })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value={LinkType.PAYMENT}>Payment</option>
          <option value={LinkType.DONATION}>Donation</option>
          <option value={LinkType.PRODUCT}>Product</option>
          <option value={LinkType.CONTENT}>Content</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Enter a descriptive title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={3}
          placeholder="Describe what this payment is for"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount Type</label>
          <select
            value={formData.amountType}
            onChange={(e) =>
              setFormData({ ...formData, amountType: Number(e.target.value) })
            }
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value={AmountType.FIXED}>Fixed Amount</option>
            <option value={AmountType.DYNAMIC}>Custom Amount</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Usage</label>
          <select
            value={formData.usageType}
            onChange={(e) =>
              setFormData({ ...formData, usageType: Number(e.target.value) })
            }
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value={UsageType.ONE_TIME}>One-time use</option>
            <option value={UsageType.REUSABLE}>Reusable</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {formData.amountType === AmountType.FIXED
              ? "Amount"
              : "Suggested Amount"}
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Token</label>
          <select
            value={formData.token}
            onChange={(e) =>
              setFormData({ ...formData, token: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value={CONTRACTS.tokens.USDC.address}>USDC</option>
            <option value={CONTRACTS.tokens.USDT.address}>USDT</option>
            <option value={CONTRACTS.tokens.IDRX.address}>IDRX</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function MediaUploadStep({ formData, onMediaUpload, isUploading }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Images</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) =>
              onMediaUpload(Array.from(e.target.files || []), "images")
            }
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upload Images
          </label>
          <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB each</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Videos</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            accept="video/*"
            onChange={(e) =>
              onMediaUpload(Array.from(e.target.files || []), "videos")
            }
            className="hidden"
            id="video-upload"
          />
          <label
            htmlFor="video-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upload Videos
          </label>
          <p className="text-sm text-gray-500 mt-2">
            MP4, MOV up to 100MB each
          </p>
        </div>
      </div>

      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-800">
              Uploading media files...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function TypeSpecificStep({ formData, setFormData }: any) {
  switch (formData.linkType) {
    case LinkType.PRODUCT:
      return (
        <ProductSpecificFields formData={formData} setFormData={setFormData} />
      );
    case LinkType.CONTENT:
      return (
        <ContentSpecificFields formData={formData} setFormData={setFormData} />
      );
    case LinkType.DONATION:
      return (
        <DonationSpecificFields formData={formData} setFormData={setFormData} />
      );
    default:
      return (
        <PaymentSpecificFields formData={formData} setFormData={setFormData} />
      );
  }
}

function ProductSpecificFields({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Product Name</label>
        <input
          type="text"
          value={formData.productDetails?.productName || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              productDetails: {
                ...formData.productDetails,
                productName: e.target.value,
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Brand</label>
        <input
          type="text"
          value={formData.productDetails?.brand || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              productDetails: {
                ...formData.productDetails,
                brand: e.target.value,
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.shippingRequired || false}
            onChange={(e) =>
              setFormData({ ...formData, shippingRequired: e.target.checked })
            }
            className="mr-2"
          />
          Requires Shipping
        </label>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isDigitalDelivery || false}
            onChange={(e) =>
              setFormData({ ...formData, isDigitalDelivery: e.target.checked })
            }
            className="mr-2"
          />
          Digital Product
        </label>
      </div>
    </div>
  );
}

function ContentSpecificFields({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Content Type</label>
        <select
          value={formData.contentDetails?.contentType || "other"}
          onChange={(e) =>
            setFormData({
              ...formData,
              contentDetails: {
                ...formData.contentDetails,
                contentType: e.target.value,
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="document">Document</option>
          <option value="course">Course</option>
          <option value="ebook">E-book</option>
          <option value="software">Software</option>
          <option value="template">Template</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Duration (minutes)
        </label>
        <input
          type="number"
          value={formData.contentDetails?.duration || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              contentDetails: {
                ...formData.contentDetails,
                duration: Number(e.target.value),
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Level</label>
        <select
          value={formData.contentDetails?.level || "beginner"}
          onChange={(e) =>
            setFormData({
              ...formData,
              contentDetails: {
                ...formData.contentDetails,
                level: e.target.value,
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Content File</label>
        <input
          type="file"
          onChange={(e) =>
            setFormData({
              ...formData,
              contentFile: e.target.files?.[0],
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        <p className="text-xs text-gray-500 mt-1">
          This will be encrypted and only accessible after purchase
        </p>
      </div>
    </div>
  );
}

function DonationSpecificFields({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Cause</label>
        <input
          type="text"
          value={formData.donationDetails?.cause || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              donationDetails: {
                ...formData.donationDetails,
                cause: e.target.value,
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="What are you raising money for?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Goal Amount (optional)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.donationDetails?.goalAmount || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              donationDetails: {
                ...formData.donationDetails,
                goalAmount: e.target.value,
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Target amount to raise"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Website (optional)
        </label>
        <input
          type="url"
          value={formData.donationDetails?.socialLinks?.website || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              donationDetails: {
                ...formData.donationDetails,
                socialLinks: {
                  ...formData.donationDetails?.socialLinks,
                  website: e.target.value,
                },
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="https://your-website.com"
        />
      </div>
    </div>
  );
}

function PaymentSpecificFields({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Invoice Number (optional)
        </label>
        <input
          type="text"
          value={formData.paymentDetails?.invoiceNumber || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              paymentDetails: {
                ...formData.paymentDetails,
                invoiceNumber: e.target.value,
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="INV-001"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Service Name (optional)
        </label>
        <input
          type="text"
          value={formData.paymentDetails?.serviceName || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              paymentDetails: {
                ...formData.paymentDetails,
                serviceName: e.target.value,
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Web Development Services"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Redirect URL (optional)
        </label>
        <input
          type="url"
          value={formData.paymentDetails?.redirectUrl || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              paymentDetails: {
                ...formData.paymentDetails,
                redirectUrl: e.target.value,
              },
            })
          }
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="https://example.com/success"
        />
      </div>
    </div>
  );
}

function ReviewStep({ formData, onSubmit }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Review Your Link</h3>

      <div className="bg-gray-50 p-4 rounded-md">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="text-sm text-gray-900">
              {LinkType[formData.linkType]}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Title</dt>
            <dd className="text-sm text-gray-900">{formData.title}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Amount</dt>
            <dd className="text-sm text-gray-900">
              {formData.amount} {CONTRACTS.tokens.USDC.symbol}
              {formData.amountType === AmountType.DYNAMIC && " (suggested)"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Usage</dt>
            <dd className="text-sm text-gray-900">
              {UsageType[formData.usageType]}
            </dd>
          </div>
        </dl>
      </div>

      <div>
        <dt className="text-sm font-medium text-gray-500 mb-1">Description</dt>
        <dd className="text-sm text-gray-900">{formData.description}</dd>
      </div>

      <button
        onClick={onSubmit}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium"
      >
        Create Payment Link
      </button>
    </div>
  );
}

// Helper function to create metadata based on link type
function createMetadataForType(
  formData: CreateLinkFormData,
  mediaResults: any[]
) {
  const baseMetadata = {
    title: formData.title,
    description: formData.description,
    category: formData.category,
    tags: formData.tags,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const images = mediaResults
    .filter((r) => r.mimeType.startsWith("image/"))
    .map((r) => r.ipfsHash);
  const videos = mediaResults
    .filter((r) => r.mimeType.startsWith("video/"))
    .map((r) => r.ipfsHash);

  switch (formData.linkType) {
    case LinkType.PRODUCT:
      return {
        ...baseMetadata,
        linkType: LinkType.PRODUCT,
        productName: formData.productDetails?.productName || formData.title,
        brand: formData.productDetails?.brand,
        images,
        videos,
        specifications: formData.productDetails?.specifications || {},
        shipping: {
          required: formData.shippingRequired || false,
          freeShipping: true,
        },
        digitalDelivery: formData.isDigitalDelivery || false,
      };

    case LinkType.CONTENT:
      return {
        ...baseMetadata,
        linkType: LinkType.CONTENT,
        contentType: formData.contentDetails?.contentType || "other",
        previewContent: {
          images,
          video: videos[0], // First video as preview
          description: formData.description,
        },
        contentDetails: {
          duration: formData.contentDetails?.duration,
          language: "English",
          level: formData.contentDetails?.level || "beginner",
        },
        deliveryMethod: "encrypted_ipfs",
      };

    case LinkType.DONATION:
      return {
        ...baseMetadata,
        linkType: LinkType.DONATION,
        cause: formData.donationDetails?.cause || formData.title,
        goalAmount: formData.donationDetails?.goalAmount,
        images,
        videos,
        socialLinks: formData.donationDetails?.socialLinks || {},
      };

    default: // PAYMENT
      return {
        ...baseMetadata,
        linkType: LinkType.PAYMENT,
        invoiceNumber: formData.paymentDetails?.invoiceNumber,
        serviceName: formData.paymentDetails?.serviceName,
        redirectUrl: formData.paymentDetails?.redirectUrl,
      };
  }
}
```

### 2. Universal Payment Processor

```tsx
// components/PaymentProcessor.tsx
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { usePayments } from "../hooks/usePayments";
import { useTokens } from "../hooks/useTokens";
import { useIPFS } from "../hooks/useIPFS";
import { LinkData, LinkType, AmountType, PaymentLink } from "../types/relynk";
import { formatUnits, parseUnits } from "ethers/lib/utils";

interface PaymentProcessorProps {
  ipfsHash: string; // IPFS hash containing the complete link data
}

export function PaymentProcessor({ ipfsHash }: PaymentProcessorProps) {
  const { address } = useAccount();
  const {
    processPayment,
    processDonation,
    purchaseContent,
    purchaseProduct,
    isLoading,
  } = usePayments();
  const { approveToken, getTokenBalance, getAllowance } = useTokens();
  const { retrieveLinkData } = useIPFS();

  const [linkData, setLinkData] = useState<PaymentLink | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [balance, setBalance] = useState("0");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLinkData();
  }, [ipfsHash]);

  useEffect(() => {
    if (address && linkData) {
      checkBalanceAndApproval();
    }
  }, [address, linkData, customAmount, selectedVariant]);

  const loadLinkData = async () => {
    try {
      setLoading(true);
      const data = await retrieveLinkData(ipfsHash);
      setLinkData(data);

      // Set default custom amount for dynamic pricing
      if (
        data.linkData.amountType === AmountType.DYNAMIC &&
        data.linkData.amount
      ) {
        setCustomAmount(formatUnits(data.linkData.amount, 6));
      }
    } catch (error) {
      setError("Failed to load payment link");
    } finally {
      setLoading(false);
    }
  };

  const checkBalanceAndApproval = async () => {
    if (!address || !linkData) return;

    try {
      // Get user balance
      const userBalance = await getTokenBalance(
        linkData.linkData.token,
        address
      );
      setBalance(userBalance.toString());

      // Calculate required amount
      const requiredAmount = getRequiredAmount();

      // Check allowance
      const allowance = await getAllowance(
        linkData.linkData.token,
        address,
        CONTRACTS.RelynkProcessor.address
      );

      setNeedsApproval(BigInt(allowance) < BigInt(requiredAmount));
    } catch (error) {
      console.error("Error checking balance/approval:", error);
    }
  };

  const getRequiredAmount = (): string => {
    if (!linkData) return "0";

    const { linkData: ld } = linkData;

    if (ld.amountType === AmountType.FIXED) {
      // For products with variants, check if variant has price modifier
      if (ld.linkType === LinkType.PRODUCT && selectedVariant) {
        const variant = linkData.metadata.variants?.find(
          (v) => v.id === selectedVariant
        );
        if (variant) {
          const baseAmount = BigInt(ld.amount.toString());
          const modifier = BigInt(variant.priceModifier || "0");
          return (baseAmount + modifier).toString();
        }
      }
      return ld.amount.toString();
    } else {
      return parseUnits(customAmount || "0", 6).toString();
    }
  };

  const handleApprove = async () => {
    if (!linkData) return;

    const amount = getRequiredAmount();
    await approveToken(
      linkData.linkData.token,
      CONTRACTS.RelynkProcessor.address,
      BigInt(amount)
    );
    setNeedsApproval(false);
  };

  const handlePayment = async () => {
    if (!linkData) return;

    const request = {
      linkData: linkData.linkData,
      signature: linkData.signature,
      message,
      customAmount:
        linkData.linkData.amountType === AmountType.DYNAMIC
          ? parseUnits(customAmount, 6)
          : undefined,
      selectedVariant,
    };

    let result;
    switch (linkData.linkData.linkType) {
      case LinkType.DONATION:
        result = await processDonation({
          ...request,
          customAmount: parseUnits(customAmount, 6),
        });
        break;
      case LinkType.CONTENT:
        result = await purchaseContent(request);
        break;
      case LinkType.PRODUCT:
        result = await purchaseProduct(request);
        break;
      default:
        result = await processPayment(request);
    }

    if (result.success) {
      // Handle success (redirect, show success message, etc.)
      if (linkData.metadata.redirectUrl) {
        window.location.href = linkData.metadata.redirectUrl;
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !linkData) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Link Not Found</h2>
          <p>{error || "This payment link could not be loaded."}</p>
        </div>
      </div>
    );
  }

  const { linkData: ld, metadata } = linkData;
  const isExpired = Date.now() > Number(ld.expires) * 1000;

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header Image */}
      {metadata.images && metadata.images[0] && (
        <div className="h-48 bg-gray-200">
          <img
            src={`${PINATA_CONFIG.gateway}/ipfs/${metadata.images[0]}`}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{metadata.title}</h2>
          <p className="text-gray-600 text-sm mt-1">{metadata.description}</p>

          {/* Link Type Badge */}
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
              ld.linkType === LinkType.DONATION
                ? "bg-green-100 text-green-800"
                : ld.linkType === LinkType.PRODUCT
                ? "bg-blue-100 text-blue-800"
                : ld.linkType === LinkType.CONTENT
                ? "bg-purple-100 text-purple-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {LinkType[ld.linkType]}
          </span>
        </div>

        {isExpired ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
            <p className="text-red-800 font-medium">This link has expired</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Amount Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {ld.linkType === LinkType.DONATION
                  ? "Donation Amount"
                  : ld.amountType === AmountType.FIXED
                  ? "Amount"
                  : "Enter Amount"}
              </label>

              {ld.amountType === AmountType.FIXED ? (
                <div className="text-2xl font-bold text-gray-900">
                  {formatUnits(getRequiredAmount(), 6)}{" "}
                  {getTokenSymbol(ld.token)}
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md text-lg"
                    placeholder="0.00"
                    required
                  />
                  <span className="absolute right-3 top-3 text-gray-500">
                    {getTokenSymbol(ld.token)}
                  </span>
                </div>
              )}
            </div>

            {/* Product Variants */}
            {ld.linkType === LinkType.PRODUCT &&
              metadata.variants &&
              metadata.variants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Variant
                  </label>
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Choose variant...</option>
                    {metadata.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name}{" "}
                        {variant.priceModifier !== "0" &&
                          `(+${formatUnits(
                            variant.priceModifier,
                            6
                          )} ${getTokenSymbol(ld.token)})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {/* Message Field */}
            {(ld.linkType === LinkType.DONATION ||
              ld.linkType === LinkType.PAYMENT) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ld.linkType === LinkType.DONATION
                    ? "Message (optional)"
                    : "Note (optional)"}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    ld.linkType === LinkType.DONATION
                      ? "Leave a message of support..."
                      : "Add a note..."
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
            )}

            {/* Balance Display */}
            <div className="text-sm text-gray-600">
              <p>
                Your balance: {formatUnits(balance, 6)}{" "}
                {getTokenSymbol(ld.token)}
              </p>
              {BigInt(balance) < BigInt(getRequiredAmount()) && (
                <p className="text-red-600">Insufficient balance</p>
              )}
            </div>

            {/* Action Button */}
            {!address ? (
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium">
                Connect Wallet
              </button>
            ) : needsApproval ? (
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="w-full bg-yellow-600 text-white py-3 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 font-medium"
              >
                {isLoading
                  ? "Approving..."
                  : `Approve ${getTokenSymbol(ld.token)}`}
              </button>
            ) : (
              <button
                onClick={handlePayment}
                disabled={
                  isLoading ||
                  (!customAmount && ld.amountType === AmountType.DYNAMIC) ||
                  BigInt(balance) < BigInt(getRequiredAmount()) ||
                  (ld.linkType === LinkType.PRODUCT &&
                    metadata.variants?.length &&
                    !selectedVariant)
                }
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {isLoading ? "Processing..." : getButtonText(ld.linkType)}
              </button>
            )}

            {/* Additional Info */}
            {ld.linkType === LinkType.CONTENT && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>What you'll get:</strong> After purchase, you'll
                  receive access to the content
                  {metadata.contentDetails?.duration &&
                    ` (${Math.floor(
                      metadata.contentDetails.duration / 60
                    )} minutes)`}
                </p>
              </div>
            )}

            {ld.linkType === LinkType.PRODUCT &&
              metadata.shipping?.required && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                  <p className="text-sm text-orange-800">
                    <strong>Shipping:</strong> This product requires shipping.
                    {metadata.shipping.freeShipping &&
                      " Free shipping included!"}
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function getTokenSymbol(tokenAddress: string): string {
  const token = Object.values(CONTRACTS.tokens).find(
    (t) => t.address === tokenAddress
  );
  return token?.symbol || "TOKEN";
}

function getButtonText(linkType: LinkType): string {
  switch (linkType) {
    case LinkType.DONATION:
      return "Donate Now";
    case LinkType.PRODUCT:
      return "Buy Now";
    case LinkType.CONTENT:
      return "Purchase Content";
    default:
      return "Pay Now";
  }
}
```

### 3. Dashboard Components

```tsx
// components/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useLinkManagement } from "../hooks/useLinkManagement";
import { PaymentLink, LinkType, FilterOptions } from "../types/relynk";

export function Dashboard() {
  const { address } = useAccount();
  const { getLinks, getLinkAnalytics, isLoading } = useLinkManagement();

  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [filter, setFilter] = useState<FilterOptions>({});
  const [stats, setStats] = useState({
    totalLinks: 0,
    activeLinks: 0,
    totalEarnings: "0",
    totalPayments: 0,
  });

  useEffect(() => {
    if (address) {
      loadDashboardData();
    }
  }, [address, filter]);

  const loadDashboardData = async () => {
    try {
      const linksResponse = await getLinks(filter);
      setLinks(linksResponse.data);

      // Calculate stats
      const activeLinks = linksResponse.data.filter(
        (link) => link.isActive && !link.isExpired
      );
      setStats({
        totalLinks: linksResponse.data.length,
        activeLinks: activeLinks.length,
        totalEarnings: "0", // Would come from contract
        totalPayments: 0, // Would come from analytics
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Manage your payment links and track performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Links" value={stats.totalLinks} />
        <StatCard title="Active Links" value={stats.activeLinks} />
        <StatCard
          title="Total Earnings"
          value={`${stats.totalEarnings} USDC`}
        />
        <StatCard title="Total Payments" value={stats.totalPayments} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filter.linkType?.[0] || ""}
            onChange={(e) =>
              setFilter({
                ...filter,
                linkType: e.target.value
                  ? [Number(e.target.value) as LinkType]
                  : undefined,
              })
            }
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Types</option>
            <option value={LinkType.PAYMENT}>Payment</option>
            <option value={LinkType.DONATION}>Donation</option>
            <option value={LinkType.PRODUCT}>Product</option>
            <option value={LinkType.CONTENT}>Content</option>
          </select>

          <select
            value={filter.isActive?.toString() || ""}
            onChange={(e) =>
              setFilter({
                ...filter,
                isActive: e.target.value
                  ? e.target.value === "true"
                  : undefined,
              })
            }
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <input
            type="text"
            placeholder="Search links..."
            value={filter.search || ""}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 flex-1 min-w-0"
          />
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Your Payment Links</h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading links...</p>
          </div>
        ) : links.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>
              No payment links found. Create your first link to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {links.map((link) => (
                  <LinkRow key={link.id} link={link} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function LinkRow({ link }: { link: PaymentLink }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{link.title}</div>
          <div className="text-sm text-gray-500">{link.shortId}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            link.linkType === LinkType.DONATION
              ? "bg-green-100 text-green-800"
              : link.linkType === LinkType.PRODUCT
              ? "bg-blue-100 text-blue-800"
              : link.linkType === LinkType.CONTENT
              ? "bg-purple-100 text-purple-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {LinkType[link.linkType]}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {link.formattedAmount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            link.isActive && !link.isExpired
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {link.isActive && !link.isExpired ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {link.createdAt.toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-indigo-600 hover:text-indigo-900"
          >
            Actions
          </button>
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
              <div className="py-1">
                <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  Copy Link
                </button>
                <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  View Analytics
                </button>
                <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  Edit
                </button>
                <button className="block px-4 py-2 text-sm text-red-700 hover:bg-gray-100 w-full text-left">
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
```

## API Routes (Next.js)

```typescript
// pages/api/content/access-token.ts
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { linkId, buyer } = req.body;

  try {
    // Verify the purchase transaction on-chain
    // This is a simplified example - you'd want to verify the actual transaction

    const accessToken = jwt.sign(
      {
        linkId,
        buyer,
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      },
      process.env.JWT_SECRET!
    );

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate access token" });
  }
}
```

```typescript
// pages/api/content/[token].ts
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as any;

    // Provide access to the encrypted content
    // In practice, you'd decrypt the content or provide a temporary download URL

    res.status(200).json({
      success: true,
      contentUrl: `${process.env.PINATA_GATEWAY}/ipfs/${decoded.contentHash}`,
      expiresAt: decoded.exp,
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}
```

This comprehensive integration guide provides a complete foundation for building a Relynk-powered application with proper support for all 4 LinkTypes, media handling via IPFS, and secure content delivery.
