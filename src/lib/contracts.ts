import { Address } from "viem";
import ProfileRegistryABI from "@/contracts/ProfileRegistry.json";
import RelynkProcessorABI from "@/contracts/RelynkProcessor.json";

// Contract addresses - Update these when deploying to different networks
export const CONTRACTS = {
  ProfileRegistry: {
    address: "0x00CEB34307a18d576E23C3719019bf3053F6c43b" as Address,
    abi: ProfileRegistryABI,
  },
  RelynkProcessor: {
    address: "0x3b783177f8BB5ff07FC790E3a81b482fe55899BC" as Address,
    abi: RelynkProcessorABI,
  },
} as const;

// Supported tokens on Lisk Sepolia
export const SUPPORTED_TOKENS = {
  USDC: {
    address: "0x498f995ce39AFCB27328eDe058c3B09e4925D4a0" as Address,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  USDT: {
    address: "0x0AA3E346f5D6EeEF9b0574Fe4831f62F4252D4f8" as Address,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  IDRX: {
    address: "0x7e00c1ceBe298086B9fD9bd2897a0cEfD14Bc1d7" as Address,
    symbol: "IDRX",
    name: "Indonesian Rupiah Token",
    decimals: 2,
  },
} as const;

// Network configuration
export const SUPPORTED_CHAINS = {
  liskSepolia: {
    id: 4202,
    name: "Lisk Sepolia",
    contracts: CONTRACTS,
  },
} as const;

// Get contract configuration for current network
export function getContractConfig(chainId: number = 4202) {
  switch (chainId) {
    case 4202: // Lisk Sepolia
      return SUPPORTED_CHAINS.liskSepolia.contracts;
    default:
      console.warn(
        `Unsupported chain ID: ${chainId}, falling back to Lisk Sepolia`
      );
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
    if (username.length < PROFILE_REGISTRY_CONSTANTS.MIN_USERNAME_LENGTH)
      return false;
    if (username.length > PROFILE_REGISTRY_CONSTANTS.MAX_USERNAME_LENGTH)
      return false;

    // Only allow lowercase letters, numbers, and hyphens
    const validPattern = /^[a-z0-9-]+$/;
    return validPattern.test(username);
  },

  /**
   * Calculate platform fee amount
   */
  calculatePlatformFee: (amount: bigint, feePercent: bigint): bigint => {
    return (
      (amount * feePercent) / BigInt(PROFILE_REGISTRY_CONSTANTS.FEE_DENOMINATOR)
    );
  },

  /**
   * Calculate creator amount after platform fee
   */
  calculateCreatorAmount: (amount: bigint, feePercent: bigint): bigint => {
    const platformFee = contractHelpers.calculatePlatformFee(
      amount,
      feePercent
    );
    return amount - platformFee;
  },

  /**
   * Format address for display
   */
  formatAddress: (address: string): string => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  },

  /**
   * Check if address is valid
   */
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
} as const;
