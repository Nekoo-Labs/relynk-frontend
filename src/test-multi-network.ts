/**
 * Test script to verify multi-network GraphQL endpoint configuration
 * This file can be used to test that the correct endpoints are being used
 * for different networks.
 */

import { liskSepolia, scrollSepolia, morphHolesky, mantleSepoliaTestnet } from 'viem/chains';
import { celoSepolia } from '@/lib/wagmi-config';
import { getProfileClient, getProcessorClient } from '@/services/graphql';
import { getContractConfig, getTokenConfig, getChainConfig } from '@/lib/contracts';

// Test function to verify network configurations
export function testMultiNetworkConfig() {
  console.log('=== Testing Multi-Network Configuration ===\n');

  // Test Lisk Sepolia
  console.log('🔗 Lisk Sepolia (Chain ID: 4202)');
  const liskProfileClient = getProfileClient(liskSepolia.id);
  const liskProcessorClient = getProcessorClient(liskSepolia.id);
  const liskContracts = getContractConfig(liskSepolia.id);
  const liskTokens = getTokenConfig(liskSepolia.id);
  const liskChain = getChainConfig(liskSepolia.id);

  console.log('  Profile Client URL:', (liskProfileClient as unknown as { url?: string }).url);
  console.log('  Processor Client URL:', (liskProcessorClient as unknown as { url?: string }).url);
  console.log('  ProfileRegistry Address:', liskContracts.ProfileRegistry.address);
  console.log('  RelynkProcessor Address:', liskContracts.RelynkProcessor.address);
  console.log('  Supported Tokens:', Object.keys(liskTokens));
  console.log('  Chain Name:', liskChain.name);
  console.log('');

  // Test Scroll Sepolia
  console.log('🔗 Scroll Sepolia (Chain ID: 534351)');
  const scrollProfileClient = getProfileClient(scrollSepolia.id);
  const scrollProcessorClient = getProcessorClient(scrollSepolia.id);
  const scrollContracts = getContractConfig(scrollSepolia.id);
  const scrollTokens = getTokenConfig(scrollSepolia.id);
  const scrollChain = getChainConfig(scrollSepolia.id);

  console.log('  Profile Client URL:', (scrollProfileClient as unknown as { url?: string }).url);
  console.log('  Processor Client URL:', (scrollProcessorClient as unknown as { url?: string }).url);
  console.log('  ProfileRegistry Address:', scrollContracts.ProfileRegistry.address);
  console.log('  RelynkProcessor Address:', scrollContracts.RelynkProcessor.address);
  console.log('  Supported Tokens:', Object.keys(scrollTokens));
  console.log('  Chain Name:', scrollChain.name);
  console.log('');

  // Test Morph Holesky
  console.log('🔗 Morph Holesky (Chain ID: 2810)');
  const morphProfileClient = getProfileClient(morphHolesky.id);
  const morphProcessorClient = getProcessorClient(morphHolesky.id);
  const morphContracts = getContractConfig(morphHolesky.id);
  const morphTokens = getTokenConfig(morphHolesky.id);
  const morphChain = getChainConfig(morphHolesky.id);

  console.log('  Profile Client URL:', (morphProfileClient as unknown as { url?: string }).url);
  console.log('  Processor Client URL:', (morphProcessorClient as unknown as { url?: string }).url);
  console.log('  ProfileRegistry Address:', morphContracts.ProfileRegistry.address);
  console.log('  RelynkProcessor Address:', morphContracts.RelynkProcessor.address);
  console.log('  Supported Tokens:', Object.keys(morphTokens));
  console.log('  Chain Name:', morphChain.name);
  console.log('');

  // Test Celo Sepolia
  console.log('🔗 Celo Sepolia (Chain ID: 11142220)');
  const celoProfileClient = getProfileClient(celoSepolia.id);
  const celoProcessorClient = getProcessorClient(celoSepolia.id);
  const celoContracts = getContractConfig(celoSepolia.id);
  const celoTokens = getTokenConfig(celoSepolia.id);
  const celoChain = getChainConfig(celoSepolia.id);

  console.log('  Profile Client URL:', (celoProfileClient as unknown as { url?: string }).url);
  console.log('  Processor Client URL:', (celoProcessorClient as unknown as { url?: string }).url);
  console.log('  ProfileRegistry Address:', celoContracts.ProfileRegistry.address);
  console.log('  RelynkProcessor Address:', celoContracts.RelynkProcessor.address);
  console.log('  Supported Tokens:', Object.keys(celoTokens));
  console.log('  Chain Name:', celoChain.name);
  console.log('');

    // Test Mantle Sepolia
  console.log('🔗 Celo Sepolia (Chain ID: 11142220)');
  const mantleProfileClient = getProfileClient(mantleSepoliaTestnet.id);
  const mantleProcessorClient = getProcessorClient(mantleSepoliaTestnet.id);
  const mantleContracts = getContractConfig(mantleSepoliaTestnet.id);
  const mantleTokens = getTokenConfig(mantleSepoliaTestnet.id);
  const mantleChain = getChainConfig(mantleSepoliaTestnet.id);

  console.log('  Profile Client URL:', (mantleProfileClient as unknown as { url?: string }).url);
  console.log('  Processor Client URL:', (mantleProcessorClient as unknown as { url?: string }).url);
  console.log('  ProfileRegistry Address:', mantleContracts.ProfileRegistry.address);
  console.log('  RelynkProcessor Address:', mantleContracts.RelynkProcessor.address);
  console.log('  Supported Tokens:', Object.keys(mantleTokens));
  console.log('  Chain Name:', mantleChain.name);
  console.log('');


  // Test unsupported chain (should fallback to Lisk Sepolia)
  console.log('🔗 Unsupported Chain (Chain ID: 999999)');
  const fallbackProfileClient = getProfileClient(999999);
  const fallbackProcessorClient = getProcessorClient(999999);
  const fallbackContracts = getContractConfig(999999);
  const fallbackTokens = getTokenConfig(999999);
  const fallbackChain = getChainConfig(999999);

  console.log('  Profile Client URL (fallback):', (fallbackProfileClient as unknown as { url?: string }).url);
  console.log('  Processor Client URL (fallback):', (fallbackProcessorClient as unknown as { url?: string }).url);
  console.log('  ProfileRegistry Address (fallback):', fallbackContracts.ProfileRegistry.address);
  console.log('  RelynkProcessor Address (fallback):', fallbackContracts.RelynkProcessor.address);
  console.log('  Supported Tokens (fallback):', Object.keys(fallbackTokens));
  console.log('  Chain Name (fallback):', fallbackChain.name);
  console.log('');

  console.log('✅ Multi-network configuration test completed!');
}

