import { Address } from "viem";
import { liskSepolia } from "viem/chains";
import ProfileRegistryABI from "@/contracts/ProfileRegistry.json";
import RelynkProcessorABI from "@/contracts/RelynkProcessor.json";

// Network-specific contract addresses
const LISK_SEPOLIA_CONTRACTS = {
  ProfileRegistry: {
    address: "0x00CEB34307a18d576E23C3719019bf3053F6c43b" as Address,
    abi: ProfileRegistryABI,
  },
  RelynkProcessor: {
    address: "0x3b783177f8BB5ff07FC790E3a81b482fe55899BC" as Address,
    abi: RelynkProcessorABI,
  },
} as const;

const SCROLL_SEPOLIA_CONTRACTS = {
  ProfileRegistry: {
    address: "0xd8EcF5D6D77bF2852c5e9313F87f31cc99c38dE9" as Address,
    abi: ProfileRegistryABI,
  },
  RelynkProcessor: {
    address: "0xecB93f03515DE67EA43272797Ea8eDa059985894" as Address,
    abi: RelynkProcessorABI,
  },
} as const;

// Legacy export for backward compatibility (Lisk Sepolia)
export const CONTRACTS = LISK_SEPOLIA_CONTRACTS;

// Network-specific supported tokens
const LISK_SEPOLIA_TOKENS = {
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

const SCROLL_SEPOLIA_TOKENS = {
  USDC: {
    address: "0xBbe362BB261657bbD7202EB623DDBe6ED6a156b6" as Address,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  IDRX: {
    address: "0x47B320A4ED999989AE3065Be28B208f177a7546D" as Address,
    symbol: "IDRX",
    name: "Indonesian Rupiah Token",
    decimals: 2,
  },
} as const;

// Legacy export for backward compatibility (Lisk Sepolia)
export const SUPPORTED_TOKENS = LISK_SEPOLIA_TOKENS;

// Network configuration
export const SUPPORTED_CHAINS = {
  liskSepolia: {
    id: 4202,
    name: "Lisk Sepolia",
    contracts: LISK_SEPOLIA_CONTRACTS,
    tokens: LISK_SEPOLIA_TOKENS,
  },
  scrollSepolia: {
    id: 534351,
    name: "Scroll Sepolia",
    contracts: SCROLL_SEPOLIA_CONTRACTS,
    tokens: SCROLL_SEPOLIA_TOKENS,
  },
} as const;

// Get contract configuration for current network
export function getContractConfig(chainId: number = 4202) {
  switch (chainId) {
    case 4202: // Lisk Sepolia
      return SUPPORTED_CHAINS.liskSepolia.contracts;
    case 534351: // Scroll Sepolia
      return SUPPORTED_CHAINS.scrollSepolia.contracts;
    default:
      console.warn(
        `Unsupported chain ID: ${chainId}, falling back to Lisk Sepolia`
      );
      return SUPPORTED_CHAINS.liskSepolia.contracts;
  }
}

// Helper function to get token configuration for a specific chain
export function getTokenConfig(chainId: number = 4202) {
  switch (chainId) {
    case 4202: // Lisk Sepolia
      return SUPPORTED_CHAINS.liskSepolia.tokens;
    case 534351: // Scroll Sepolia
      return SUPPORTED_CHAINS.scrollSepolia.tokens;
    default:
      console.warn(`Unsupported chain ID: ${chainId}, falling back to Lisk Sepolia`);
      return SUPPORTED_CHAINS.liskSepolia.tokens;
  }
}

// Helper function to get chain configuration
export function getChainConfig(chainId: number = 4202) {
  switch (chainId) {
    case 4202: // Lisk Sepolia
      return SUPPORTED_CHAINS.liskSepolia;
    case 534351: // Scroll Sepolia
      return SUPPORTED_CHAINS.scrollSepolia;
    default:
      console.warn(`Unsupported chain ID: ${chainId}, falling back to Lisk Sepolia`);
      return SUPPORTED_CHAINS.liskSepolia;
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
