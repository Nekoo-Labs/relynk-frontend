"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { ProfileData, Profile } from "@/types/profile";
import { useProfileRegistry } from "./use-profile-registry";

// Query keys for React Query
export const profileQueryKeys = {
  all: ["profiles"] as const,
  byOwner: (owner: Address) =>
    [...profileQueryKeys.all, "byOwner", owner] as const,
  byUsername: (username: string) =>
    [...profileQueryKeys.all, "byUsername", username] as const,
  ipfsData: (ipfsHash: string) =>
    [...profileQueryKeys.all, "ipfsData", ipfsHash] as const,
  ownerData: (owner: Address) =>
    [...profileQueryKeys.all, "ownerData", owner] as const,
};

// Hook to get profile by owner with IPFS data
export function useProfileByOwner(owner?: Address) {
  const { useGetProfileByOwner, getProfileData } = useProfileRegistry();

  // Get profile from contract
  const {
    data: profileResult,
    isLoading: isLoadingContract,
    error: contractError,
  } = useGetProfileByOwner(owner!);

  const [profile, username] = (profileResult as
    | [Profile, string]
    | undefined) || [null, ""];

  // Get IPFS data using React Query
  const {
    data: profileData,
    isLoading: isLoadingIPFS,
    error: ipfsError,
    refetch: refetchIPFS,
  } = useQuery({
    queryKey: profileQueryKeys.ipfsData(profile?.ipfsHash || ""),
    queryFn: async () => {
      if (!profile?.ipfsHash) return null;

      try {
        const data = await getProfileData(profile.ipfsHash);
        return data;
      } catch (error) {
        console.error("Failed to fetch profile data from IPFS:", error);
        // Return default profile data if IPFS fetch fails
        return {
          name: username || "Anonymous User",
          bio: "Welcome to my Relynk profile!",
          links: process.env.NODE_ENV === 'development' ? [
            {
              id: "test-1",
              title: "Test Payment Link",
              url: "/pay/test-1",
              description: "A test payment link with fixed amount",
              isActive: true,
              order: 0,
              type: "payment" as const,
              amount: "10.50",
              amountType: "FIXED" as const,
              tokenSymbol: "USDC",
              formattedAmount: "10.50 USDC",
            },
            {
              id: "test-2",
              title: "Custom Donation",
              url: "/pay/test-2",
              description: "A donation link with custom amount",
              isActive: true,
              order: 1,
              type: "donation" as const,
              amount: "0",
              amountType: "DYNAMIC" as const,
              tokenSymbol: "ETH",
              formattedAmount: "",
            },
            {
              id: "test-3",
              title: "Premium Content",
              url: "/pay/test-3",
              description: "Access to premium content",
              isActive: true,
              order: 2,
              type: "content" as const,
              amount: "25",
              amountType: "FIXED" as const,
              tokenSymbol: "USDC",
              formattedAmount: "25.00 USDC",
            }
          ] : [],
          theme: {
            backgroundColor: "#ffffff",
            textColor: "#000000",
            accentColor: "#3b82f6",
            buttonStyle: "rounded",
            backgroundType: "solid",
          },
        } as ProfileData;
      }
    },
    enabled: !!profile?.ipfsHash && !!owner,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
  });

  // Calculate overall loading state - we're loading if contract is loading OR if we have a profile but IPFS is loading
  const isLoading = isLoadingContract || (!!profile?.ipfsHash && isLoadingIPFS);

  return {
    profile,
    username,
    profileData,
    isLoading,
    error: contractError || ipfsError,
    refetch: refetchIPFS,
  };
}

// Hook to get profile by username with IPFS data
export function useProfileByUsername(username: string) {
  const { useGetProfile, getProfileData } = useProfileRegistry();

  // Get profile from contract
  const {
    data: profile,
    isLoading: isLoadingContract,
    error: contractError,
  } = useGetProfile(username);

  const typedProfile = profile as Profile | undefined;

  const {
    data: profileData,
    isLoading: isLoadingIPFS,
    error: ipfsError,
    refetch: refetchIPFS,
  } = useQuery({
    queryKey: profileQueryKeys.ipfsData(typedProfile?.ipfsHash || username),
    queryFn: async () => {
      if (typedProfile?.ipfsHash) {
        try {
          const data = await getProfileData(typedProfile.ipfsHash);
          return data;
        } catch (error) {
          console.error("Failed to fetch profile data from IPFS:", error);
          // Return default profile data if IPFS fetch fails
          return {
            name: username || "Anonymous User",
            bio: "Welcome to my Relynk profile!",
            links: process.env.NODE_ENV === 'development' ? [
              {
                id: "test-1",
                title: "Test Payment Link",
                url: "/pay/test-1",
                description: "A test payment link with fixed amount",
                isActive: true,
                order: 0,
                type: "payment" as const,
                amount: "10.50",
                amountType: "FIXED" as const,
                tokenSymbol: "USDC",
                formattedAmount: "10.50 USDC",
              },
              {
                id: "test-2",
                title: "Custom Donation",
                url: "/pay/test-2",
                description: "A donation link with custom amount",
                isActive: true,
                order: 1,
                type: "donation" as const,
                amount: "0",
                amountType: "DYNAMIC" as const,
                tokenSymbol: "ETH",
                formattedAmount: "",
              },
              {
                id: "test-3",
                title: "Premium Content",
                url: "/pay/test-3",
                description: "Access to premium content",
                isActive: true,
                order: 2,
                type: "content" as const,
                amount: "25",
                amountType: "FIXED" as const,
                tokenSymbol: "USDC",
                formattedAmount: "25.00 USDC",
              }
            ] : [],
            theme: {
              backgroundColor: "#ffffff",
              textColor: "#000000",
              accentColor: "#3b82f6",
              buttonStyle: "rounded",
              backgroundType: "solid",
            },
          } as ProfileData;
        }
      }

      return null;
    },
    enabled: !!username, // Always enabled when username exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    profile: typedProfile,
    profileData,
    isLoading: isLoadingContract || isLoadingIPFS,
    error: ipfsError || contractError,
    refetch: refetchIPFS,
  };
}

// Hook for current user's profile data
export function useCurrentUserProfile() {
  const { address } = useAccount();
  return useProfileByOwner(address);
}

// Mutation hook for updating profile data
export function useUpdateProfileData() {
  const queryClient = useQueryClient();
  const { updateProfile } = useProfileRegistry();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (profileData: ProfileData) => {
      if (!address) throw new Error("Wallet not connected");
      return updateProfile(profileData);
    },
    onSuccess: () => {
      // Invalidate and refetch profile queries
      if (address) {
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.byOwner(address),
        });
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.ownerData(address),
        });
      }
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
    },
  });
}

// Mutation hook for creating profile
export function useCreateProfile() {
  const queryClient = useQueryClient();
  const { createProfile } = useProfileRegistry();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({
      username,
      profileData,
    }: {
      username: string;
      profileData: ProfileData;
    }) => {
      if (!address) throw new Error("Wallet not connected");
      return createProfile(username, profileData);
    },
    onSuccess: () => {
      // Invalidate and refetch profile queries
      if (address) {
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.byOwner(address),
        });
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.all,
        });
      }
    },
    onError: (error) => {
      console.error("Failed to create profile:", error);
    },
  });
}
