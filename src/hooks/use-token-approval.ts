"use client";

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, erc20Abi, maxUint256 } from 'viem';
import { getContractConfig } from '@/lib/contracts';

export function useTokenApproval() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const [isApproving, setIsApproving] = useState(false);

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Get current allowance
  const useTokenAllowance = (tokenAddress: Address, spenderAddress?: Address) => {
    const contracts = getContractConfig();
    const spender = spenderAddress || contracts.RelynkProcessor.address;

    return useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address!, spender],
      query: {
        enabled: !!address && !!tokenAddress && !!spender,
      },
    });
  };

  // Check if approval is needed
  const needsApproval = (currentAllowance: bigint, requiredAmount: bigint): boolean => {
    return currentAllowance < requiredAmount;
  };

  // Approve token spending
  const approveToken = async (
    tokenAddress: Address, 
    amount: bigint,
    spenderAddress?: Address
  ): Promise<{ success: boolean; error?: string }> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsApproving(true);
      const contracts = getContractConfig();
      const spender = spenderAddress || contracts.RelynkProcessor.address;

      writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
      });

      return { success: true };
    } catch (error) {
      console.error('Token approval failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Approval failed',
      };
    } finally {
      setIsApproving(false);
    }
  };

  // Approve maximum amount (common pattern)
  const approveMax = async (
    tokenAddress: Address,
    spenderAddress?: Address
  ): Promise<{ success: boolean; error?: string }> => {
    return approveToken(tokenAddress, maxUint256, spenderAddress);
  };

  return {
    useTokenAllowance,
    needsApproval,
    approveToken,
    approveMax,
    isApproving,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}