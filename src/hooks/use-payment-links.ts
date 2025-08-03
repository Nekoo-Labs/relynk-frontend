import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { PaymentLink, LinkData, LinkMetadata } from "@/types/relynk";
import { UnifiedIPFSService } from "@/lib/unified-ipfs-service";
import { toast } from "sonner";
import { Address } from "viem";

// Query keys for payment links
export const paymentLinksKeys = {
  all: ["paymentLinks"] as const,
  lists: () => [...paymentLinksKeys.all, "list"] as const,
  list: (creator?: string) =>
    [...paymentLinksKeys.lists(), { creator }] as const,
  details: () => [...paymentLinksKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentLinksKeys.details(), id] as const,
};

/**
 * Hook to fetch payment links for a specific creator
 */
export function usePaymentLinks(creator?: string) {
  return useQuery({
    queryKey: paymentLinksKeys.list(creator),
    queryFn: async (): Promise<PaymentLink[]> => {
      if (!creator) {
        return [];
      }
      return await UnifiedIPFSService.getPaymentLinksByCreator(
        creator as Address
      );
    },
    enabled: !!creator,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      console.error("Failed to fetch payment links:", error);
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch a single payment link by ID
 */
export function usePaymentLink(linkId?: string) {
  return useQuery({
    queryKey: paymentLinksKeys.detail(linkId || ""),
    queryFn: async (): Promise<PaymentLink | null> => {
      if (!linkId) {
        return null;
      }
      return await UnifiedIPFSService.getPaymentLink(linkId);
    },
    enabled: !!linkId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      console.error("Failed to fetch payment link:", error);
      return failureCount < 2;
    },
  });
}

/**
 * Hook to create a new payment link
 */
export function useCreatePaymentLink() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({
      linkData,
      signature,
      metadata,
    }: {
      linkData: LinkData;
      signature: `0x${string}`;
      metadata: LinkMetadata;
    }): Promise<{ ipfsHash: string; paymentLink: PaymentLink }> => {
      return await UnifiedIPFSService.storePaymentLink(
        linkData,
        signature,
        metadata
      );
    },
    onSuccess: ({ ipfsHash, paymentLink }) => {
      // Invalidate and refetch payment links for the creator
      queryClient.invalidateQueries({
        queryKey: paymentLinksKeys.lists(),
      });

      // Optionally add the new link to the cache
      queryClient.setQueryData(
        paymentLinksKeys.detail(paymentLink.id),
        paymentLink
      );
    },
    onError: (error) => {
      console.error("Failed to create payment link:", error);
      toast.error("Failed to create payment link");
    },
  });
}

/**
 * Hook to update an existing payment link
 */
export function useUpdatePaymentLink() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({
      linkData,
      signature,
      metadata,
    }: {
      linkData: LinkData;
      signature: `0x${string}`;
      metadata: LinkMetadata;
    }): Promise<{ ipfsHash: string; paymentLink: PaymentLink }> => {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      return await UnifiedIPFSService.updatePaymentLink(
        linkData,
        signature,
        metadata
      );
    },
    onSuccess: ({ ipfsHash, paymentLink }) => {
      // Invalidate and refetch payment links for the creator
      queryClient.invalidateQueries({
        queryKey: paymentLinksKeys.list(address),
      });

      // Update the specific link in cache
      queryClient.setQueryData(
        paymentLinksKeys.detail(paymentLink.id),
        paymentLink
      );

      toast.success("Payment link updated successfully! ✅");
    },
    onError: (error) => {
      console.error("Failed to update payment link:", error);
      toast.error("Failed to update payment link");
    },
  });
}

/**
 * Hook to delete a payment link
 */
export function useDeletePaymentLink() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (linkId: string): Promise<boolean> => {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      return await UnifiedIPFSService.deletePaymentLink(linkId, address);
    },
    onSuccess: (success, linkId) => {
      if (success) {
        // Remove the link from the list cache
        queryClient.setQueryData(
          paymentLinksKeys.list(address),
          (oldData: PaymentLink[] | undefined) => {
            return oldData?.filter((link) => link.id !== linkId) || [];
          }
        );

        // Remove the specific link from cache
        queryClient.removeQueries({
          queryKey: paymentLinksKeys.detail(linkId),
        });

        toast.success("Link deleted successfully! 🗑️");
      } else {
        toast.error("Failed to delete link");
      }
    },
    onError: (error) => {
      console.error("Failed to delete payment link:", error);
      toast.error("Failed to delete payment link");
    },
  });
}

/**
 * Hook to get payment links for the current user with search functionality
 */
export function useUserPaymentLinks(searchTerm?: string) {
  const { address } = useAccount();
  const { data: links = [], ...queryResult } = usePaymentLinks(address);

  // Filter links based on search term
  const filteredLinks = searchTerm?.trim()
    ? links.filter(
        (link) =>
          link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          link.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : links;

  return {
    ...queryResult,
    data: filteredLinks,
    totalCount: links.length,
    filteredCount: filteredLinks.length,
  };
}
