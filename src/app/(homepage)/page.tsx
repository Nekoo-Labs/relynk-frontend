"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSiweAuth } from "@/hooks/use-siwe-auth";
import HeroSection from "@/components/views/homepage/hero";
import FeaturesSection from "@/components/views/homepage/features";
import HowItWorksSection from "@/components/views/homepage/how-it-works";
import HilightedSection from "@/components/views/homepage/hilighted";

export default function HomePage() {
  const { isAuthenticated, isConnecting } = useSiweAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && !isConnecting && !isRedirecting) {
      setIsRedirecting(true);
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isConnecting, router, isRedirecting]);

  // Only show a loading screen when actually redirecting to dashboard
  if (isAuthenticated && isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary-background/30">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main" />
          <p className="text-foreground/70">Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <HilightedSection />
    </>
  );
}
