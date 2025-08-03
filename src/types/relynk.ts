import { Address } from "viem";

// ============================================================================
// ENUMS - Match your smart contract exactly
// ============================================================================

export enum LinkType {
  PAYMENT = 0,
  DONATION = 1,
  PRODUCT = 2,
  CONTENT = 3,
}

export enum AmountType {
  FIXED = 0,
  DYNAMIC = 1,
}

export enum UsageType {
  ONE_TIME = 0,
  REUSABLE = 1,
}

// ============================================================================
// CORE SMART CONTRACT INTERFACES
// ============================================================================

export interface LinkData {
  linkId: string;
  creator: Address;
  linkType: LinkType;
  amountType: AmountType;
  usageType: UsageType;
  amount: bigint;
  token: Address;
  expires: bigint;
  metadata: string; // IPFS hash containing full metadata
  nonce: bigint;
}

// ============================================================================
// IPFS METADATA STRUCTURES (stored off-chain)
// ============================================================================

export interface BaseMetadata {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  creatorInfo?: {
    name?: string;
    avatar?: string;
    bio?: string;
  };
}

export interface PaymentMetadata extends BaseMetadata {
  linkType: LinkType.PAYMENT;
  invoiceNumber?: string;
  serviceName?: string;
  dueDate?: number;
  terms?: string;
  redirectUrl?: string;
  successMessage?: string;
  customFields?: Record<string, string>;
}

