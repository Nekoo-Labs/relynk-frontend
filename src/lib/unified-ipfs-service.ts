import {
  LinkData,
  LinkMetadata,
  IPFSLinkData,
  PaymentLink,
} from "@/types/relynk";
import { pinata } from "./pinata";
import { Address } from "viem";
import { api } from "@/services/api";
import { SUPPORTED_TOKENS } from "./contracts";

// Create array version for easier iteration
const SUPPORTED_TOKENS_ARRAY = Object.values(SUPPORTED_TOKENS);

/**
 * Unified IPFS Service for Relynk
 * Combines payment link storage and metadata services
 * Uses Pinata keyvalues for tracking instead of localStorage
 */
export class UnifiedIPFSService {
  private static readonly PINATA_GATEWAY = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs`;

  /**
   * Helper function to serialize objects with BigInt values
   */
  private static serializeWithBigInt(obj: unknown): string {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    });
  }

  /**
   * Helper function to deserialize objects and restore BigInt values
   */
  private static deserializeWithBigInt(
    jsonString: string,
    bigIntFields: string[] = []
  ): unknown {
    const obj = JSON.parse(jsonString);

    // Recursively restore BigInt fields
    const restoreBigInts = (target: Record<string, unknown>, path: string[] = []): Record<string, unknown> => {
      if (typeof target === "object" && target !== null) {
        for (const [key, value] of Object.entries(target)) {
          const currentPath = [...path, key];
          const fieldPath = currentPath.join(".");

          if (bigIntFields.includes(fieldPath) && typeof value === "string") {
            target[key] = BigInt(value);
          } else if (typeof value === "object" && value !== null) {
            restoreBigInts(value as Record<string, unknown>, currentPath);
          }
        }
      }
      return target;
    };

    return restoreBigInts(obj);
  }

  /**
   * Store a complete payment link (LinkData + metadata + signature) to IPFS
   * Uses Pinata keyvalues to track the file by creator address
   */
  public static async storePaymentLink(
    linkData: LinkData,
    signature: `0x${string}`,
    metadata: LinkMetadata
  ): Promise<{ ipfsHash: string; paymentLink: PaymentLink }> {
    try {
      // Store the complete data in a single file
      // The linkData.metadata field will contain the IPFS hash of this complete file
      const ipfsLinkData: IPFSLinkData = {
        linkData,
        signature,
        metadata,
        version: "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Get signed upload URL from our API
      const urlRequest = await fetch(
        `/api/v1/payment-links/${linkData.creator}/upload`
      );
      if (!urlRequest.ok) {
        throw new Error("Failed to get upload URL");
      }
      const urlResponse = await urlRequest.json();

      // Create a JSON file from the data
      const jsonContent = this.serializeWithBigInt(ipfsLinkData);
      const file = new File([jsonContent], `relynk-${linkData.linkId}.json`, {
        type: "application/json",
      });

      // Upload with keyvalues metadata for tracking
      const upload = await pinata.upload.public
        .file(file)
        .keyvalues({
          creator: linkData.creator.toLowerCase(), // Track by creator address
          linkId: linkData.linkId,
          linkType: linkData.linkType.toString(),
          title: metadata.title,
          createdAt: Date.now().toString(),
          version: "1.0.0",
        })
        .url(urlResponse.url);

      if (!upload.cid) {
        throw new Error("No IPFS hash returned from upload");
      }

      // Update the linkData with the IPFS hash for consistency
      const updatedLinkData: LinkData = {
        ...linkData,
        metadata: upload.cid,
      };

      // Update the ipfsLinkData with the corrected linkData
      const finalIpfsLinkData: IPFSLinkData = {
        ...ipfsLinkData,
        linkData: updatedLinkData,
      };

      // Convert to PaymentLink format for frontend use
      const paymentLink = await this.convertToPaymentLink(
        finalIpfsLinkData,
        upload.cid
      );

      return {
        ipfsHash: upload.cid,
        paymentLink,
      };
    } catch (error) {
      console.error("Failed to store payment link to IPFS:", error);
      throw error;
    }
  }

  /**
   * Get all payment links for a creator using Pinata keyvalues
   */
  public static async getPaymentLinksByCreator(
    creatorAddress: Address
  ): Promise<PaymentLink[]> {
    try {
      // Use Pinata's file listing with keyvalues filter
      const files = await api.get(`/api/v1/payment-links/${creatorAddress}`) as { data: Array<{ cid: string }> };

      const links: PaymentLink[] = [];

      // Fetch each file and convert to PaymentLink
      for (const file of files.data) {
        try {
          const ipfsLinkData = await this.retrieveIPFSLinkData(file.cid);
          const paymentLink = await this.convertToPaymentLink(
            ipfsLinkData,
            file.cid
          );
          links.push(paymentLink);
        } catch (error) {
          console.error(`Failed to fetch link ${file.cid} from IPFS:`, error);
          // Continue with other links
        }
      }

      // Sort by creation date (newest first)
      return links.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (error) {
      console.error("Failed to get payment links by creator:", error);
      return [];
    }
  }

  /**
   * Get a specific payment link by ID
   */
  public static async getPaymentLink(
    linkId: string
  ): Promise<PaymentLink | null> {
    try {
      // Search for the file by linkId keyvalue
      const files = await api.get(`/api/v1/payment-links/details/${linkId}`) as { data: { cid: string } | null };

      // console.log(files);

      if (!files.data) {
        return null;
      }

      // const file = files.data[0];

      // console.log(file);
      const ipfsLinkData = await this.retrieveIPFSLinkData(files.data.cid);
      return await this.convertToPaymentLink(ipfsLinkData, files.data.cid);
    } catch (error) {
      console.error("Failed to retrieve payment link:", error);
      return null;
    }
  }

  /**
   * Update a payment link (creates new version with updated metadata)
   */
  public static async updatePaymentLink(
    linkData: LinkData,
    signature: `0x${string}`,
    metadata: LinkMetadata
  ): Promise<{ ipfsHash: string; paymentLink: PaymentLink }> {
    // For IPFS, updating means creating a new version
    // The old version remains accessible but we track the new one
    return this.storePaymentLink(linkData, signature, metadata);
  }

  /**
   * Delete a payment link (unpin from Pinata)
   */
  public static async deletePaymentLink(
    linkId: string,
    address: string
  ): Promise<boolean> {
    try {
      const deleteFile = await api.delete(
        `/api/v1/payment-links/${address}/delete/${linkId}`
      ) as { error?: unknown; success?: boolean };

      if (deleteFile.error || !deleteFile.success) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to delete payment link:", error);
      return false;
    }
  }

  /**
   * Retrieve complete IPFSLinkData from IPFS
   */
  public static async retrieveIPFSLinkData(
    ipfsHash: string
  ): Promise<IPFSLinkData> {
    try {
      const response = await fetch(`${this.PINATA_GATEWAY}/${ipfsHash}`);

      if (!response.ok) {
        throw new Error(`Failed to retrieve IPFS data: ${response.statusText}`);
      }

      const jsonString = await response.text();

      // Restore BigInt fields in LinkData
      const bigIntFields = [
        "linkData.amount",
        "linkData.expires",
        "linkData.nonce",
      ];
      const data = this.deserializeWithBigInt(jsonString, bigIntFields);

      // Validate the structure
      if (!this.validateIPFSLinkData(data)) {
        throw new Error("Invalid IPFSLinkData structure");
      }

      return data as IPFSLinkData;
    } catch (error) {
      console.error("Failed to retrieve IPFS link data:", error);
      throw error;
    }
  }

  /**
   * Store only metadata to IPFS (for backward compatibility)
   */
  public static async storeMetadata(metadata: LinkMetadata): Promise<string> {
    try {
      // Get signed upload URL from our API
      const urlRequest = await fetch("/api/url");
      if (!urlRequest.ok) {
        throw new Error("Failed to get upload URL");
      }
      const urlResponse = await urlRequest.json() as { url: string };

      // Create a JSON file from the metadata
      const jsonContent = this.serializeWithBigInt(metadata);
      const file = new File(
        [jsonContent],
        `relynk-metadata-${metadata.title}.json`,
        {
          type: "application/json",
        }
      );

      // Upload using the signed URL
      const upload = await pinata.upload.public
        .file(file)
        .keyvalues({
          type: "metadata",
          title: metadata.title,
          linkType: metadata.linkType.toString(),
          createdAt: Date.now().toString(),
        })
        .url(urlResponse.url);

      if (!upload.cid) {
        throw new Error("No IPFS hash returned from upload");
      }

      return upload.cid;
    } catch (error) {
      console.error("Failed to store metadata to IPFS:", error);
      throw error;
    }
  }

  /**
   * Retrieve only metadata from IPFS
   */
  public static async retrieveMetadata(
    ipfsHash: string
  ): Promise<LinkMetadata> {
    try {
      const response = await fetch(`${this.PINATA_GATEWAY}/${ipfsHash}`);

      if (!response.ok) {
        throw new Error(`Failed to retrieve metadata: ${response.statusText}`);
      }

      const metadata = await response.json();

      // Basic validation
      if (!metadata.linkType || !metadata.title) {
        throw new Error("Invalid metadata structure");
      }

      return metadata as LinkMetadata;
    } catch (error) {
      console.error("Failed to retrieve metadata:", error);
      throw error;
    }
  }

  /**
   * Convert IPFSLinkData to PaymentLink format for frontend use
   */
  private static async convertToPaymentLink(
    ipfsLinkData: IPFSLinkData,
    ipfsHash: string
  ): Promise<PaymentLink> {
    const { linkData, metadata, signature } = ipfsLinkData;

    // Get token symbol from SUPPORTED_TOKENS configuration
    const getTokenSymbol = (tokenAddress: Address): string => {
      const token = SUPPORTED_TOKENS_ARRAY.find(
        t => t.address.toLowerCase() === tokenAddress.toLowerCase()
      );
      return token?.symbol || "UNKNOWN";
    };

    // Get token decimals for proper formatting
    const getTokenDecimals = (symbol: string): number => {
      const token = SUPPORTED_TOKENS_ARRAY.find(t => t.symbol === symbol);
      return token?.decimals || 18; // Default to 18 decimals for ETH and unknown tokens
    };

    const tokenSymbol = getTokenSymbol(linkData.token);
    const decimals = getTokenDecimals(tokenSymbol);
    const formattedAmount = (
      Number(linkData.amount) / Math.pow(10, decimals)
    ).toString();

    return {
      id: linkData.linkId,
      title: metadata.title,
      description: metadata.description,
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
      createdAt: new Date(ipfsLinkData.createdAt),
      updatedAt: new Date(ipfsLinkData.updatedAt),
      metadata,
      ipfsHash,
      signature,
      originalLinkData: linkData, // Store the original linkData with correct nonce
      isExpired: Number(linkData.expires) * 1000 <= Date.now(),
      formattedAmount: `${formattedAmount} ${tokenSymbol}`,
      shortId: linkData.linkId.slice(0, 8),
      previewImage: this.extractPreviewImage(metadata),
    };
  }

  /**
   * Extract preview image from metadata
   */
  private static extractPreviewImage(
    metadata: LinkMetadata
  ): string | undefined {
    switch (metadata.linkType) {
      case 2: // PRODUCT
        const productImages = (metadata as unknown as Record<string, unknown>).images as string[] | undefined;
        return productImages?.[0];
      case 3: // CONTENT
        const previewContent = (metadata as unknown as Record<string, unknown>).previewContent as Record<string, unknown> | undefined;
        const contentImages = previewContent?.images as string[] | undefined;
        return contentImages?.[0];
      default:
        return undefined;
    }
  }

  /**
   * Validate IPFSLinkData structure
   */
  private static validateIPFSLinkData(data: unknown): boolean {
    try {
      const obj = data as Record<string, unknown>;
      const linkData = obj.linkData as Record<string, unknown>;
      const metadata = obj.metadata as Record<string, unknown>;
      
      return Boolean(
        data &&
        typeof data === "object" &&
        obj.linkData &&
        obj.signature &&
        obj.metadata &&
        obj.version &&
        typeof obj.createdAt === "number" &&
        typeof obj.updatedAt === "number" &&
        // Validate linkData structure
        linkData.linkId &&
        linkData.creator &&
        typeof linkData.linkType === "number" &&
        typeof linkData.amountType === "number" &&
        typeof linkData.usageType === "number" &&
        // Validate metadata structure
        metadata.title &&
        typeof metadata.linkType === "number"
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a fallback metadata string for backward compatibility
   */
  public static createFallbackMetadataString(
    title: string,
    description: string,
    redirectUrl?: string,
    successMessage?: string,
    tags?: string[],
    category?: string
  ): string {
    const fallbackMetadata = {
      title,
      description,
      redirectUrl,
      successMessage,
      tags: tags || [],
      category,
      _isFallback: true,
    };
    return JSON.stringify(fallbackMetadata);
  }

  /**
   * Check if metadata string is a fallback format
   */
  public static isFallbackMetadata(metadataString: string): boolean {
    try {
      const parsed = JSON.parse(metadataString);
      return parsed._isFallback === true;
    } catch (error) {
      return false;
    }
  }
}
