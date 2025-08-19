"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Unlock, Download, ExternalLink } from "lucide-react";
import { EmailService } from "@/lib/email-service";
import { PaymentLink, LinkType, ContentMetadata, ProductMetadata } from "@/types/relynk";

// TODO: FUTURE_IMPROVEMENT - Unify access data interfaces across frontend and backend
// TODO: FUTURE_IMPROVEMENT - Add TypeScript strict mode for better type safety
// FLAG: JWT_FRONTEND_INTEGRATION - Updated interfaces to support JWT tokens

interface AccessRecord {
  linkId: string;
  buyer: string;
  purchaseTransaction: string;
  accessToken?: string;
  buyerEmail?: string;
  linkType?: string;
  contentTitle?: string;
  expiresAt?: Date | null;
  createdAt?: Date;
  downloadCount?: number;
  maxDownloads?: number;
}

interface AccessVerificationResult {
  isValid: boolean;
  accessRecord?: AccessRecord;
  linkData?: PaymentLink;
  downloadUrl?: string;
  tokenType?: 'jwt' | 'mock';
  error?: string;
}

// Legacy interface for backward compatibility
// TODO: FUTURE_IMPROVEMENT - Remove this interface once migration is complete
interface ContentAccessData {
  linkId: string;
  buyer: string;
  purchaseTransaction: string;
  accessToken: string;
  expiresAt?: number;
  downloadCount: number;
  maxDownloads?: number;
}

