import {
  LinkType,
  CreateLinkFormData,
  LinkMetadata,
  PaymentMetadata,
  DonationMetadata,
  ProductMetadata,
  ContentMetadata,
  BaseMetadata,
} from "@/types/relynk";
import { ImageUploadService } from "@/lib/image-upload";

/**
 * Creates properly structured metadata for different link types
 * according to the type definitions in relynk.ts
 */
export class MetadataCreator {
  /**
   * Creates the base metadata structure common to all link types
   */
  private static async createBaseMetadata(
    formData: CreateLinkFormData,
    chainId?: number,
    tokenSymbol?: string,
    tokenDecimals?: number
  ): Promise<BaseMetadata> {
    return {
      title: formData.title,
      description: formData.description || "",
      category: formData.category,
      tags: formData.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      creatorInfo: {
        // These could be populated from user profile in the future
        name: undefined,
        avatar: undefined,
        bio: undefined,
      },
      // Network information for cross-chain compatibility
      originalChainId: chainId,
      tokenSymbol: tokenSymbol,
      tokenDecimals: tokenDecimals,
    };
  }

  /**
   * Creates payment-specific metadata
   */
  private static createPaymentMetadata(
    baseMetadata: BaseMetadata,
    formData: CreateLinkFormData
  ): PaymentMetadata {
    return {
      ...baseMetadata,
      linkType: LinkType.PAYMENT,
      invoiceNumber: formData.paymentDetails?.invoiceNumber,
      serviceName: formData.paymentDetails?.serviceName || formData.title,
      dueDate: formData.paymentDetails?.dueDate,
      terms: formData.paymentDetails?.terms,
      redirectUrl: formData.redirectUrl,
      contentUrl: formData.redirectUrl, // Map redirectUrl to contentUrl for content access
      successMessage:
        formData.successMessage || "Payment completed successfully!",
      customFields: formData.paymentDetails?.customFields || {},
    };
  }

  /**
   * Creates donation-specific metadata
   */
  private static async createDonationMetadata(
    baseMetadata: BaseMetadata,
    formData: CreateLinkFormData
  ): Promise<DonationMetadata> {
    // Handle images - either use existing IPFS hashes or upload new files
    let imageHashes: string[] = [];
    if (formData.donationDetails?.images) {
      // If donationDetails has images, they should already be IPFS hashes
      imageHashes = formData.donationDetails.images;
    } else if (formData.images) {
      // Upload new image files to IPFS
      imageHashes = await Promise.all(
        formData.images.map((file) => ImageUploadService.uploadImage(file))
      );
    }

    return {
      ...baseMetadata,
      linkType: LinkType.DONATION,
      cause: formData.donationDetails?.cause || formData.title,
      goalAmount: formData.donationDetails?.goalAmount,
      currentAmount: formData.donationDetails?.currentAmount || "0",
      donorCount: formData.donationDetails?.donorCount || 0,
      images: imageHashes,
      video: formData.donationDetails?.video,
      updates: formData.donationDetails?.updates || [],
      socialLinks: formData.donationDetails?.socialLinks || {},
    };
  }

  /**
   * Creates product-specific metadata
   */
  private static async createProductMetadata(
    baseMetadata: BaseMetadata,
    formData: CreateLinkFormData
  ): Promise<ProductMetadata> {
    // Handle images - either use existing IPFS hashes or upload new files
    let imageHashes: string[] = [];
    if (formData.productDetails?.images) {
      // If productDetails has images, they should already be IPFS hashes
      imageHashes = formData.productDetails.images;
    } else if (formData.images) {
      // Upload new image files to IPFS
      imageHashes = await Promise.all(
        formData.images.map((file) => ImageUploadService.uploadImage(file))
      );
    }

    return {
      ...baseMetadata,
      linkType: LinkType.PRODUCT,
      productName: formData.productDetails?.productName || formData.title,
      brand: formData.productDetails?.brand,
      sku: formData.productDetails?.sku,
      images: imageHashes,
      videos: formData.productDetails?.videos || [],
      specifications: formData.productDetails?.specifications || {},
      variants: formData.variants || [],
      shipping: {
        required: formData.shippingInfo?.required ?? false,
        weight: formData.shippingInfo?.weight,
        dimensions: formData.shippingInfo?.dimensions,
        freeShipping: formData.shippingInfo?.freeShipping ?? true,
        estimatedDays: formData.shippingInfo?.estimatedDays,
        shippingCost: formData.shippingInfo?.shippingCost,
        shippingRegions: formData.shippingInfo?.shippingRegions,
      },
      digitalDelivery: formData.isDigitalDelivery || false,
      files: formData.isDigitalDelivery ? [
        {
          name: formData.title || "Digital Product",
          type: "application/octet-stream",
          url: formData.redirectUrl, // Use redirectUrl as file access URL
        }
      ] : undefined,
      downloadInstructions: formData.productDetails?.downloadInstructions,
      returnPolicy: formData.productDetails?.returnPolicy,
      warranty: formData.productDetails?.warranty,
      reviews: formData.productDetails?.reviews || [],
    };
  }

