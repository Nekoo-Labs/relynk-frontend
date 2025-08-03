import { LinkData, LinkMetadata, IPFSLinkData } from "@/types/relynk";
import { pinata } from "./pinata";

/**
 * IPFS Metadata Service for storing and retrieving link metadata
 * This service handles the proper structure defined in IPFSLinkData
 * Updated to follow Pinata best practices with client-side uploads using signed URLs
 */
export class IPFSMetadataService {
  /**
   * Helper function to serialize objects with BigInt values
   */
  private static serializeWithBigInt(obj: any): string {
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
  ): any {
    const obj = JSON.parse(jsonString);

    // Recursively restore BigInt fields
    const restoreBigInts = (target: any, path: string[] = []): any => {
      if (typeof target === "object" && target !== null) {
        for (const [key, value] of Object.entries(target)) {
          const currentPath = [...path, key];
          const fieldPath = currentPath.join(".");

          if (bigIntFields.includes(fieldPath) && typeof value === "string") {
            target[key] = BigInt(value);
          } else if (typeof value === "object") {
            restoreBigInts(value, currentPath);
          }
        }
      }
      return target;
    };

    return restoreBigInts(obj);
  }

  private static readonly PINATA_GATEWAY = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs`;

  /**
   * Stores complete link data (LinkData + metadata + signature) to IPFS
   * Uses client-side upload with signed URLs following Pinata best practices
   */
  public static async storeIPFSLinkData(
    linkData: LinkData,
    signature: `0x${string}`,
    metadata: LinkMetadata
  ): Promise<string> {
    try {
      const ipfsLinkData: IPFSLinkData = {
        linkData,
        signature,
        metadata,
        version: "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Get signed upload URL from our API
      const urlRequest = await fetch("/api/url");
      if (!urlRequest.ok) {
        throw new Error("Failed to get upload URL");
      }
      const urlResponse = await urlRequest.json();

      // Create a JSON file from the data
      const jsonContent = this.serializeWithBigInt(ipfsLinkData);
      const file = new File([jsonContent], `relynk-${linkData.linkId}.json`, {
        type: "application/json",
      });

      // Upload using Pinata SDK with signed URL (safe for client-side)
      const upload = await pinata.upload.public
        .file(file)
        .url(urlResponse.url);

      if (!upload.cid) {
        throw new Error("No IPFS hash returned from upload");
      }

      return upload.cid;
    } catch (error) {
      console.error("Failed to store link data to IPFS:", error);
      throw error;
    }
  }

  /**
   * Stores only metadata to IPFS and returns the hash
   * Uses client-side upload with signed URLs following Pinata best practices
   */
  public static async storeMetadata(metadata: LinkMetadata): Promise<string> {
    try {
      // Get signed upload URL from our API
      const urlRequest = await fetch("/api/url");
      if (!urlRequest.ok) {
        throw new Error("Failed to get upload URL");
      }
      const urlResponse = await urlRequest.json();

      // Create a JSON file from the metadata
      const jsonContent = this.serializeWithBigInt(metadata);
      const file = new File([jsonContent], `relynk-metadata-${metadata.title}.json`, {
        type: "application/json",
      });

      // Upload using Pinata SDK with signed URL (safe for client-side)
      const upload = await pinata.upload.public
        .file(file)
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
   * Retrieves complete IPFSLinkData from IPFS
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
   * Retrieves only metadata from IPFS
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
   * Validates IPFSLinkData structure
   */
  private static validateIPFSLinkData(data: any): boolean {
    try {
      return (
        data &&
        typeof data === "object" &&
        data.linkData &&
        data.signature &&
        data.metadata &&
        data.version &&
        typeof data.createdAt === "number" &&
        typeof data.updatedAt === "number" &&
        // Validate linkData structure
        data.linkData.linkId &&
        data.linkData.creator &&
        typeof data.linkData.linkType === "number" &&
        typeof data.linkData.amountType === "number" &&
        typeof data.linkData.usageType === "number" &&
        // Validate metadata structure
        data.metadata.title &&
        typeof data.metadata.linkType === "number"
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Creates a fallback metadata hash for backward compatibility
   * This is used when we need to store simple metadata as a string
   */
  public static createFallbackMetadataString(
    title: string,
    description: string,
    redirectUrl?: string,
    successMessage?: string,
    tags?: string[],
    category?: string
  ): string {
    return JSON.stringify({
      title,
      description,
      redirectUrl,
      successMessage,
      tags: tags || [],
      category,
      // Mark as fallback for future migration
      _fallback: true,
      _version: "0.1.0",
    });
  }

  /**
   * Checks if metadata string is a fallback format
   */
  public static isFallbackMetadata(metadataString: string): boolean {
    try {
      const parsed = JSON.parse(metadataString);
      return parsed._fallback === true;
    } catch {
      return false;
    }
  }
}
