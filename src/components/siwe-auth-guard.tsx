"use client";

import { useRequireSiweAuth } from "@/hooks/use-siwe-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSiweAuth } from "@/hooks/use-siwe-auth";
import { useAccount } from "wagmi";
import ConnectWallet from "@/components/ui/connect-wallet";

interface SiweAuthGuardProps {
  children: React.ReactNode;
}

export function SiweAuthGuard({ children }: SiweAuthGuardProps) {
  const { isAuthenticated, isConnecting } = useRequireSiweAuth();
  const { signInWithEthereum, isLoading } = useSiweAuth();
  const { isConnected } = useAccount();

  // Show loading state while connecting or authenticating
  if (isConnecting || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary-background/30">
        <Card className="w-full max-w-md mx-4 glow-soft">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
            <p className="text-foreground/60 text-center">
              {isLoading ? "🔐 Authenticating with your wallet..." : "🔗 Connecting to wallet..."}
            </p>
            {isLoading && (
              <p className="text-sm text-foreground/40 text-center">
                Please sign the message in your wallet to continue ✨
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary-background/30">
        <Card className="w-full max-w-md mx-4 glow-soft shimmer">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-heading text-foreground">
                💖 Welcome to Paylynk!
              </h2>
              <p className="text-foreground/60">
                {!isConnected
                  ? "Please connect your wallet to access the dashboard~ ✨"
                  : "Authentication in progress... If this takes too long, click below to sign manually~ ✨"
                }
              </p>
            </div>

            {!isConnected ? (
              <ConnectWallet className="w-full glow-hover hover:scale-105 transition-all duration-300" />
            ) : (
              <div className="w-full space-y-3">
                <Button
                  onClick={signInWithEthereum}
                  disabled={isLoading}
                  className="w-full glow-hover hover:scale-105 transition-all duration-300 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    "🌸 Sign in with Ethereum"
                  )}
                </Button>
                <p className="text-xs text-foreground/50 text-center">
                  Authentication should happen automatically when you connect your wallet
                </p>
              </div>
            )}

            <p className="text-sm text-foreground/40 mt-4 text-center">
              We use Sign-In with Ethereum (SIWE) for secure authentication! 🔐
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
}