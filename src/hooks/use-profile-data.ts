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
          links: [],
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

// Mock function to fetch profile data from IPFS (for demo purposes)
const fetchMockProfileData = async (username: string): Promise<ProfileData> => {
  const mockProfiles: Record<string, ProfileData> = {
    xfajarr: {
      name: "xfajarr | CEO Femboy Famz",
      bio: "Creating beautiful digital products & templates ✨ Supporting my journey through crypto payments 🌸",
      avatar: "",
      links: [
        {
          id: "1",
          title: "🎨 Premium Design Pack 2024",
          url: "/pay/design-pack-2024",
          description: "Complete UI/UX design system with 50+ components",
          icon: "🎨",
          isActive: true,
          order: 0,
          type: "product",
        },
        {
          id: "2",
          title: "☕ Buy Me Coffee",
          url: "/pay/coffee-support",
          description: "Support my creative work with a coffee",
          icon: "☕",
          isActive: true,
          order: 1,
          type: "donation",
        },
        {
          id: "3",
          title: "💬 1:1 Design Consultation",
          url: "/pay/design-consultation",
          description: "Get personalized design advice and feedback",
          icon: "💬",
          isActive: true,
          order: 2,
          type: "payment",
        },
      ],
      theme: {
        backgroundColor: "#fef7ff",
        textColor: "#1f2937",
        accentColor: "#ec4899",
        buttonStyle: "rounded",
        backgroundType: "solid",
      },
      socialLinks: {
        twitter: "https://twitter.com/xfajarr",
        instagram: "https://instagram.com/xfajarr",
      },
    },
    johndoe: {
      name: "John Doe",
      bio: "Web3 developer and crypto enthusiast. Building the future of decentralized applications.",
      avatar: "",
      links: [
        {
          id: "1",
          title: "My Portfolio Website",
          url: "https://johndoe.com",
          description: "Check out my latest projects and work",
          icon: "🌐",
          isActive: true,
          order: 0,
          type: "link",
        },
        {
          id: "2",
          title: "Buy Me Coffee ☕",
          url: "/pay/coffee-donation",
          description: "Support my open source work",
          icon: "☕",
          isActive: true,
          order: 1,
          type: "donation",
        },
        {
          id: "3",
          title: "Premium Web3 Course",
          url: "/pay/web3-course",
          description: "Learn Web3 development from scratch",
          icon: "📚",
          isActive: true,
          order: 2,
          type: "product",
        },
        {
          id: "4",
          title: "Consultation Call",
          url: "/pay/consultation",
          description: "1-hour Web3 consultation session",
          icon: "💬",
          isActive: true,
          order: 3,
          type: "payment",
        },
      ],
      theme: {
        backgroundColor: "#0f172a",
        textColor: "#f8fafc",
        accentColor: "#3b82f6",
        buttonStyle: "rounded",
        backgroundType: "solid",
      },
      socialLinks: {
        twitter: "https://twitter.com/johndoe",
        github: "https://github.com/johndoe",
        linkedin: "https://linkedin.com/in/johndoe",
      },
    },
  };

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return (
    mockProfiles[username] || {
      name: username,
      bio: "Welcome to my profile!",
      links: [],
      theme: {
        backgroundColor: "#ffffff",
        textColor: "#000000",
        accentColor: "#3b82f6",
        buttonStyle: "rounded",
        backgroundType: "solid",
      },
      socialLinks: {},
    }
  );
};

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

  // Get IPFS data using React Query
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
            links: [],
            theme: {
              backgroundColor: "#ffffff",
              textColor: "#000000",
              accentColor: "#3b82f6",
              buttonStyle: "rounded",
              backgroundType: "solid",
            },
          } as ProfileData;
        }
      } else if (!isLoadingContract && !typedProfile) {
        // Profile doesn't exist, show mock data for demo
        return await fetchMockProfileData(username);
      }
      return null;
    },
    enabled: !!username && (!isLoadingContract || !!typedProfile?.ipfsHash),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    profile: typedProfile,
    profileData,
    isLoading: isLoadingContract || isLoadingIPFS,
    error: contractError || ipfsError,
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
