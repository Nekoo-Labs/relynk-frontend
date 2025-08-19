"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "motion/react";
import {
  Wallet,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  DollarSign,
  Heart,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { useAccount } from "wagmi";
import ConnectWallet from "@/components/ui/connect-wallet";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: {
    id: string;
    title: string;
    description: string;
    creator: string;
    creatorUsername: string;
    type: string;
    price: string;
    thumbnail: string;
  };
}

const typeIcons = {
  PAYMENT: <DollarSign className="w-4 h-4" />,
  DONATION: <Heart className="w-4 h-4" />,
  PRODUCT: <ShoppingBag className="w-4 h-4" />,
  CONTENT: <FileText className="w-4 h-4" />,
};

const typeColors = {
  PAYMENT: "bg-blue-100 text-blue-800 border-blue-200",
  DONATION: "bg-pink-100 text-pink-800 border-pink-200",
  PRODUCT: "bg-green-100 text-green-800 border-green-200",
  CONTENT: "bg-purple-100 text-purple-800 border-purple-200",
};

export function PaymentModal({ isOpen, onClose, link }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isConnected } = useAccount();

  const handlePayment = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Payment successful! 🎉");
      onClose();
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://relynk.app/pay/${link.id}`);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{link.thumbnail}</span>
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Link Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-heading text-lg line-clamp-2">
                    {link.title}
                  </h3>
                  <p className="text-sm text-foreground/60">
                    by @{link.creatorUsername}
                  </p>
                </div>
                <Badge className={`${typeColors[link.type as keyof typeof typeColors]} flex items-center gap-1 ml-2`}>
                  {typeIcons[link.type as keyof typeof typeIcons]}
                  {link.type}
                </Badge>
              </div>
              
              <p className="text-sm text-foreground/70 line-clamp-3">
                {link.description}
              </p>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/60">Price:</span>
                <span className="font-heading text-lg text-main">
                  {link.price}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Connection Status */}
          {!isConnected ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Wallet connection required</span>
              </div>
              <ConnectWallet className="w-full" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-sm">Wallet connected</span>
              </div>
              
              {/* Payment Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Pay {link.price}
                    </>
                  )}
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={copyLink}
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://relynk.app/pay/${link.id}`, '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open Link
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Security Notice */}
          <div className="bg-secondary-background/50 rounded-base p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-foreground/60 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-foreground/60">
                <p className="font-medium mb-1">Secure Payment</p>
                <p>
                  All transactions are processed directly on the blockchain. 
                  Your payment will be sent directly to the creator&apos;s wallet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
