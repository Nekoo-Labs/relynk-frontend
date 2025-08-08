"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAccount, useSignMessage } from "wagmi";
import { parseUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Link,
  DollarSign,
  Calendar,
  Settings,
  Save,
  Loader2,
  Zap,
  Gift,
  ShoppingBag,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { CreateLinkFormData } from "@/types/relynk";
import { useRelynkProcessor } from "@/hooks/use-relynk-processor";
import { useCreatePaymentLink } from "@/hooks/use-payment-links";
import { SUPPORTED_TOKENS } from "@/lib/contracts";
import {
  linkFormUISchema,
  type LinkFormUIData,
  transformUIDataToContractData,
} from "@/lib/validations/link-form";
import { ImageUploadService } from "@/lib/image-upload";
import { toast } from "sonner";

interface CreateLinkFormProps {
  onClose?: () => void;
  onSuccess?: (linkId: string) => void;
  initialLinkType?: "payment" | "donation" | "product" | "content";
  showTypeSelection?: boolean;
}

export function CreateLinkForm({ onClose, onSuccess, initialLinkType, showTypeSelection = false }: CreateLinkFormProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { signMessage, isPending: isSigningPending } = useSignMessage();
  const { createLinkData } = useRelynkProcessor();
  const createPaymentLinkMutation = useCreatePaymentLink();
  const isSubmittingRef = useRef(false);

  const [isCreating, setIsCreating] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [preparedImage, setPreparedImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);

  // Initialize form with Zod validation
  const form = useForm<LinkFormUIData>({
    resolver: zodResolver(linkFormUISchema),
    defaultValues: {
      title: "",
      description: "",
      linkType: (initialLinkType || "payment") as LinkFormUIData["linkType"],
      amountType: "fixed" as const,
      usageType: "one_time" as const,
      amount: "",
      currency: "USDC" as const,
      expiryDate: "",
      maxUses: "",
      targetUrl: "",
      image: "",
      serviceName: "",
      brand: "",
      category: "",
      weight: "",
      cause: "",
      contentType: "other" as const,
      duration: "",
      goalAmount: "",
      invoiceNumber: "",
      language: "",
      level: "beginner" as const,
      productName: "",
      shippingRequired: false,
      sku: "",
      tags: "",
    },
  });

  const watchedLinkType = form.watch("linkType");

  const linkTypes = [
    {
      id: "payment" as const,
      label: "Payment Link",
      description: "Fixed amount payment",
      icon: Zap,
    },
    {
      id: "donation" as const,
      label: "Donation Link",
      description: "Flexible amount donation",
      icon: Gift,
    },
    {
      id: "product" as const,
      label: "Product Link",
      description: "Product or service sale",
      icon: ShoppingBag,
    },
    {
      id: "content" as const,
      label: "Content Link",
      description: "Digital content access",
      icon: FileText,
    },
  ];

  // Map currency to token address using deployed contract addresses
  const getTokenAddress = (currency: string): `0x${string}` => {
    const token = SUPPORTED_TOKENS[currency as keyof typeof SUPPORTED_TOKENS];
    return token?.address || SUPPORTED_TOKENS.USDC.address;
  };

  // Get token decimals for proper amount formatting
  const getTokenDecimals = (currency: string): number => {
    const token = SUPPORTED_TOKENS[currency as keyof typeof SUPPORTED_TOKENS];
    return token?.decimals || SUPPORTED_TOKENS.USDC.decimals;
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      setIsPreparingImage(true);

      // Only prepare the image (validation + preview), don't upload to IPFS yet
      const { preview } = await ImageUploadService.prepareImage(file);

      setPreparedImage({
        file,
        preview,
      });
    } catch (error) {
      console.error("Image preparation failed:", error);
      toast.error("Failed to prepare image. Please try again.");
    } finally {
      setIsPreparingImage(false);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    if (preparedImage?.preview) {
      ImageUploadService.revokePreviewUrl(preparedImage.preview);
    }
    setPreparedImage(null);
    form.setValue("image", "");
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (preparedImage?.preview) {
        ImageUploadService.revokePreviewUrl(preparedImage.preview);
      }
    };
  }, [preparedImage?.preview]);

  // Key changes to fix the signature issue in handleSubmit function

  const handleSubmit = async (data: LinkFormUIData) => {
    // console.log("handleSubmit called with:", {
    //   address,
    //   isConnected,
    //   isConnecting,
    //   type: typeof address,
    // });

    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (isConnecting) {
      toast.error("Wallet is still connecting. Please wait.");
      return;
    }

    // Additional validation to ensure address is a valid hex string
    if (
      typeof address !== "string" ||
      !address.startsWith("0x") ||
      address.length !== 42
    ) {
      console.error("Invalid address detected:", {
        address,
        type: typeof address,
        length: address?.length,
      });
      toast.error("Invalid wallet address. Please reconnect your wallet.");
      return;
    }

    // Prevent multiple submissions
    if (isSubmittingRef.current || isSigningPending || isCancelled) {
      return;
    }

    isSubmittingRef.current = true;
    setIsCreating(true);
    setIsCancelled(false);

    try {
      // Upload image to IPFS if one is prepared
      let imageUrl = "";
      if (preparedImage) {
        try {
          imageUrl = await ImageUploadService.uploadImage(preparedImage.file);
          // console.log("Image uploaded to IPFS:", imageUrl);
        } catch (imageError) {
          console.error("Failed to upload image:", imageError);
          throw new Error(
            `Failed to upload image: ${
              imageError instanceof Error ? imageError.message : "Unknown error"
            }`
          );
        }
      }

      // Debug currency and token address
      // console.log("Form data currency:", data.currency);
      const tokenAddress = getTokenAddress(data.currency);
      // console.log("Token address for currency:", tokenAddress);

      // Transform UI data to contract data
      const contractData = transformUIDataToContractData(
        { ...data, image: imageUrl },
        tokenAddress
      );

      // Format amount with proper decimals for the selected token
      const tokenDecimals = getTokenDecimals(data.currency);
      const formattedAmount = data.amount
        ? parseUnits(data.amount, tokenDecimals).toString()
        : "0";

      // console.log("Token decimals:", tokenDecimals);
      // console.log("Formatted amount:", formattedAmount);

      // Create comprehensive metadata FIRST (before creating LinkData)
      const linkFormData: CreateLinkFormData = {
        title: contractData.title,
        description: contractData.description as string,
        linkType: contractData.linkType,
        amountType: contractData.amountType,
        usageType: contractData.usageType,
        amount: formattedAmount,
        token: tokenAddress,
        expiresIn: contractData.expiresIn,
        redirectUrl: contractData.redirectUrl,
        successMessage: contractData.successMessage,
        tags: contractData.tags,
        category: contractData.category,
        images: preparedImage ? [preparedImage.file] : undefined,
      };

      // console.log("Creating metadata with linkFormData:", linkFormData);
      const { MetadataCreator } = await import("@/lib/metadata-creator");

      const comprehensiveMetadata = await MetadataCreator.createMetadata(
        linkFormData
      );
      // console.log("Metadata created:", comprehensiveMetadata);

      // Store metadata to IPFS and get the hash
      const { UnifiedIPFSService } = await import("@/lib/unified-ipfs-service");
      const ipfsHash = await UnifiedIPFSService.storeMetadata(
        comprehensiveMetadata
      );
      // console.log("Metadata stored to IPFS with hash:", ipfsHash);

      // NOW create link data with the IPFS hash as metadata
      // This ensures the signature is created with the final metadata value
      // console.log("Creating link data with address:", address);
      const linkData = await createLinkData(
        {
          ...linkFormData,
          // Override the metadata with the IPFS hash
          metadata: ipfsHash,
        },
        address as `0x${string}`
      );

      // Debug: Log the returned linkData
      // console.log("Returned linkData:", linkData);
      // console.log(
      //   "linkData.creator:",
      //   linkData.creator,
      //   "type:",
      //   typeof linkData.creator
      // );
      // console.log(
      //   "linkData.token:",
      //   linkData.token,
      //   "type:",
      //   typeof linkData.token
      // );
      // console.log("linkData.metadata:", linkData.metadata);

      // IMPORTANT: Ensure all BigInt fields are properly formatted
      const signableLinkData = {
        ...linkData,
        amount: BigInt(linkData.amount),
        expires: BigInt(linkData.expires),
        nonce: BigInt(linkData.nonce),
      };

      // Sign the link data using proper Ethereum signed message format
      // console.log("Creating link data hash...");
      const { createLinkDataHash } = await import("@/lib/signature-utils");
      const linkDataHash = createLinkDataHash(signableLinkData);
      // console.log("Link data hash created:", linkDataHash);

      // console.log("Requesting signature...");
      const signature = await new Promise<`0x${string}`>((resolve, reject) => {
        // Use the raw hash - signMessage will add the Ethereum signed message prefix
        signMessage(
          { message: { raw: linkDataHash } },
          {
            onSuccess: (data) => {
              // console.log("Signature successful:", data);
              resolve(data);
            },
            onError: (error) => {
              // console.log("Signature error:", error);
              reject(error);
            },
          }
        );
      });

      // Store the complete payment link using React Query mutation
      // Pass the signed LinkData (with IPFS hash) and the signature
      // console.log("Storing payment link with mutation...");
      // console.log("Mutation data:", {
      //   linkData: signableLinkData,
      //   signature,
      //   metadata: comprehensiveMetadata,
      // });

      await createPaymentLinkMutation.mutateAsync({
        linkData: signableLinkData, // Use the signable version with proper BigInt
        signature,
        metadata: comprehensiveMetadata,
      });

      // console.log("Payment link stored successfully");

      // console.log("Link created successfully:", {
      //   linkId: signableLinkData.linkId,
      //   signature,
      // });

      // Reset the form
      form.reset();

      // Clear any prepared image
      if (preparedImage?.preview) {
        ImageUploadService.revokePreviewUrl(preparedImage.preview);
      }
      setPreparedImage(null);

      // Call success callback
      onSuccess?.(signableLinkData.linkId);
      onClose?.();
    } catch (error) {
      console.error("Failed to create link:", error);

      // Better error handling for user cancellation
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        const errorName = error.name?.toLowerCase() || "";

        // Check for various cancellation patterns
        if (
          errorMessage.includes("user rejected") ||
          errorMessage.includes("user denied") ||
          errorMessage.includes("cancelled") ||
          errorMessage.includes("rejected") ||
          errorName.includes("userrejected") ||
          errorName.includes("cancelled")
        ) {
          // User cancelled - don't show error, just reset state
          // console.log("User cancelled signature request");
          setIsCancelled(true);
          return; // Exit early without showing error
        } else {
          toast.error(`Failed to create link: ${error.message}`);
        }
      } else {
        toast.error("Failed to create link: Unknown error");
      }
    } finally {
      isSubmittingRef.current = false;
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Connection Status */}
      {(!isConnected || !address) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              ⚠️ Please connect your wallet to create payment links
              {isConnecting && " (Connecting...)"}
            </p>
            {address && (
              <p className="text-xs text-yellow-600 mt-1">
                Address: {address} (Type: {typeof address})
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Link Type Selection (hidden by default; users choose type before this page) */}
      {showTypeSelection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Choose Link Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              role="radiogroup"
              aria-label="Choose Link Type"
            >
              {linkTypes.map((type) => {
                const IconComponent = type.icon;
                const selected = watchedLinkType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => form.setValue("linkType", type.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        form.setValue("linkType", type.id);
                      }
                    }}
                    className={
                      `group relative text-left rounded-2xl border-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 ${
                        selected
                          ? "border-main/80 bg-main/5 shadow-shadow"
                          : "border-border hover:border-main/50"
                      }`
                    }
                  >
                    <div className="absolute inset-0 rounded-2xl pointer-events-none" />
                    <div className="flex items-center gap-2 font-heading text-foreground mb-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${selected ? "border-main bg-main/10 text-main" : "border-border text-foreground/70"}`}>
                        <IconComponent className="h-4 w-4" />
                      </span>
                      <span>{type.label}</span>
                    </div>
                    <p className="text-sm text-foreground/70 leading-snug">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link Details Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Link Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField<LinkFormUIData>
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Premium Design Pack"
                        className="border-2 border-border shadow-shadow"
                        {...field}
                        value={
                          typeof field.value === "string" ? field.value : ""
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<LinkFormUIData>
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what you're selling or collecting for..."
                        className="min-h-[100px] border-2 border-border shadow-shadow"
                        {...field}
                        value={
                          typeof field.value === "string" ? field.value : ""
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description to help users understand what
                      they&apos;re paying for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload for Product and Content Links */}
              {(watchedLinkType === "product" ||
                watchedLinkType === "content") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {watchedLinkType === "product"
                      ? "Product Image"
                      : "Content Preview"}{" "}
                    (optional)
                  </label>
                  {!preparedImage ? (
                    <div className="border-2 border-dashed border-border rounded-base p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-foreground/60" />
                      <p className="text-sm text-foreground/60 mb-2">
                        Select an image to showcase your {watchedLinkType}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                        id="image-upload"
                        disabled={isPreparingImage}
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-flex items-center px-4 py-2 border-2 border-border rounded-base bg-background hover:bg-secondary-background cursor-pointer disabled:opacity-50"
                      >
                        {isPreparingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Preparing...
                          </>
                        ) : (
                          "Choose Image"
                        )}
                      </label>
                      <p className="text-xs text-foreground/40 mt-2">
                        Max 5MB • JPEG, PNG, GIF, WebP
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Image will be uploaded to IPFS when you create the
                        link
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-2 border-border rounded-base p-4">
                      <div className="flex items-start gap-4">
                        <Image
                          src={preparedImage.preview}
                          alt="Preview"
                          width={80}
                          height={80}
                          className="rounded-base object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {preparedImage.file.name}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {(preparedImage.file.size / 1024 / 1024).toFixed(2)}{" "}
                            MB
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            📋 Ready for upload (will upload when creating link)
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeImage}
                          className="text-foreground/60 hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(watchedLinkType === "product" ||
                watchedLinkType === "content") && (
                <FormField<LinkFormUIData>
                  control={form.control}
                  name="targetUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedLinkType === "product"
                          ? "Target URL (after payment)"
                          : "Content URL (after payment)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder={
                            watchedLinkType === "product"
                              ? "https://example.com/download"
                              : "https://example.com/content"
                          }
                          className="border-2 border-border shadow-shadow"
                          {...field}
                          value={
                            typeof field.value === "string" ? field.value : ""
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Users will be redirected here after successful payment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Amount Type Selection */}
              <FormField
                control={form.control}
                name="amountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-2 border-border shadow-shadow">
                          <SelectValue placeholder="Select amount type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="dynamic">Dynamic Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "fixed" &&
                        "Users pay exactly this amount"}
                      {field.value === "dynamic" &&
                        "Users can enter any amount they want"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Usage Type Selection */}
              <FormField
                control={form.control}
                name="usageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-2 border-border shadow-shadow">
                          <SelectValue placeholder="Select usage type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="one_time">One Time</SelectItem>
                        <SelectItem value="reusable">Reusable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "one_time" &&
                        "Link can only be used once"}
                      {field.value === "reusable" &&
                        "Link can be used multiple times"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedLinkType === "donation"
                          ? "Suggested Amount"
                          : "Amount *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="border-2 border-border shadow-shadow"
                          {...field}
                          value={
                            typeof field.value === "string" ? field.value : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-2 border-border shadow-shadow">
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USDC">USDC - USD Coin</SelectItem>
                          <SelectItem value="USDT">
                            USDT - Tether USD
                          </SelectItem>
                          <SelectItem value="IDRX">
                            IDRX - Indonesian Rupiah Token
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchedLinkType === "donation" && (
                <div className="p-4 border-2 border-border rounded-base bg-secondary-background">
                  <p className="text-sm text-foreground/80">
                    💡 <strong>Donation Tip:</strong> Visitors can choose their
                    own amount. The suggested amount helps guide their decision.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField<LinkFormUIData>
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="border-2 border-border shadow-shadow"
                          {...field}
                          value={
                            typeof field.value === "string" ? field.value : ""
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Optional expiry date for this payment link
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField<LinkFormUIData>
                  control={form.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Uses (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Unlimited"
                          className="border-2 border-border shadow-shadow"
                          {...field}
                          value={
                            typeof field.value === "string" ? field.value : ""
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of times this link can be used
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* General Metadata Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Services, Products, Donations"
                          className="border-2 border-border shadow-shadow"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Categorize your link for better organization
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., urgent, premium, limited"
                          className="border-2 border-border shadow-shadow"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated tags for easy searching
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Link Type Specific Metadata */}
          {(watchedLinkType === "payment" ||
            watchedLinkType === "donation" ||
            watchedLinkType === "product" ||
            watchedLinkType === "content") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {watchedLinkType === "payment" && "Payment Details"}
                  {watchedLinkType === "donation" && "Donation Details"}
                  {watchedLinkType === "product" && "Product Details"}
                  {watchedLinkType === "content" && "Content Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment-specific fields */}
                {watchedLinkType === "payment" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="serviceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Name (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Web Development, Consulting"
                              className="border-2 border-border shadow-shadow"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., INV-2024-001"
                              className="border-2 border-border shadow-shadow"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Donation-specific fields */}
                {watchedLinkType === "donation" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cause"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cause (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Education, Healthcare, Environment"
                              className="border-2 border-border shadow-shadow"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="goalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal Amount (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Target fundraising amount"
                              className="border-2 border-border shadow-shadow"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Product-specific fields */}
                {watchedLinkType === "product" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="productName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Premium T-Shirt"
                                className="border-2 border-border shadow-shadow"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Nike, Apple"
                                className="border-2 border-border shadow-shadow"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., TSH-001-BLK-L"
                                className="border-2 border-border shadow-shadow"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 0.5 kg"
                                className="border-2 border-border shadow-shadow"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shippingRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Shipping Required</FormLabel>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value || false}
                                onChange={(e) =>
                                  field.onChange(e.target.checked)
                                }
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Content-specific fields */}
                {watchedLinkType === "content" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="contentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Type (optional)</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="border-2 border-border shadow-shadow">
                                  <SelectValue placeholder="Select content type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                                <SelectItem value="document">
                                  Document
                                </SelectItem>
                                <SelectItem value="course">Course</SelectItem>
                                <SelectItem value="ebook">E-book</SelectItem>
                                <SelectItem value="software">
                                  Software
                                </SelectItem>
                                <SelectItem value="template">
                                  Template
                                </SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., English, Spanish"
                                className="border-2 border-border shadow-shadow"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 2 hours, 45 minutes"
                                className="border-2 border-border shadow-shadow"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              For video/audio content or course duration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField<LinkFormUIData>
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty Level (optional)</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="border-2 border-border shadow-shadow">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner">
                                  Beginner
                                </SelectItem>
                                <SelectItem value="intermediate">
                                  Intermediate
                                </SelectItem>
                                <SelectItem value="advanced">
                                  Advanced
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={
                isCreating ||
                isSigningPending ||
                createPaymentLinkMutation.isPending ||
                !address
              }
              className="bg-main text-main-foreground hover:bg-main/90 shadow-shadow disabled:opacity-50"
              onClick={isCancelled ? () => setIsCancelled(false) : undefined}
            >
              {isCreating ||
              isSigningPending ||
              createPaymentLinkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSigningPending
                    ? "Waiting for Signature..."
                    : createPaymentLinkMutation.isPending
                    ? "Storing to IPFS..."
                    : "Creating Link..."}
                </>
              ) : isCancelled ? (
                "Try Again"
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Link
                </>
              )}
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="neutral"
                onClick={onClose}
                className="border-2 border-border shadow-shadow"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
