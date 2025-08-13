import { GraphQLClient } from 'graphql-request';
import { useChainId } from 'wagmi';
import { liskSepolia, scrollSepolia, morphHolesky } from 'viem/chains';

// Network-specific GraphQL endpoints
const GRAPHQL_ENDPOINTS = {
  [liskSepolia.id]: {
    profile: 'https://api.goldsky.com/api/public/project_cm65wvklocpxs01yrgj0l4mag/subgraphs/relynk-profile/1.0.0/gn',
    processor: 'https://api.goldsky.com/api/public/project_cm65wvklocpxs01yrgj0l4mag/subgraphs/relynk-processor/1.0.0/gn'
  },
  [scrollSepolia.id]: {
    profile: 'https://indexer.dev.hyperindex.xyz/e647b58/v1/graphql',
    processor: 'https://indexer.dev.hyperindex.xyz/e647b58/v1/graphql'
  },
  [morphHolesky.id]: {
    profile: 'https://indexer.dev.hyperindex.xyz/fd0f205/v1/graphql',
    processor: 'https://indexer.dev.hyperindex.xyz/fd0f205/v1/graphql'
  }
} as const;

// Default network (fallback)
const DEFAULT_CHAIN_ID = liskSepolia.id;

// Legacy exports for backward compatibility
export const PROFILE_GRAPHQL_ENDPOINT = GRAPHQL_ENDPOINTS[DEFAULT_CHAIN_ID].profile;
export const PROCESSOR_GRAPHQL_ENDPOINT = GRAPHQL_ENDPOINTS[DEFAULT_CHAIN_ID].processor;

// Legacy clients (use default network)
export const profileClient = new GraphQLClient(PROFILE_GRAPHQL_ENDPOINT);
export const processorClient = new GraphQLClient(PROCESSOR_GRAPHQL_ENDPOINT);

// Network-aware client functions
export function getProfileClient(chainId?: number): GraphQLClient {
  const targetChainId = chainId || DEFAULT_CHAIN_ID;
  const endpoints = GRAPHQL_ENDPOINTS[targetChainId as keyof typeof GRAPHQL_ENDPOINTS];

  if (!endpoints) {
    console.warn(`Unsupported chain ID: ${targetChainId}, falling back to default`);
    return new GraphQLClient(GRAPHQL_ENDPOINTS[DEFAULT_CHAIN_ID].profile);
  }

  return new GraphQLClient(endpoints.profile);
}

export function getProcessorClient(chainId?: number): GraphQLClient {
  const targetChainId = chainId || DEFAULT_CHAIN_ID;
  const endpoints = GRAPHQL_ENDPOINTS[targetChainId as keyof typeof GRAPHQL_ENDPOINTS];

  if (!endpoints) {
    console.warn(`Unsupported chain ID: ${targetChainId}, falling back to default`);
    return new GraphQLClient(GRAPHQL_ENDPOINTS[DEFAULT_CHAIN_ID].processor);
  }

  return new GraphQLClient(endpoints.processor);
}

// React hooks for network-aware GraphQL clients
export function useProfileClient(): GraphQLClient {
  const chainId = useChainId();
  return getProfileClient(chainId);
}

export function useProcessorClient(): GraphQLClient {
  const chainId = useChainId();
  return getProcessorClient(chainId);
}

// GraphQL Queries
export const GET_CREATOR_PAYMENTS = `
  query GetCreatorPayments($creator: String!, $first: Int!) {
    paymentProcesseds(
      where: { creator: $creator }
      first: $first
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      linkId
      payer
      creator
      linkType
      amount
      token
      timestampParam
      timestamp_
    }
  }
`;

export const GET_CREATOR_DONATIONS = `
  query GetCreatorDonations($creator: String!, $first: Int!) {
    donationProcesseds(
      where: { creator: $creator }
      first: $first
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      linkId
      donor
      creator
      amount
      platformFee
      token
      message
      timestampParam
      timestamp_
    }
  }
`;

export const GET_CREATOR_PRODUCT_PURCHASES = `
  query GetCreatorProductPurchases($creator: String!, $first: Int!) {
    productPurchaseds(
      where: { creator: $creator }
      first: $first
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      linkId
      buyer
      creator
      amount
      token
      timestampParam
      timestamp_
    }
  }
`;

export const GET_CREATOR_CONTENT_PURCHASES = `
  query GetCreatorContentPurchases($creator: String!, $first: Int!) {
    contentPurchaseds(
      where: { creator: $creator }
      first: $first
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      linkId
      buyer
      creator
      amount
      token
      timestampParam
      timestamp_
    }
  }
`;

export const GET_CREATOR_EARNINGS_WITHDRAWALS = `
  query GetCreatorEarningsWithdrawals($creator: String!) {
    earningsWithdrawns(
      where: { creator: $creator }
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      creator
      totalAmount
      creatorAmount
      platformFeeAmount
      token
      timestamp_
    }
  }
`;

export const GET_LINK_ANALYTICS = `
  query GetLinkAnalytics($linkId: String!) {
    # Payments for this link
    linkPayments: paymentProcesseds(where: { linkId: $linkId }) {
      id
      payer
      amount
      token
      timestamp_
    }
    
    # Donations for this link
    linkDonations: donationProcesseds(where: { linkId: $linkId }) {
      id
      donor
      amount
      token
      timestamp_
    }
    
    # Product purchases for this link
    linkProductPurchases: productPurchaseds(where: { linkId: $linkId }) {
      id
      buyer
      amount
      token
      timestamp_
    }
    
    # Content purchases for this link
    linkContentPurchases: contentPurchaseds(where: { linkId: $linkId }) {
      id
      buyer
      amount
      token
      timestamp_
    }
  }
`;