// Test GraphQL endpoint connectivity (optional - requires network access)
export async function testGraphQLConnectivity() {
  console.log('=== Testing GraphQL Endpoint Connectivity ===\n');

  try {
    // Test Lisk Sepolia (Goldsky)
    console.log('🔗 Testing Lisk Sepolia (Goldsky) connectivity...');
    const liskClient = getProcessorClient(liskSepolia.id);
    
    // Simple test query to check if endpoint is accessible
    const liskTestQuery = `
      query TestConnection {
        paymentProcesseds(first: 1) {
          id
        }
      }
    `;
    
    const liskResult = await liskClient.request(liskTestQuery);
    console.log('  ✅ Lisk Sepolia endpoint is accessible');
    console.log('  Sample data:', liskResult);
    console.log('');

    // Test Scroll Sepolia (HyperIndex)
    console.log('🔗 Testing Scroll Sepolia (HyperIndex) connectivity...');
    const scrollClient = getProcessorClient(scrollSepolia.id);
    
    const scrollResult = await scrollClient.request(liskTestQuery);
    console.log('  ✅ Scroll Sepolia endpoint is accessible');
    console.log('  Sample data:', scrollResult);
    console.log('');

  } catch (error) {
    console.error('❌ GraphQL connectivity test failed:', error);
  }
}

// Export for use in development/testing
if (typeof window !== 'undefined') {
  (window as unknown as { testMultiNetworkConfig?: typeof testMultiNetworkConfig; testGraphQLConnectivity?: typeof testGraphQLConnectivity }).testMultiNetworkConfig = testMultiNetworkConfig;
  (window as unknown as { testMultiNetworkConfig?: typeof testMultiNetworkConfig; testGraphQLConnectivity?: typeof testGraphQLConnectivity }).testGraphQLConnectivity = testGraphQLConnectivity;
}