export default function ContentAccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();

  const linkId = params.linkId as string;
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [accessResult, setAccessResult] =
    useState<AccessVerificationResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (linkId && token) {
      verifyAccess();
    } else {
      setAccessResult({
        isValid: false,
        error: "Missing access token or link ID",
      });
      setIsLoading(false);
    }
  }, [linkId, token, address]);

  const verifyAccess = async () => {
    try {
      setIsLoading(true);

      // Call API to verify access
      const response = await fetch(`/api/v1/content/verify-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId,
          accessToken: token,
          buyerAddress: address,
        }),
      });

      const result = await response.json();
      setAccessResult(result);
    } catch (error) {
      console.error("Access verification failed:", error);
      setAccessResult({
        isValid: false,
        error: "Failed to verify access. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!accessResult?.accessRecord || !accessResult?.linkData) return;

    try {
      setIsDownloading(true);

      // TODO: FUTURE_IMPROVEMENT - Implement direct download from downloadUrl for JWT tokens
// TODO: FUTURE_IMPROVEMENT - Add JWT token refresh mechanism for expired tokens
// TODO: FUTURE_IMPROVEMENT - Implement download progress tracking for large files
// TODO: FUTURE_IMPROVEMENT - Add JWT token validation on client-side before API calls
// TODO: FUTURE_IMPROVEMENT - Implement offline access verification using cached JWT data
// FLAG: JWT_UI_ENHANCEMENTS - Enhanced UI to display JWT vs legacy token information
      // TODO: FUTURE_IMPROVEMENT - Add download progress tracking
      // TODO: FUTURE_IMPROVEMENT - Implement download resume functionality
      
      // For JWT tokens, use the downloadUrl directly if available
      if (accessResult.tokenType === 'jwt' && accessResult.downloadUrl) {
        const a = document.createElement("a");
        a.href = accessResult.downloadUrl;
        a.download = accessResult.linkData.metadata.title || "download";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Refresh access data to update download count
        await verifyAccess();
        return;
      }

      // Fallback to download API for mock tokens or when downloadUrl is not available
      const response = await fetch(`/api/v1/content/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId,
          accessToken: token,
          buyerAddress: address,
        }),
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = accessResult.linkData.metadata.title || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh access data to update download count
      await verifyAccess();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAccessContent = () => {
    if (!accessResult?.linkData?.metadata || 
        accessResult.linkData.linkType !== LinkType.CONTENT) return;
    
    const contentMetadata = accessResult.linkData.metadata as ContentMetadata;
    if (!contentMetadata.contentUrl) return;

    // Open content in new tab
    window.open(contentMetadata.contentUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-main" />
              <p className="text-muted-foreground">Verifying access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!accessResult?.isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              {accessResult?.error || "You do not have access to this content."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Please check your access link or contact support if you believe
                this is an error.
              </AlertDescription>
            </Alert>

            {!isConnected && (
              <Alert className="mt-4">
                <AlertDescription>
                  Please connect your wallet to verify your purchase.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { accessRecord, linkData, tokenType } = accessResult;
  
  // TODO: FUTURE_IMPROVEMENT - Add more sophisticated expiration handling
  // TODO: FUTURE_IMPROVEMENT - Show time remaining until expiration
  const isExpired = accessRecord?.expiresAt && new Date() > new Date(accessRecord.expiresAt);
  const hasDownloadsLeft =
    !accessRecord?.maxDownloads ||
    (accessRecord.downloadCount || 0) < accessRecord.maxDownloads;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🔓 Content Access</h1>
          <p className="text-muted-foreground">
            Your purchased content is ready
          </p>
        </div>

        {/* Access Status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Unlock className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-green-600">Access Granted</CardTitle>
                <CardDescription>
                  You have verified access to this content
                  {tokenType && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {tokenType === 'jwt' ? 'JWT Token' : 'Legacy Token'}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {linkData?.metadata?.title || "Content Access"}
            </CardTitle>
            <CardDescription>
              {linkData?.metadata?.description ||
                "Your purchased content is ready for access"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Purchase Transaction
                </p>
                <p className="font-mono text-xs break-all">
                  {accessRecord?.purchaseTransaction}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Access Token Type
                </p>
                <p className="text-sm">
                  {tokenType === 'jwt' ? 'JWT (Stateless)' : 'Legacy (Server-stored)'}
                  {tokenType === 'jwt' && (
                    <span className="ml-2 text-xs text-green-600">✓ Secure</span>
                  )}
                </p>
              </div>

              {accessRecord?.buyerEmail && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Buyer Email
                  </p>
                  <p className="text-sm">
                    {accessRecord.buyerEmail}
                  </p>
                </div>
              )}

              {accessRecord?.expiresAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Expires
                  </p>
                  <p
                    className={`text-sm ${isExpired ? "text-destructive" : "text-foreground"}`}
                  >
                    {EmailService.formatExpirationDate(
                      new Date(accessRecord.expiresAt)
                    )}
                  </p>
                </div>
              )}

              {accessRecord?.maxDownloads && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Downloads
                  </p>
                  <p className="text-sm">
                    {accessRecord.downloadCount || 0} / {accessRecord.maxDownloads}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Access Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Access Your Content</CardTitle>
            <CardDescription>
              Choose how you&apos;d like to access your purchased content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isExpired && (
              <Alert>
                <AlertDescription>
                  Your access has expired. Please contact support if you need
                  assistance.
                </AlertDescription>
              </Alert>
            )}

            {linkData?.linkType === LinkType.CONTENT &&
              (linkData?.metadata as ContentMetadata)?.contentUrl && (
                <Button
                  onClick={handleAccessContent}
                  disabled={!!isExpired}
                  className="w-full"
                  size="lg"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Access Content Online
                </Button>
              )}

            {linkData?.linkType === LinkType.PRODUCT &&
              linkData?.metadata &&
              (linkData.metadata as ProductMetadata)?.files &&
              ((linkData.metadata as ProductMetadata)?.files?.length ?? 0) > 0 && (
                <Button
                  onClick={handleDownload}
                  disabled={!!isExpired || !hasDownloadsLeft || isDownloading}
                  className="w-full"
                  size="lg"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isDownloading ? "Downloading..." : "Download Files"}
                </Button>
              )}

            {!hasDownloadsLeft && (
              <Alert>
                <AlertDescription>
                  You have reached the maximum number of downloads for this
                  content.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}