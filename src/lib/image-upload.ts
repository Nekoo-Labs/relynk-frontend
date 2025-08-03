import { pinata } from "./pinata";

/**
 * Image Upload Service using Pinata IPFS
 * Handles image uploads for payment links with deferred upload strategy
 */
export class ImageUploadService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  /**
   * Prepare image for upload (validation + preview only)
   * This doesn't upload to IPFS yet to prevent storage bloat
   * @param file The image file to prepare
   * @returns Promise<{preview: string, file: File}> Preview URL and file reference
   */
  static async prepareImage(
    file: File
  ): Promise<{ preview: string; file: File }> {
    // Validate file
    this.validateFile(file);

    // Create preview URL
    const preview = this.createPreviewUrl(file);

    return { preview, file };
  }

  /**
   * Upload an image to IPFS (called only when link is actually being created)
   * @param file The image file to upload
   * @returns Promise<string> The IPFS hash of the uploaded image
   */
  static async uploadImage(file: File): Promise<string> {
    // Validate file again for safety
    this.validateFile(file);

    try {
      // Get signed upload URL from our API (following docs pattern)
      const urlRequest = await fetch("/api/url");
      if (!urlRequest.ok) {
        throw new Error("Failed to get upload URL");
      }
      const urlResponse = await urlRequest.json();

      // Upload using Pinata SDK with signed URL (safe for client-side)
      const upload = await pinata.upload.public
        .file(file)
        .url(urlResponse.url);

      if (!upload.cid) {
        console.error("No IPFS hash in response:", upload);
        throw new Error("No IPFS hash returned from upload");
      }

      return upload.cid;
    } catch (error) {
      console.error("Failed to upload image to IPFS:", error);
      throw new Error(
        `Failed to upload image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get the full IPFS URL for an image hash
   * @param ipfsHash The IPFS hash
   * @returns string The full IPFS URL
   */
  static getImageUrl(ipfsHash: string): string {
    return `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${ipfsHash}`;
  }

  /**
   * Validate the uploaded file
   * @param file The file to validate
   */
  private static validateFile(file: File): void {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error("File size must be less than 5MB");
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error("File must be an image (JPEG, PNG, GIF, or WebP)");
    }
  }

  /**
   * Create a preview URL for a file
   * @param file The file to create a preview for
   * @returns string The preview URL
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke a preview URL to free memory
   * @param url The preview URL to revoke
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
