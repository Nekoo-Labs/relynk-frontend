import { Address } from 'viem';
import ProfileRegistryABI from '@/contracts/ProfileRegistry.json';

// Contract addresses - Update these when deploying to different networks
export const CONTRACTS = {
  ProfileRegistry: {
    address: '0x00CEB34307a18d576E23C3719019bf3053F6c43b' as Address,
    abi: ProfileRegistryABI,
  },
  // Add other contracts here as needed
  // RelynkProcessor: {
  //   address: '0x...' as Address,
  //   abi: RelynkProcessorABI,
  // },
} as const;

// Network configuration
export const SUPPORTED_CHAINS = {
  liskSepolia: {
    id: 4202,
    name: 'Lisk Sepolia',
    contracts: CONTRACTS,
  },
} as const;

// Get contract configuration for current network
export function getContractConfig(chainId: number = 4202) {
  switch (chainId) {
    case 4202: // Lisk Sepolia
      return SUPPORTED_CHAINS.liskSepolia.contracts;
    default:
      console.warn(`Unsupported chain ID: ${chainId}, falling back to Lisk Sepolia`);
      return SUPPORTED_CHAINS.liskSepolia.contracts;
  }
}

// Contract constants from the ProfileRegistry contract
export const PROFILE_REGISTRY_CONSTANTS = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_PLATFORM_FEE_PERCENT: 0,
  MAX_PLATFORM_FEE_PERCENT: 1000, // 10% (basis points)
  FEE_DENOMINATOR: 10000,
} as const;

// Helper functions for contract interactions
export const contractHelpers = {
  /**
   * Validate username format
   */
  isValidUsername: (username: string): boolean => {
    if (!username) return false;
    if (username.length < PROFILE_REGISTRY_CONSTANTS.MIN_USERNAME_LENGTH) return false;
    if (username.length > PROFILE_REGISTRY_CONSTANTS.MAX_USERNAME_LENGTH) return false;
    
    // Only allow lowercase letters, numbers, and hyphens
    const validPattern = /^[a-z0-9-]+$/;
    return validPattern.test(username);
  },

  /**
   * Calculate platform fee amount
   */
  calculatePlatformFee: (amount: bigint, feePercent: bigint): bigint => {
    return (amount * feePercent) / BigInt(PROFILE_REGISTRY_CONSTANTS.FEE_DENOMINATOR);
  },

  /**
   * Calculate creator amount after platform fee
   */
  calculateCreatorAmount: (amount: bigint, feePercent: bigint): bigint => {
    const platformFee = contractHelpers.calculatePlatformFee(amount, feePercent);
    return amount - platformFee;
  },

  /**
   * Format address for display
   */
  formatAddress: (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  },

  /**
   * Check if address is valid
   */
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
} as const;