export const GET_TIME_RANGE_ANALYTICS = `
  query GetTimeRangeAnalytics($creator: String!, $startTime: BigInt!, $endTime: BigInt!) {
    # Payments in time range
    paymentsInRange: paymentProcesseds(
      where: { 
        creator: $creator
        timestamp_gte: $startTime
        timestamp_lte: $endTime
      }
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      linkId
      amount
      token
      timestamp_
    }
    
    # Donations in time range
    donationsInRange: donationProcesseds(
      where: { 
        creator: $creator
        timestamp_gte: $startTime
        timestamp_lte: $endTime
      }
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      linkId
      amount
      token
      timestamp_
    }
    
    # Product purchases in time range
    productPurchasesInRange: productPurchaseds(
      where: { 
        creator: $creator
        timestamp_gte: $startTime
        timestamp_lte: $endTime
      }
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      linkId
      amount
      token
      timestamp_
    }
    
    # Content purchases in time range
    contentPurchasesInRange: contentPurchaseds(
      where: { 
        creator: $creator
        timestamp_gte: $startTime
        timestamp_lte: $endTime
      }
      orderBy: timestamp_
      orderDirection: desc
    ) {
      id
      linkId
      amount
      token
      timestamp_
    }
  }
`;

// Types for GraphQL responses
export interface PaymentProcessed {
  id: string;
  linkId: string;
  payer: string;
  creator: string;
  linkType: number;
  amount: string;
  token: string;
  timestampParam: string;
  timestamp_: string;
}

export interface DonationProcessed {
  id: string;
  linkId: string;
  donor: string;
  creator: string;
  amount: string;
  platformFee: string;
  token: string;
  message: string;
  timestampParam: string;
  timestamp_: string;
}

export interface ProductPurchased {
  id: string;
  linkId: string;
  buyer: string;
  creator: string;
  amount: string;
  token: string;
  timestampParam: string;
  timestamp_: string;
}

export interface ContentPurchased {
  id: string;
  linkId: string;
  buyer: string;
  creator: string;
  amount: string;
  token: string;
  timestampParam: string;
  timestamp_: string;
}

export interface EarningsWithdrawn {
  id: string;
  creator: string;
  totalAmount: string;
  creatorAmount: string;
  platformFeeAmount: string;
  token: string;
  timestamp_: string;
}

export interface CreatorAnalyticsData {
  payments: PaymentProcessed[];
  donations: DonationProcessed[];
  productPurchases: ProductPurchased[];
  contentPurchases: ContentPurchased[];
  earningsWithdrawals: EarningsWithdrawn[];
}

export interface LinkAnalyticsData {
  linkPayments: PaymentProcessed[];
  linkDonations: DonationProcessed[];
  linkProductPurchases: ProductPurchased[];
  linkContentPurchases: ContentPurchased[];
}

// Service functions
export async function fetchCreatorAnalytics(
  creatorAddress: string,
  limit: number = 1000
): Promise<CreatorAnalyticsData> {
  const [payments, donations, productPurchases, contentPurchases, earningsWithdrawals] = await Promise.all([
    processorClient.request(GET_CREATOR_PAYMENTS, { creator: creatorAddress, first: limit }),
    processorClient.request(GET_CREATOR_DONATIONS, { creator: creatorAddress, first: limit }),
    processorClient.request(GET_CREATOR_PRODUCT_PURCHASES, { creator: creatorAddress, first: limit }),
    processorClient.request(GET_CREATOR_CONTENT_PURCHASES, { creator: creatorAddress, first: limit }),
    profileClient.request(GET_CREATOR_EARNINGS_WITHDRAWALS, { creator: creatorAddress }),
  ]) as [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>];

  return {
    payments: (payments.paymentProcesseds as PaymentProcessed[]) || [],
    donations: (donations.donationProcesseds as DonationProcessed[]) || [],
    productPurchases: (productPurchases.productPurchaseds as ProductPurchased[]) || [],
    contentPurchases: (contentPurchases.contentPurchaseds as ContentPurchased[]) || [],
    earningsWithdrawals: (earningsWithdrawals.earningsWithdrawns as EarningsWithdrawn[]) || [],
  };
}

export async function fetchLinkAnalytics(linkId: string): Promise<LinkAnalyticsData> {
  const result = await processorClient.request(GET_LINK_ANALYTICS, { linkId }) as Record<string, unknown>;
  
  return {
    linkPayments: (result.linkPayments as PaymentProcessed[]) || [],
    linkDonations: (result.linkDonations as DonationProcessed[]) || [],
    linkProductPurchases: (result.linkProductPurchases as ProductPurchased[]) || [],
    linkContentPurchases: (result.linkContentPurchases as ContentPurchased[]) || [],
  };
}

export interface TimeRangeAnalyticsData {
  paymentsInRange: PaymentProcessed[];
  donationsInRange: DonationProcessed[];
  productPurchasesInRange: ProductPurchased[];
  contentPurchasesInRange: ContentPurchased[];
}

export async function fetchTimeRangeAnalytics(
  creatorAddress: string,
  startTime: number,
  endTime: number
): Promise<TimeRangeAnalyticsData> {
  const result = await processorClient.request(GET_TIME_RANGE_ANALYTICS, {
    creator: creatorAddress,
    startTime: startTime.toString(),
    endTime: endTime.toString(),
  }) as Record<string, unknown>;

  return {
    paymentsInRange: (result.paymentsInRange as PaymentProcessed[]) || [],
    donationsInRange: (result.donationsInRange as DonationProcessed[]) || [],
    productPurchasesInRange: (result.productPurchasesInRange as ProductPurchased[]) || [],
    contentPurchasesInRange: (result.contentPurchasesInRange as ContentPurchased[]) || [],
  };
}