"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import ConnectWallet from "./ui/connect-wallet";
import { useSiweAuth } from "@/hooks/use-siwe-auth";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

export default function Navbar() {
  const { isAuthenticated, isLoading } = useSiweAuth();
  const { isConnected } = useAccount();
  const router = useRouter();

  const handleDashboardClick = () => {
    router.push("/dashboard");
  };

  // Show dashboard button if authenticated OR if wallet is connected (authentication might be in progress)
  const showDashboardButton = isAuthenticated || (isConnected && !isLoading);

  return (
    <nav className="fixed top-0 left-0 z-50 w-full pt-4">
      <Card className="bg-main text-white max-w-6xl w-full mx-auto flex-row items-center justify-between py-4 border-2 border-shadow shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]! glow-soft">
        <CardHeader>
          <CardTitle className="text-white">Paylynk</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          {showDashboardButton && (
            <Button
              onClick={handleDashboardClick}
              disabled={isLoading}
              className="bg-white text-main shadow-rose-200 border-rose-200 border hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-main mr-2"></div>
                  Signing in...
                </>
              ) : (
                "Dashboard ✨"
              )}
            </Button>
          )}
          <ConnectWallet className="bg-white text-main shadow-rose-200 border-rose-200 border hover:scale-105 transition-all duration-300" />
        </CardContent>
      </Card>
    </nav>
  );
}