export interface DonationMetadata extends BaseMetadata {
  linkType: LinkType.DONATION;
  cause: string;
  goalAmount?: string;
  currentAmount?: string;
  donorCount?: number;
  images?: string[]; // IPFS hashes
  video?: string; // IPFS hash
  updates?: DonationUpdate[];
  socialLinks?: {
    website?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface DonationUpdate {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  image?: string;
}

export interface ProductMetadata extends BaseMetadata {
  linkType: LinkType.PRODUCT;
  productName: string;
  brand?: string;
  sku?: string;
  images: string[]; // Array of IPFS hashes
  videos?: string[]; // Array of IPFS hashes
  specifications: Record<string, string>;
  variants?: ProductVariant[];
  shipping: ShippingInfo;
  digitalDelivery: boolean;
  downloadInstructions?: string;
  returnPolicy?: string;
  warranty?: string;
  reviews?: ProductReview[];
}

export interface ProductVariant {
  id: string;
  name: string;
  options: Record<string, string>; // e.g., { size: "L", color: "Red" }
  priceModifier: string; // Additional cost (can be negative)
  stock: number;
  image?: string; // IPFS hash
}

export interface ShippingInfo {
  required: boolean;
  weight?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
  freeShipping: boolean;
  estimatedDays?: number;
  shippingCost?: string;
  shippingRegions?: string[];
}

export interface ProductReview {
  id: string;
  reviewer: string; // Anonymous or username
  rating: number; // 1-5
  comment: string;
  timestamp: number;
  verified: boolean;
}

export interface ContentMetadata extends BaseMetadata {
  linkType: LinkType.CONTENT;
  contentType:
    | "video"
    | "audio"
    | "document"
    | "course"
    | "ebook"
    | "software"
    | "template"
    | "other";
  previewContent: {
    images?: string[]; // IPFS hashes
    video?: string; // Trailer/preview video IPFS hash
    audio?: string; // Audio preview IPFS hash
    samplePages?: string[]; // For ebooks/documents
    description: string;
  };
  contentDetails: {
    duration?: number; // For video/audio in seconds
    pageCount?: number; // For documents/ebooks
    fileSize?: number; // In bytes
    format?: string; // mp4, pdf, zip, etc.
    language: string;
    level?: "beginner" | "intermediate" | "advanced";
    includes?: string[]; // What's included in the package
  };
  deliveryMethod: "encrypted_ipfs" | "email" | "download_link" | "access_token";
  encryptedContent?: string; // IPFS hash of encrypted actual content
  accessInstructions?: string;
  prerequisites?: string[];
  learningOutcomes?: string[]; // For courses
  syllabus?: CourseSyllabus[]; // For courses
}

export interface CourseSyllabus {
  moduleNumber: number;
  title: string;
  description: string;
  duration?: number; // in minutes
  lessons?: string[];
}

// Union type for all metadata types
export type LinkMetadata =
  | PaymentMetadata
  | DonationMetadata
  | ProductMetadata
  | ContentMetadata;

// ============================================================================
// IPFS STORED DATA STRUCTURE
// ============================================================================

export interface IPFSLinkData {
  linkData: LinkData;
  signature: `0x${string}`;
  metadata: LinkMetadata;
  version: string; // For schema versioning
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// FRONTEND-FRIENDLY INTERFACES
// ============================================================================

export interface PaymentLink {
  id: string;
  title: string;
  description: string;
  creator: Address;
  linkType: LinkType;
  amountType: AmountType;
  usageType: UsageType;
  amount: string; // Display as formatted string
  token: Address;
  tokenSymbol: string;
  expires: Date;
  isActive: boolean;
  isUsed: boolean; // For ONE_TIME links
  createdAt: Date;
  updatedAt: Date;
  metadata: LinkMetadata;
  ipfsHash: string; // Hash of the stored IPFSLinkData
  signature: `0x${string}`; // Creator's signature for link validation
  originalLinkData: LinkData; // Original linkData that was signed (includes correct nonce)
  // Additional computed fields
  isExpired: boolean;
  formattedAmount: string; // e.g., "10.50 USDC"
  shortId: string; // First 8 chars of linkId for display
  previewImage?: string; // First image from metadata
  // Analytics fields (optional, populated from analytics service)
  clicks?: number;
  views?: number;
}

// ============================================================================
// TRANSACTION INTERFACES
// ============================================================================

export interface PaymentRequest {
  linkData: LinkData;
  signature: `0x${string}`;
  message?: string;
  customAmount?: bigint; // For DYNAMIC amount types
  selectedVariant?: string; // For products with variants
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: `0x${string}`;
  blockNumber?: bigint;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  error?: string;
  errorCode?: PaymentErrorCode;
  accessToken?: string; // For content purchases
  downloadUrl?: string; // For digital products
}

export enum PaymentErrorCode {
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INSUFFICIENT_ALLOWANCE = "INSUFFICIENT_ALLOWANCE",
  LINK_EXPIRED = "LINK_EXPIRED",
  LINK_ALREADY_USED = "LINK_ALREADY_USED",
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
  AMOUNT_TOO_LOW = "AMOUNT_TOO_LOW",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  USER_REJECTED = "USER_REJECTED",
  VARIANT_OUT_OF_STOCK = "VARIANT_OUT_OF_STOCK",
  CONTENT_NOT_AVAILABLE = "CONTENT_NOT_AVAILABLE",
}

// ============================================================================
// CONTRACT EVENT INTERFACES
// ============================================================================

export interface PaymentProcessedEvent {
  linkId: string;
  payer: Address;
  creator: Address;
  linkType: LinkType;
  amount: bigint;
  token: Address;
  timestamp: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface DonationProcessedEvent {
  linkId: string;
  donor: Address;
  creator: Address;
  amount: bigint;
  platformFee: bigint;
  token: Address;
  message: string;
  timestamp: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface ProductPurchasedEvent {
  linkId: string;
  buyer: Address;
  creator: Address;
  amount: bigint;
  token: Address;
  productData: string; // Can include variant info
  timestamp: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

export interface ContentPurchasedEvent {
  linkId: string;
  buyer: Address;
  creator: Address;
  amount: bigint;
  token: Address;
  contentHash: string;
  timestamp: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

// ============================================================================
// FORM INTERFACES FOR LINK CREATION
// ============================================================================

export interface CreateLinkFormData {
  // Basic info
  title: string;
  description: string;
  linkType: LinkType;
  amountType: AmountType;
  usageType: UsageType;
  amount: string; // User input as string
  token: Address;
  expiresIn: number; // Hours from now
  category?: string;
  tags?: string[];
  redirectUrl?: string;
  successMessage?: string;

  // Media uploads
  images?: File[];
  videos?: File[];
  previewVideo?: File;
  documents?: File[];

  // Type-specific fields
  paymentDetails?: Partial<PaymentMetadata>;
  donationDetails?: Partial<DonationMetadata>;
  productDetails?: Partial<ProductMetadata>;
  contentDetails?: Partial<ContentMetadata>;

  // Shipping (for products)
  shippingRequired?: boolean;
  shippingInfo?: Partial<ShippingInfo>;
  variants?: ProductVariant[];

  // Content-specific
  isDigitalDelivery?: boolean;
  contentFile?: File; // The actual content to be encrypted and stored
  previewFiles?: File[];
  syllabus?: CourseSyllabus[];
}

export interface LinkFormValidation {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

// ============================================================================
// MEDIA UPLOAD INTERFACES
// ============================================================================

export interface MediaUploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: "uploading" | "processing" | "completed" | "error";
  ipfsHash?: string;
  error?: string;
}

export interface MediaUploadResult {
  success: boolean;
  ipfsHash?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  error?: string;
}

export interface BatchUploadResult {
  success: boolean;
  results: MediaUploadResult[];
  metadataHash?: string; // IPFS hash of the complete metadata
  error?: string;
}

// ============================================================================
// TOKEN INTERFACES
// ============================================================================

export interface SupportedToken {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
  logoUrl?: string;
  icon?: string;
  priceUSD?: number;
  isStablecoin?: boolean;
  chainId?: number;
}

export interface TokenBalance {
  token: SupportedToken;
  balance: bigint;
  formattedBalance: string;
  allowance: bigint;
  formattedAllowance: string;
  needsApproval: boolean;
}

// ============================================================================
// ANALYTICS & DASHBOARD INTERFACES
// ============================================================================

export interface LinkAnalytics {
  title: string;
  linkId: string;
  views: number;
  clicks: number;
  payments: number;
  conversionRate: number; // clicks to payments ratio
  totalAmount: bigint;
  averageAmount: bigint;
  formattedTotalAmount: string;
  formattedAverageAmount: string;
  formattedTotalAmountUSD?: string; // USD formatted amount
  formattedAverageAmountUSD?: string; // USD formatted average amount
  topPaymentAmount: bigint;
  recentPayments: PaymentProcessedEvent[];
  paymentsByToken: Record<Address, bigint>;
  geographicData?: Record<string, number>; // Country -> count
  deviceData?: Record<string, number>; // mobile, desktop, tablet
}

export interface CreatorStats {
  address: Address;
  username?: string;
  totalLinks: number;
  activeLinks: number;
  totalEarnings: Record<Address, bigint>; // Per token
  formattedTotalEarnings: Record<Address, string>;
  totalVolumeUSD?: string; // Total volume in USD
  totalPayments: number;
  totalClicks: number;
  totalViews: number;
  conversionRate: number;
  topPerformingLink?: PaymentLink;
  recentPayments: (
    | PaymentProcessedEvent
    | DonationProcessedEvent
    | ProductPurchasedEvent
    | ContentPurchasedEvent
  )[];
  monthlyEarnings: Record<string, Record<Address, bigint>>; // YYYY-MM -> token -> amount
  linksByType: Record<LinkType, number>;
  averageOrderValue: Record<Address, bigint>;
}

export interface DashboardData {
  stats: CreatorStats;
  links: PaymentLink[];
  analytics: LinkAnalytics[];
  tokens: SupportedToken[];
  recentActivity: (
    | PaymentProcessedEvent
    | DonationProcessedEvent
    | ProductPurchasedEvent
    | ContentPurchasedEvent
  )[];
  pendingWithdrawals: Record<Address, bigint>;
}

// ============================================================================
// IPFS SERVICE INTERFACES
// ============================================================================

export interface IPFSService {
  uploadFile: (file: File) => Promise<MediaUploadResult>;
  uploadFiles: (files: File[]) => Promise<BatchUploadResult>;
  uploadJSON: <T>(data: T) => Promise<{ ipfsHash: string }>;
  retrieveData: <T>(ipfsHash: string) => Promise<T>;
  pinContent: (ipfsHash: string) => Promise<void>;
  unpinContent: (ipfsHash: string) => Promise<void>;
}

// ============================================================================
// CONTENT DELIVERY INTERFACES
// ============================================================================

export interface ContentAccess {
  linkId: string;
  buyer: Address;
  purchaseTransaction: `0x${string}`;
  accessToken: string;
  expiresAt?: number;
  downloadCount: number;
  maxDownloads?: number;
  createdAt: number;
}

export interface ContentDelivery {
  method: "encrypted_ipfs" | "email" | "download_link" | "access_token";
  contentUrl?: string;
  decryptionKey?: string;
  accessInstructions?: string;
  expiresAt?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

export interface FilterOptions {
  linkType?: LinkType[];
  amountType?: AmountType[];
  usageType?: UsageType[];
  token?: Address[];
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  category?: string[];
  tags?: string[];
  priceRange?: {
    min: number;
    max: number;
    token: Address;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  timestamp: number;
  version?: string;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UsePaymentReturn {
  processPayment: (request: PaymentRequest) => Promise<PaymentResult>;
  processDonation: (request: PaymentRequest) => Promise<PaymentResult>;
  purchaseContent: (request: PaymentRequest) => Promise<PaymentResult>;
  purchaseProduct: (request: PaymentRequest) => Promise<PaymentResult>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export interface UseTokenReturn {
  approveToken: (
    tokenAddress: Address,
    spenderAddress: Address,
    amount: bigint
  ) => Promise<void>;
  getTokenBalance: (
    tokenAddress: Address,
    userAddress: Address
  ) => Promise<bigint>;
  getAllowance: (
    tokenAddress: Address,
    ownerAddress: Address,
    spenderAddress: Address
  ) => Promise<bigint>;
  getTokenBalances: (userAddress: Address) => Promise<TokenBalance[]>;
  isLoading: boolean;
  error: string | null;
}

export interface UseLinkReturn {
  createLink: (formData: CreateLinkFormData) => Promise<PaymentLink>;
  updateLink: (
    linkId: string,
    updates: Partial<CreateLinkFormData>
  ) => Promise<PaymentLink>;
  deleteLink: (linkId: string) => Promise<void>;
  getLink: (linkId: string) => Promise<PaymentLink | null>;
  getLinks: (
    filters?: FilterOptions,
    sort?: SortOptions,
    pagination?: { page: number; limit: number }
  ) => Promise<PaginatedResponse<PaymentLink>>;
  getLinkAnalytics: (linkId: string) => Promise<LinkAnalytics>;
  isLoading: boolean;
  error: string | null;
}

export interface UseIPFSReturn {
  uploadMedia: (files: File[]) => Promise<BatchUploadResult>;
  uploadMetadata: (metadata: LinkMetadata) => Promise<{ ipfsHash: string }>;
  retrieveMetadata: (ipfsHash: string) => Promise<LinkMetadata>;
  retrieveLinkData: (ipfsHash: string) => Promise<IPFSLinkData>;
  uploadProgress: MediaUploadProgress[];
  isUploading: boolean;
  error: string | null;
}

export interface UseContentDeliveryReturn {
  generateAccessToken: (linkId: string, buyer: Address) => Promise<string>;
  getContentAccess: (accessToken: string) => Promise<ContentAccess>;
  deliverContent: (accessToken: string) => Promise<ContentDelivery>;
  revokeAccess: (accessToken: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
