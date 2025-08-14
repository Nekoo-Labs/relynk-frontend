import { z } from "zod";
import { LinkType, AmountType, UsageType } from "@/types/relynk";


// Zod schema for link creation form that aligns with smart contract types
export const linkFormSchema = z
  .object({
    // Basic link information
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be less than 100 characters")
      .trim(),

    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),

    // Custom slug for the link
    customSlug: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true; // Optional field
        return /^[a-z0-9_-]+$/.test(val);
      }, "Slug must contain only lowercase letters, numbers, hyphens, and underscores")
      .refine((val) => {
        if (!val) return true; // Optional field
        return val.length >= 3 && val.length <= 50;
      }, "Slug must be between 3 and 50 characters")
      .refine((val) => {
        if (!val) return true; // Optional field
        const reservedSlugs = ["api", "admin", "dashboard", "pay", "payment", "link", "links", "user", "users", "profile", "profiles"];
        return !reservedSlugs.includes(val.toLowerCase());
      }, "This slug is reserved and cannot be used"),

    // Link type selection
    linkType: z.nativeEnum(LinkType, {
      errorMap: () => ({ message: "Please select a valid link type" }),
    }),

    // Amount configuration
    amountType: z.nativeEnum(AmountType, {
      errorMap: () => ({ message: "Please select a valid amount type" }),
    }),

    usageType: z.nativeEnum(UsageType, {
      errorMap: () => ({ message: "Please select a valid usage type" }),
    }),

    // Amount validation - conditional based on link type
    amount: z
      .string()
      .refine((val) => {
        if (!val) return false;
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      }, "Amount must be a positive number")
      .transform((val) => val.toString()),

    // Token selection
    currency: z
      .string()
      .min(1, "Please select a currency")
      .refine((val) => ["USDC", "USDT", "IDRX"].includes(val), {
        message: "Please select a supported currency",
      }),

    // Expiry configuration
    expiryDate: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true; // Optional field
        const date = new Date(val);
        return date > new Date();
      }, "Expiry date must be in the future"),

    expiresIn: z
      .number()
      .min(1, "Expiry must be at least 1 hour")
      .max(8760, "Expiry cannot exceed 1 year"), // 365 * 24 hours

    // Optional fields
    redirectUrl: z
      .string()
      .url("Please enter a valid URL")
      .optional()
      .or(z.literal("")),

    successMessage: z
      .string()
      .max(200, "Success message must be less than 200 characters")
      .optional(),

    maxUses: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true; // Optional field
        const num = parseInt(val);
        return !isNaN(num) && num > 0;
      }, "Max uses must be a positive number"),

    // Metadata
    tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),

    category: z.string().optional(),
  })
  .refine(
    (data) => {
      // For donation links, amount can be 0 (minimum amount)
      if (data.linkType === LinkType.DONATION) {
        return true;
      }
      // For other link types, amount must be greater than 0
      return parseFloat(data.amount) > 0;
    },
    {
      message: "Amount must be greater than 0 for payment and product links",
      path: ["amount"],
    }
  )
  .refine(
    (data) => {
      // Product links should have a redirect URL
      if (data.linkType === LinkType.PRODUCT && !data.redirectUrl) {
        return false;
      }
      return true;
    },
    {
      message: "Product links require a redirect URL",
      path: ["redirectUrl"],
    }
  );

// Type inference from the schema
export type LinkFormData = z.infer<typeof linkFormSchema>;

