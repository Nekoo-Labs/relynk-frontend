"use client";

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { Address } from 'viem';
import { Profile, ProfileFeeConfig, CreatorEarnings, ProfileData } from '@/types/profile';
import { IPFSService } from '@/lib/ipfs';
import { getContractConfig } from '@/lib/contracts';

export function useProfileRegistry() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const [isUploading, setIsUploading] = useState(false);

  // Get contract configuration for current chain
  const contracts = getContractConfig(chainId);
  const profileRegistryConfig = contracts.ProfileRegistry;

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read functions
  const useGetProfile = (username: string) => {
    return useReadContract({
      address: profileRegistryConfig.address,
      abi: profileRegistryConfig.abi,
      functionName: 'getProfile',
      args: [username],
      query: {
        enabled: !!username,
      },
    });
  };

  const useGetProfileByOwner = (owner: Address) => {
    return useReadContract({
      address: profileRegistryConfig.address,
      abi: profileRegistryConfig.abi,
      functionName: 'getProfileByOwner',
      args: [owner],
      query: {
        enabled: !!owner,
      },
    });
  };

  const useIsUsernameAvailable = (username: string) => {
    return useReadContract({
      address: profileRegistryConfig.address,
      abi: profileRegistryConfig.abi,
      functionName: 'isUsernameAvailable',
      args: [username],
      query: {
        enabled: !!username && username.length > 0,
      },
    });
  };

  const useGetProfileFeeConfig = (username: string) => {
    return useReadContract({
      address: profileRegistryConfig.address,
      abi: profileRegistryConfig.abi,
      functionName: 'getProfileFeeConfig',
      args: [username],
      query: {
        enabled: !!username,
      },
    });
  };

  const useGetCreatorEarnings = (creator: Address, token: Address) => {
    return useReadContract({
      address: profileRegistryConfig.address,
      abi: profileRegistryConfig.abi,
      functionName: 'getCreatorEarnings',
      args: [creator, token],
      query: {
        enabled: !!creator && !!token,
      },
    });
  };

  // Helper function to upload profile data to IPFS
  const uploadToIPFS = async (profileData: ProfileData): Promise<string> => {
    setIsUploading(true);
    try {
      const ipfsHash = await IPFSService.uploadProfile(profileData);

      // Pin the content to ensure it stays available
      await IPFSService.pinContent(ipfsHash);

      console.log('Profile data uploaded to IPFS:', { hash: ipfsHash, data: profileData });
      return ipfsHash;
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to retrieve profile data from IPFS
  const getProfileData = async (ipfsHash: string): Promise<ProfileData | null> => {
    try {
      return await IPFSService.getProfile(ipfsHash);
    } catch (error) {
      console.error('Failed to retrieve profile data from IPFS:', error);
      return null;
    }
  };

  // Write functions
  const createProfile = async (username: string, profileData: ProfileData) => {
    if (!address) throw new Error('Wallet not connected');

    const ipfsHash = await uploadToIPFS(profileData);

    writeContract({
      address: profileRegistryConfig.address,
      abi: profileRegistryConfig.abi,
      functionName: 'createProfile',
      args: [username, ipfsHash],
    });
  };

  const updateProfile = async (profileData: ProfileData) => {
    if (!address) throw new Error('Wallet not connected');

    const ipfsHash = await uploadToIPFS(profileData);

    writeContract({
      address: profileRegistryConfig.address,
      abi: profileRegistryConfig.abi,
      functionName: 'updateProfile',
      args: [ipfsHash],
    });
  };

  const setProfileFeeConfig = (useCustomFees: boolean, platformFeePercent: bigint) => {
    if (!address) throw new Error('Wallet not connected');

    writeContract({
      address: profileRegistryConfig.address,
      abi: profileRegistryConfig.abi,
      functionName: 'setProfileFeeConfig',
      args: [useCustomFees, platformFeePercent],
    });
  };

  const withdrawEarnings = (token: Address, amount: bigint) => {
    if (!address) throw new Error('Wallet not connected');

    writeContract({
      address: profileRegistryConfig.address,
      abi: profileRegistryConfig.abi,
      functionName: 'withdrawEarnings',
      args: [token, amount],
    });
  };

  return {
    // Read hooks
    useGetProfile,
    useGetProfileByOwner,
    useIsUsernameAvailable,
    useGetProfileFeeConfig,
    useGetCreatorEarnings,

    // Write functions
    createProfile,
    updateProfile,
    setProfileFeeConfig,
    withdrawEarnings,

    // Helper functions
    getProfileData,
    uploadToIPFS,

    // State
    isPending: isPending || isUploading,
    isConfirming,
    isSuccess,
    hash,
  };
}
