"use client";

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { Address, erc20Abi, maxUint256 } from 'viem';
import { getContractConfig, SUPPORTED_CHAINS } from '@/lib/contracts';
import { toast } from 'sonner';

interface ApprovalState {
  isApproving: boolean;
  isApproved: boolean;
  error?: string;
}

interface ChainApprovalStates {
  [chainId: number]: {
    [tokenAddress: string]: ApprovalState;
  };
}

export function useTokenApproval() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const [chainApprovalStates, setChainApprovalStates] = useState<ChainApprovalStates>({});
  const [currentApprovalKey, setCurrentApprovalKey] = useState<string>('');

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  // Helper to get approval state for a specific chain and token
  const getApprovalState = useCallback((chainId: number, tokenAddress: string): ApprovalState => {
    return chainApprovalStates[chainId]?.[tokenAddress.toLowerCase()] || {
      isApproving: false,
      isApproved: false,
    };
  }, [chainApprovalStates]);

  // Helper to update approval state
  const updateApprovalState = useCallback((chainId: number, tokenAddress: string, state: Partial<ApprovalState>) => {
    setChainApprovalStates(prev => ({
      ...prev,
      [chainId]: {
        ...prev[chainId],
        [tokenAddress.toLowerCase()]: {
          ...prev[chainId]?.[tokenAddress.toLowerCase()],
          ...state,
        },
      },
    }));
  }, []);

  // Get current allowance for a specific chain and token
  const useTokenAllowance = (tokenAddress: Address, targetChainId?: number, spenderAddress?: Address) => {
    const effectiveChainId = targetChainId || chainId;
    const contracts = getContractConfig(effectiveChainId);
    const spender = spenderAddress || contracts.RelynkProcessor.address;

    return useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address!, spender],
      query: {
        enabled: !!address && !!tokenAddress && !!spender,
      },
      chainId: effectiveChainId,
    });
  };

  // Check if approval is needed
  const needsApproval = useCallback((currentAllowance: bigint, requiredAmount: bigint): boolean => {
    return currentAllowance < requiredAmount;
  }, []);

  // Detect user cancellation and other errors
  const isUserRejection = useCallback((error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message || error.toString();
    const rejectionPatterns = [
      'user rejected',
      'user denied',
      'user cancelled',
      'user canceled',
      'rejected by user',
      'denied by user',
      'cancelled by user',
      'canceled by user',
      'transaction was rejected',
      'transaction rejected',
      'user rejected the request',
      'user rejected transaction',
      'ACTION_REJECTED',
      'UNAUTHORIZED',
      'User rejected',
      'User denied',
    ];

    return rejectionPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }, []);

  // Handle approval errors
  useEffect(() => {
    if (writeError || receiptError) {
      const error = writeError || receiptError;
      const [chainId, tokenAddress] = currentApprovalKey.split('-');

      if (chainId && tokenAddress) {
        if (isUserRejection(error)) {
          toast.error('Transaction was canceled by user');
          updateApprovalState(Number(chainId), tokenAddress, {
            isApproving: false,
            error: 'Transaction canceled by user',
          });
        } else {
          const errorMessage = error instanceof Error ? error.message : 'Approval failed';
          toast.error(`Approval failed: ${errorMessage}`);
          updateApprovalState(Number(chainId), tokenAddress, {
            isApproving: false,
            error: errorMessage,
          });
        }
      }
    }
  }, [writeError, receiptError, currentApprovalKey, isUserRejection, updateApprovalState]);

  // Handle successful approval
  useEffect(() => {
    if (isSuccess && currentApprovalKey) {
      const [chainId, tokenAddress] = currentApprovalKey.split('-');
      if (chainId && tokenAddress) {
        updateApprovalState(Number(chainId), tokenAddress, {
          isApproving: false,
          isApproved: true,
          error: undefined,
        });
        toast.success('Token approval successful!');
      }
    }
  }, [isSuccess, currentApprovalKey, updateApprovalState]);

  // Approve token spending
  const approveToken = async (
    tokenAddress: Address,
    amount: bigint,
    targetChainId?: number,
    spenderAddress?: Address
  ): Promise<{ success: boolean; error?: string }> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    const effectiveChainId = targetChainId || chainId;
    const approvalKey = `${effectiveChainId}-${tokenAddress.toLowerCase()}`;
    setCurrentApprovalKey(approvalKey);

    try {
      updateApprovalState(effectiveChainId, tokenAddress, {
        isApproving: true,
        error: undefined,
      });

      const contracts = getContractConfig(effectiveChainId);
      const spender = spenderAddress || contracts.RelynkProcessor.address;

      writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
        chainId: effectiveChainId,
      });

      return { success: true };
    } catch (error) {
      console.error('Token approval failed:', error);

      if (isUserRejection(error)) {
        toast.error('Transaction was canceled by user');
        updateApprovalState(effectiveChainId, tokenAddress, {
          isApproving: false,
          error: 'Transaction canceled by user',
        });
        return { success: false, error: 'Transaction canceled by user' };
      }

      const errorMessage = error instanceof Error ? error.message : 'Approval failed';
      updateApprovalState(effectiveChainId, tokenAddress, {
        isApproving: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Approve maximum amount (common pattern)
  const approveMax = async (
    tokenAddress: Address,
    targetChainId?: number,
    spenderAddress?: Address
  ): Promise<{ success: boolean; error?: string }> => {
    return approveToken(tokenAddress, maxUint256, targetChainId, spenderAddress);
  };

  return {
    useTokenAllowance,
    needsApproval,
    approveToken,
    approveMax,
    getApprovalState,
    updateApprovalState,
    isApproving: isPending || isConfirming,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    chainApprovalStates,
  };
}