// Schema for the enhanced form UI (before transformation)
export const linkFormUISchema = z
  .object({
    title: z.string().min(1, "Title is required").max(100, "Title too long"),
    description: z.string().max(500, "Description too long").optional(),
    customSlug: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true; // Optional field
        // Slug validation: only lowercase letters, numbers, and hyphens
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        return slugRegex.test(val);
      }, "Slug must contain only lowercase letters, numbers, and hyphens")
      .refine((val) => {
        if (!val) return true;
        return val.length >= 3 && val.length <= 50;
      }, "Slug must be between 3 and 50 characters")
      .refine((val) => {
        if (!val) return true;
        // Prevent reserved words
        const reserved = ['api', 'admin', 'dashboard', 'pay', 'payment', 'www', 'app', 'help', 'support'];
        return !reserved.includes(val.toLowerCase());
      }, "This slug is reserved and cannot be used"),
    linkType: z.enum(["payment", "donation", "product", "content"], {
      errorMap: () => ({ message: "Please select a link type" }),
    }),
    amountType: z
      .enum(["fixed", "dynamic"], {
        errorMap: () => ({ message: "Please select an amount type" }),
      })
      .optional(),
    usageType: z
      .enum(["one_time", "reusable"], {
        errorMap: () => ({ message: "Please select a usage type" }),
      })
      .optional(),
    amount: z.string().refine((val) => {
      if (!val) return false;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, "Please enter a valid amount"),
    currency: z.enum(["USDC", "USDT", "IDRX"], {
      errorMap: () => ({ message: "Please select a currency" }),
    }),
    expiryDate: z.string().optional(),
    maxUses: z.string().optional(),
    targetUrl: z.string().optional(),
    image: z.string().optional(), // IPFS hash for uploaded image

    // Enhanced metadata fields for different link types
    category: z.string().optional(),
    tags: z.string().optional(), // Comma-separated tags

    // Payment-specific fields
    invoiceNumber: z.string().optional(),
    serviceName: z.string().optional(),

    // Donation-specific fields
    cause: z.string().optional(),
    goalAmount: z.string().optional(),

    // Product-specific fields
    productName: z.string().optional(),
    brand: z.string().optional(),
    sku: z.string().optional(),
    weight: z.string().optional(),
    shippingRequired: z.boolean().optional(),

    // Content-specific fields
    contentType: z
      .enum([
        "video",
        "audio",
        "document",
        "course",
        "ebook",
        "software",
        "template",
        "other",
      ])
      .optional(),
    duration: z.string().optional(), // For video/audio content
    language: z.string().optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  })
  .refine(
    (data) => {
      // For non-donation links, amount must be greater than 0
      if (data.linkType !== "donation") {
        return parseFloat(data.amount) > 0;
      }
      return true;
    },
    {
      message: "Amount must be greater than 0",
      path: ["amount"],
    }
  )
  .refine(
    (data) => {
      // Product and content links should have a target URL
      if (
        (data.linkType === "product" || data.linkType === "content") &&
        data.targetUrl &&
        !data.targetUrl.startsWith("http")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Please enter a valid URL starting with http:// or https://",
      path: ["targetUrl"],
    }
  );

export type LinkFormUIData = z.infer<typeof linkFormUISchema>;

// Helper function to transform UI data to contract data
export function transformUIDataToContractData(
  uiData: LinkFormUIData,
  _tokenAddress: `0x${string}`
): Omit<LinkFormData, "expiresIn"> & { expiresIn: number } {
  const linkTypeMap = {
    payment: LinkType.PAYMENT,
    donation: LinkType.DONATION,
    product: LinkType.PRODUCT,
    content: LinkType.CONTENT,
  };

  // Use user-selected amountType or default based on linkType
  const getAmountType = () => {
    if (uiData.amountType) {
      const amountTypeMap = {
        fixed: AmountType.FIXED,
        dynamic: AmountType.DYNAMIC,
      };
      return amountTypeMap[uiData.amountType];
    }

    // Default amount types based on link type
    const defaultAmountTypeMap = {
      payment: AmountType.FIXED,
      donation: AmountType.DYNAMIC, // Donations allow custom amounts
      product: AmountType.FIXED,
      content: AmountType.FIXED,
    };
    return defaultAmountTypeMap[uiData.linkType];
  };

  // Use user-selected usageType or default based on linkType
  const getUsageType = () => {
    if (uiData.usageType) {
      const usageTypeMap = {
        one_time: UsageType.ONE_TIME,
        reusable: UsageType.REUSABLE,
      };
      return usageTypeMap[uiData.usageType];
    }

    // Default usage types based on link type
    const defaultUsageTypeMap = {
      payment: UsageType.ONE_TIME,
      donation: UsageType.REUSABLE,
      product: UsageType.REUSABLE,
      content: UsageType.REUSABLE,
    };
    return defaultUsageTypeMap[uiData.linkType];
  };

  const expiresIn = uiData.expiryDate
    ? Math.floor(
        (new Date(uiData.expiryDate).getTime() - Date.now()) / (1000 * 3600)
      )
    : 168; // Default 7 days

  // Parse tags from comma-separated string
  const parsedTags = uiData.tags
    ? uiData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    : [uiData.linkType];

  return {
    title: uiData.title,
    description: uiData.description || "",
    customSlug: uiData.customSlug, // Include custom slug
    linkType: linkTypeMap[uiData.linkType],
    amountType: getAmountType(),
    usageType: getUsageType(),
    amount: uiData.amount,
    currency: uiData.currency,
    expiresIn: Math.max(1, expiresIn), // Ensure at least 1 hour
    redirectUrl: uiData.targetUrl || undefined,
    successMessage: `Payment successful! Thank you for your ${uiData.linkType}.`,
    maxUses: uiData.maxUses,
    tags: parsedTags,
    category: uiData.category || uiData.linkType,
  };
}
