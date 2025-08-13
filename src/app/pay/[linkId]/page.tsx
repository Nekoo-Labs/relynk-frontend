"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PaymentProcessor } from "@/components/payment/payment-processor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentLink } from "@/types/relynk";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { invalidatePaymentRelatedCaches } from "@/services/api";
import { useAccount } from "wagmi";

// Function to fetch payment link data from storage
const fetchPaymentLink = async (
  linkId: string
): Promise<PaymentLink | null> => {
  try {
    // Use our storage service to fetch the payment link
    const { UnifiedIPFSService } = await import("@/lib/unified-ipfs-service");
    return await UnifiedIPFSService.getPaymentLink(linkId);
  } catch (error) {
    console.error("Failed to fetch payment link:", error);
    return null;
  }
};

export default function PaymentLinkPage() {
  const params = useParams();
  const { address } = useAccount();

  const linkId = params.linkId as string;

  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPaymentLink = async () => {
      try {
        setLoading(true);
        setError(null);

        const link = await fetchPaymentLink(linkId);

        if (!link) {
          setError("Payment link not found");
          return;
        }

        setPaymentLink(link);
      } catch (err) {
        console.error("Failed to load payment link:", err);
        setError("Failed to load payment link");
      } finally {
        setLoading(false);
      }
    };

    if (linkId) {
      loadPaymentLink();
    }
  }, [linkId]);

  const handlePaymentSuccess = (transactionHash: string) => {
    console.log("Payment successful:", transactionHash);

    // Invalidate payment-related caches for real-time updates
    if (address) {
      setTimeout(() => {
        invalidatePaymentRelatedCaches(address);
      }, 2000); // Wait 2 seconds for blockchain to update
    }
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment failed:", error);
    setError(error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading payment link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
              <h3 className="text-xl font-semibold">Payment Link Not Found</h3>
              <p className="text-muted-foreground">
                {error ||
                  "The payment link you're looking for doesn't exist or has been removed."}
              </p>
              <Link href="/">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Relynk Payment</h1>
          <p className="text-muted-foreground">Secure blockchain payments</p>
        </div>

        {/* Payment Processor */}
        <PaymentProcessor
          paymentLink={paymentLink}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />

        {/* Footer */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Powered by Relynk
          </Link>
        </div>
      </div>
    </div>
  );
}
