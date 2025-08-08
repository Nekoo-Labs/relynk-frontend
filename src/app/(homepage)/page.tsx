"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSiweAuth } from "@/hooks/use-siwe-auth";
import HeroSection from "@/components/views/homepage/hero";
import FeaturesSection from "@/components/views/homepage/features";
import HowItWorksSection from "@/components/views/homepage/how-it-works";
import HilightedSection from "@/components/views/homepage/hilighted";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Show loading state while connecting or redirecting
  if (isConnecting) {
    return (
      <div className="min-h-[600px] flex flex-col space-y-8 p-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  // Don't render the homepage content if user is authenticated and redirecting
  if (isAuthenticated && isRedirecting) {
    return null;
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