  /**
   * Creates content-specific metadata
   */
  private static async createContentMetadata(
    baseMetadata: BaseMetadata,
    formData: CreateLinkFormData
  ): Promise<ContentMetadata> {
    // Handle preview images - either use existing IPFS hashes or upload new files
    let previewImageHashes: string[] = [];
    if (formData.contentDetails?.previewContent?.images) {
      // If contentDetails has preview images, they should already be IPFS hashes
      previewImageHashes = formData.contentDetails.previewContent.images;
    } else if (formData.images) {
      // Upload new image files to IPFS
      previewImageHashes = await Promise.all(
        formData.images.map((file) => ImageUploadService.uploadImage(file))
      );
    }

    return {
      ...baseMetadata,
      linkType: LinkType.CONTENT,
      contentType: formData.contentDetails?.contentType || "other",
      previewContent: {
        images: previewImageHashes,
        video: formData.contentDetails?.previewContent?.video,
        audio: formData.contentDetails?.previewContent?.audio,
        samplePages: formData.contentDetails?.previewContent?.samplePages || [],
        description: formData.description || "",
      },
      contentDetails: {
        duration: formData.contentDetails?.contentDetails?.duration,
        pageCount: formData.contentDetails?.contentDetails?.pageCount,
        fileSize: formData.contentDetails?.contentDetails?.fileSize,
        format: formData.contentDetails?.contentDetails?.format,
        language:
          formData.contentDetails?.contentDetails?.language || "English",
        level: formData.contentDetails?.contentDetails?.level || "beginner",
        includes: formData.contentDetails?.contentDetails?.includes || [],
      },
      deliveryMethod:
        formData.contentDetails?.deliveryMethod || "encrypted_ipfs",
      encryptedContent: formData.contentDetails?.encryptedContent,
      contentUrl: formData.redirectUrl, // Map redirectUrl to contentUrl for content access
      accessInstructions: formData.contentDetails?.accessInstructions,
      prerequisites: formData.contentDetails?.prerequisites || [],
      learningOutcomes: formData.contentDetails?.learningOutcomes || [],
      syllabus: formData.syllabus || [],
    };
  }

  /**
   * Creates the appropriate metadata structure based on link type
   */
  public static async createMetadata(
    formData: CreateLinkFormData,
    chainId?: number,
    tokenSymbol?: string,
    tokenDecimals?: number
  ): Promise<LinkMetadata> {
    const baseMetadata = await this.createBaseMetadata(formData, chainId, tokenSymbol, tokenDecimals);

    switch (formData.linkType) {
      case LinkType.PAYMENT:
        return this.createPaymentMetadata(baseMetadata, formData);

      case LinkType.DONATION:
        return this.createDonationMetadata(baseMetadata, formData);

      case LinkType.PRODUCT:
        return this.createProductMetadata(baseMetadata, formData);

      case LinkType.CONTENT:
        return this.createContentMetadata(baseMetadata, formData);

      default:
        throw new Error(`Unsupported link type: ${formData.linkType}`);
    }
  }

  /**
   * Validates that the metadata structure is correct for the given link type
   */
  public static validateMetadata(metadata: LinkMetadata): boolean {
    try {
      // Basic validation - ensure required fields are present
      if (!metadata.title || !metadata.linkType) {
        return false;
      }

      // Type-specific validation
      switch (metadata.linkType as LinkType) {
        case LinkType.PAYMENT:
          return true; // Payment metadata only needs basic fields

        case LinkType.DONATION:
          return "cause" in metadata;

        case LinkType.PRODUCT:
          return "productName" in metadata && "shipping" in metadata;

        case LinkType.CONTENT:
          return "contentType" in metadata && "previewContent" in metadata;

        default:
          return false;
      }
    } catch (error) {
      console.error("Metadata validation error:", error);
      return false;
    }
  }
}
