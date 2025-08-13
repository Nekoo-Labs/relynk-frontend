"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAccount } from "wagmi";

/**
 * Hook to provide manual refresh functionality for critical data
 * This replaces aggressive auto-refetching with user-controlled refreshing
 */
export function useManualRefresh() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  const refreshPayments = useCallback(() => {
    if (address) {
      queryClient.invalidateQueries({
        queryKey: ["payments", address],
      });
    }
  }, [queryClient, address]);

  const refreshPaymentLinks = useCallback(() => {
    if (address) {
      queryClient.invalidateQueries({
        queryKey: ["paymentLinks", "list", { creator: address }],
      });
    }
  }, [queryClient, address]);

  const refreshAnalytics = useCallback(() => {
    if (address) {
      queryClient.invalidateQueries({
        queryKey: ["creator-analytics", address],
      });
    }
  }, [queryClient, address]);

  const refreshProfile = useCallback(() => {
    if (address) {
      queryClient.invalidateQueries({
        queryKey: ["profiles"],
      });
    }
  }, [queryClient, address]);

  const refreshAll = useCallback(() => {
    refreshPayments();
    refreshPaymentLinks();
    refreshAnalytics();
    refreshProfile();
  }, [refreshPayments, refreshPaymentLinks, refreshAnalytics, refreshProfile]);

  return {
    refreshPayments,
    refreshPaymentLinks,
    refreshAnalytics,
    refreshProfile,
    refreshAll,
  };
}
