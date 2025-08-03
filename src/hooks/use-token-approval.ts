"use client";

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, erc20Abi } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import { toast } from 'sonner';

interface UseTokenApprovalProps {
  tokenAddress: Address;
  spenderAddress?: Address;
  amount: bigint;
}

interface UseTokenApprovalReturn {
  allowance: bigint;
  needsApproval: boolean;
  isApproving: boolean;
  isApproved: boolean;
  approveToken: () => Promise<void>;
  checkAllowance: () => void;
  error: string | null;
}

export function useTokenApproval({
  tokenAddress,
  spenderAddress = CONTRACTS.RelynkProcessor.address,
  amount,
}: UseTokenApprovalProps): UseTokenApprovalReturn {
  const { address } = useAccount();
  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read current allowance
  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && spenderAddress ? [address, spenderAddress] : undefined,
    query: {
      enabled: !!address && !!spenderAddress,
    },
  });

  // Wait for approval transaction
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate if approval is needed
  const needsApproval = allowance < amount;
  const isApproved = allowance >= amount;

  // Update isApproving state
  useEffect(() => {
    setIsApproving(isWaitingForApproval);
  }, [isWaitingForApproval]);

  // Handle approval success
  useEffect(() => {
    if (isApprovalSuccess) {
      toast.success('Token approval successful!');
      refetchAllowance();
      setError(null);
    }
  }, [isApprovalSuccess, refetchAllowance]);

  // Handle approval errors
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message || 'Approval failed';
      setError(errorMessage);
      toast.error(`Approval failed: ${errorMessage}`);
      setIsApproving(false);
    }
  }, [writeError]);

  const approveToken = async () => {
    if (!address || !spenderAddress) {
      const error = 'Wallet not connected or spender address missing';
      setError(error);
      toast.error(error);
      return;
    }

    try {
      setIsApproving(true);
      setError(null);

      writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, amount],
      });

      toast.loading('Approving token spend...', { id: 'approval' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Approval failed: ${errorMessage}`);
      setIsApproving(false);
    }
  };

  const checkAllowance = () => {
    refetchAllowance();
  };



  return {
    allowance,
    needsApproval,
    isApproving,
    isApproved,
    approveToken,
    checkAllowance,
    error,
  };
}
