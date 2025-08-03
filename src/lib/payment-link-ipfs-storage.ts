import { PaymentLink } from "@/types/relynk";

/**
 * Payment Link Storage Service using Pinata IPFS
 * Stores payment links on IPFS for decentralized storage
 */
export class PaymentLinkIPFSStorage {
  private static readonly LINKS_INDEX_KEY = "payment-links-index";

  /**
   * Store a payment link on IPFS
   * @param paymentLink The payment link to store
   * @returns Promise<string> The IPFS hash of the stored link
   */
  static async storePaymentLink(paymentLink: PaymentLink): Promise<string> {
    try {
      // Get signed upload URL from our API
      const urlRequest = await fetch("/api/v1/upload");
      if (!urlRequest.ok) {
        throw new Error("Failed to get upload URL");
      }
      const urlResponse = await urlRequest.json();

      // Convert payment link to JSON blob
      const jsonBlob = new Blob([JSON.stringify(paymentLink)], {
        type: "application/json",
      });

      // Create a File object from the blob
      const file = new File([jsonBlob], `payment-link-${paymentLink.id}.json`, {
        type: "application/json",
      });

      // Upload using the signed URL
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(urlResponse.url, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.json();
      const ipfsHash = uploadResult.IpfsHash;

      // Update the index with the new link
      await this.updateLinksIndex(
        paymentLink.creator,
        paymentLink.id,
        ipfsHash
      );

      return ipfsHash;
    } catch (error) {
      console.error("Failed to store payment link on IPFS:", error);
      throw new Error("Failed to store payment link");
    }
  }

  /**
   * Retrieve a payment link from IPFS
   * @param linkId The ID of the payment link
   * @returns Promise<PaymentLink | null> The payment link or null if not found
   */
  static async getPaymentLink(linkId: string): Promise<PaymentLink | null> {
    try {
      // Get the IPFS hash from the index
      const ipfsHash = await this.getIpfsHashFromIndex(linkId);
      if (!ipfsHash) {
        return null;
      }

      // Fetch directly from IPFS gateway
      const response = await fetch(
        `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${ipfsHash}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
      }

      const data = await response.json();

      // Convert date strings back to Date objects
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        expires: new Date(data.expires),
      } as PaymentLink;
    } catch (error) {
      console.error("Failed to retrieve payment link from IPFS:", error);
      return null;
    }
  }

  /**
   * Get all payment links for a creator
   * @param creatorAddress The creator's wallet address
   * @returns Promise<PaymentLink[]> Array of payment links
   */
  static async getPaymentLinksByCreator(
    creatorAddress: string
  ): Promise<PaymentLink[]> {
    try {
      const index = await this.getLinksIndex(creatorAddress);

      console.log(index);
      const links: PaymentLink[] = [];

      // Fetch each link from IPFS directly
      for (const [linkId, ipfsHash] of Object.entries(index)) {
        try {
          const response = await fetch(
            `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${ipfsHash}`
          );
          if (response.ok) {
            const data = await response.json();
            links.push({
              ...data,
              createdAt: new Date(data.createdAt),
              expires: new Date(data.expires),
            } as PaymentLink);
          }
        } catch (error) {
          console.error(`Failed to fetch link ${linkId} from IPFS:`, error);
          // Continue with other links
        }
      }

      return links.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (error) {
      console.error("Failed to get payment links by creator:", error);
      return [];
    }
  }

  /**
   * Update a payment link on IPFS
   * @param paymentLink The updated payment link
   * @returns Promise<string> The new IPFS hash
   */
  static async updatePaymentLink(paymentLink: PaymentLink): Promise<string> {
    // For IPFS, updating means creating a new version
    return this.storePaymentLink(paymentLink);
  }

  /**
   * Delete a payment link (remove from index)
   * @param linkId The ID of the payment link to delete
   * @param creatorAddress The creator's wallet address
   * @returns Promise<boolean> Success status
   */
  static async deletePaymentLink(
    linkId: string,
    creatorAddress: string
  ): Promise<boolean> {
    try {
      const index = await this.getLinksIndex(creatorAddress);
      delete index[linkId];
      await this.saveLinksIndex(creatorAddress, index);
      return true;
    } catch (error) {
      console.error("Failed to delete payment link:", error);
      return false;
    }
  }

  /**
   * Get the links index for a creator from localStorage (fallback)
   * @param creatorAddress The creator's wallet address
   * @returns Promise<Record<string, string>> Index mapping linkId to IPFS hash
   */
  private static async getLinksIndex(
    creatorAddress: string
  ): Promise<Record<string, string>> {
    try {
      // For now, we'll use localStorage as a fallback for the index
      // In a full production setup, you might want to store this on-chain or use a different approach
      const indexKey = `${this.LINKS_INDEX_KEY}-${creatorAddress}`;

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(indexKey);
        return stored ? JSON.parse(stored) : {};
      }

      return {};
    } catch (error) {
      console.error("Failed to get links index:", error);
      return {};
    }
  }

  /**
   * Save the links index for a creator
   * @param creatorAddress The creator's wallet address
   * @param index The index to save
   */
  private static async saveLinksIndex(
    creatorAddress: string,
    index: Record<string, string>
  ): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        const indexKey = `${this.LINKS_INDEX_KEY}-${creatorAddress}`;
        localStorage.setItem(indexKey, JSON.stringify(index));
      }
    } catch (error) {
      console.error("Failed to save links index:", error);
      throw error;
    }
  }

  /**
   * Update the links index with a new payment link
   * @param creatorAddress The creator's wallet address
   * @param linkId The payment link ID
   * @param ipfsHash The IPFS hash of the stored link
   */
  private static async updateLinksIndex(
    creatorAddress: string,
    linkId: string,
    ipfsHash: string
  ): Promise<void> {
    const index = await this.getLinksIndex(creatorAddress);
    index[linkId] = ipfsHash;
    await this.saveLinksIndex(creatorAddress, index);
  }

  /**
   * Get IPFS hash for a specific link ID
   * @param linkId The payment link ID
   * @returns Promise<string | null> The IPFS hash or null if not found
   */
  private static async getIpfsHashFromIndex(
    linkId: string
  ): Promise<string | null> {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      // We need to search through all creator indices to find the link
      const allKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(this.LINKS_INDEX_KEY)
      );

      for (const key of allKeys) {
        const index = JSON.parse(localStorage.getItem(key) || "{}");
        if (index[linkId]) {
          return index[linkId];
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to get IPFS hash from index:", error);
      return null;
    }
  }
}
