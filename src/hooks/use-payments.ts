"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import { useProcessorClient } from "@/services/graphql";
import { formatUnits } from "viem";
import { liskSepolia, scrollSepolia, morphHolesky } from "viem/chains";
import { getTokenConfig } from "@/lib/contracts";

// Simple test query to check schema
const TEST_SCHEMA_QUERY = `
  query TestSchema {
    __schema {
      queryType {
        fields {
          name
          type {
            name
          }
        }
      }
    }
  }
`;

// GraphQL Queries - Try different possible field names based on different indexing services
const GET_USER_PAYMENTS = `
  query GetUserPayments($creator: String!, $payer: String!, $first: Int!) {
    # Try Goldsky naming convention
    received: paymentProcesseds(
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
      transactionHash_
    }

    sent: paymentProcesseds(
      where: { payer: $payer }
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
      transactionHash_
    }

    donationsReceived: donationProcesseds(
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
      transactionHash_
    }

    donationsSent: donationProcesseds(
      where: { donor: $payer }
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
      transactionHash_
    }
  }
`;

// HyperIndex query format (for Morph Holesky and Scroll Sepolia)
// Fixed field names based on actual schema - removed block_number and transaction_hash
const GET_USER_PAYMENTS_HYPERINDEX = `
  query GetUserPayments($creator: String!, $payer: String!, $first: Int!) {
    received: RelynkProcessor_PaymentProcessed(
      where: { creator: { _eq: $creator } }
      limit: $first
      order_by: { timestamp: desc }
    ) {
      id
      linkId
      payer
      creator
      linkType
      amount
      token
      timestamp
    }

    sent: RelynkProcessor_PaymentProcessed(
      where: { payer: { _eq: $payer } }
      limit: $first
      order_by: { timestamp: desc }
    ) {
      id
      linkId
      payer
      creator
      linkType
      amount
      token
      timestamp
    }

    donationsReceived: RelynkProcessor_DonationProcessed(
      where: { creator: { _eq: $creator } }
      limit: $first
      order_by: { timestamp: desc }
    ) {
      id
      linkId
      donor
      creator
      amount
      platformFee
      token
      message
      timestamp
    }

    donationsSent: RelynkProcessor_DonationProcessed(
      where: { donor: { _eq: $payer } }
      limit: $first
      order_by: { timestamp: desc }
    ) {
      id
      linkId
      donor
      creator
      amount
      platformFee
      token
      message
      timestamp
    }
  }
`;

export interface PaymentTransaction {
  id: string;
  type: "received" | "sent";
  amount: string;
  formattedAmount: string;
  currency: string;
  from: string;
  to: string;
  status: "completed" | "pending";
  txHash: string;
  timestamp: string;
  linkTitle: string;
  linkId?: string;
  message?: string;
  linkType?: number;
}

export interface PaymentStats {
  totalReceived: string;
  totalSent: string;
  pending: string;
  thisMonth: string;
}

export function usePayments() {
  const { address } = useAccount();
  const chainId = useChainId();
  const processorClient = useProcessorClient();

  const getTokenInfo = (tokenAddress: string) => {
    const tokens = getTokenConfig(chainId);
    const token = Object.values(tokens).find(
      (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    return token || { symbol: "UNKNOWN", decimals: 18 };
  };

  const formatTokenAmount = (amount: string, tokenAddress: string): string => {
    const token = getTokenInfo(tokenAddress);
    const formatted = formatUnits(BigInt(amount), token.decimals);
    return parseFloat(formatted).toFixed(2);
  };

  // Helper function to normalize field names from different indexers
  const normalizePaymentData = (item: any) => ({
    id: item.id,
    amount: item.amount,
    token: item.token,
    payer: item.payer,
    creator: item.creator,
    // Handle different field naming conventions
    transactionHash_: item.transactionHash_ || item.transaction_hash || item.transaction_hash_ || item.id, // Fallback to id if no tx hash
    timestamp_: item.timestamp_ || item.timestamp,
    linkId: item.linkId || item.link_id,
    linkType: item.linkType || item.link_type,
  });

  const normalizeDonationData = (item: any) => ({
    id: item.id,
    amount: item.amount,
    token: item.token,
    donor: item.donor,
    creator: item.creator,
    // Handle different field naming conventions
    transactionHash_: item.transactionHash_ || item.transaction_hash || item.transaction_hash_ || item.id, // Fallback to id if no tx hash
    timestamp_: item.timestamp_ || item.timestamp,
    linkId: item.linkId || item.link_id,
    message: item.message,
    platformFee: item.platformFee || item.platform_fee,
  });

  const processPaymentData = (data: any): PaymentTransaction[] => {
    const transactions: PaymentTransaction[] = [];

    // Process received payments
    data.received?.forEach((rawPayment: any) => {
      const payment = normalizePaymentData(rawPayment);
      const token = getTokenInfo(payment.token);
      const formattedAmount = formatTokenAmount(payment.amount, payment.token);

      transactions.push({
        id: payment.id,
        type: "received",
        amount: `$${formattedAmount}`,
        formattedAmount,
        currency: token.symbol,
        from: payment.payer,
        to: payment.creator,
        status: "completed",
        txHash: payment.transactionHash_,
        timestamp: new Date(
          parseInt(payment.timestamp_) * 1000
        ).toLocaleString(),
        linkTitle: `Payment Link ${payment.linkId.slice(-8)}`,
        linkId: payment.linkId,
        linkType: payment.linkType,
      });
    });

    // Process sent payments
    data.sent?.forEach((rawPayment: any) => {
      const payment = normalizePaymentData(rawPayment);
      const token = getTokenInfo(payment.token);
      const formattedAmount = formatTokenAmount(payment.amount, payment.token);

      transactions.push({
        id: payment.id,
        type: "sent",
        amount: `$${formattedAmount}`,
        formattedAmount,
        currency: token.symbol,
        from: payment.payer,
        to: payment.creator,
        status: "completed",
        txHash: payment.transactionHash_,
        timestamp: new Date(
          parseInt(payment.timestamp_) * 1000
        ).toLocaleString(),
        linkTitle: `Payment Link ${payment.linkId.slice(-8)}`,
        linkId: payment.linkId,
        linkType: payment.linkType,
      });
    });

    // Process received donations
    data.donationsReceived?.forEach((rawDonation: any) => {
      const donation = normalizeDonationData(rawDonation);
      const token = getTokenInfo(donation.token);
      const formattedAmount = formatTokenAmount(
        donation.amount,
        donation.token
      );

      transactions.push({
        id: donation.id,
        type: "received",
        amount: `$${formattedAmount}`,
        formattedAmount,
        currency: token.symbol,
        from: donation.donor,
        to: donation.creator,
        status: "completed",
        txHash: donation.transactionHash_,
        timestamp: new Date(
          parseInt(donation.timestamp_) * 1000
        ).toLocaleString(),
        linkTitle: "Donation",
        linkId: donation.linkId,
        message: donation.message,
      });
    });

    // Process sent donations
    data.donationsSent?.forEach((rawDonation: any) => {
      const donation = normalizeDonationData(rawDonation);
      const token = getTokenInfo(donation.token);
      const formattedAmount = formatTokenAmount(
        donation.amount,
        donation.token
      );

      transactions.push({
        id: donation.id,
        type: "sent",
        amount: `$${formattedAmount}`,
        formattedAmount,
        currency: token.symbol,
        from: donation.donor,
        to: donation.creator,
        status: "completed",
        txHash: donation.transactionHash_,
        timestamp: new Date(
          parseInt(donation.timestamp_) * 1000
        ).toLocaleString(),
        linkTitle: "Donation",
        linkId: donation.linkId,
        message: donation.message,
      });
    });

    // Sort by timestamp (newest first)
    return transactions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const calculateStats = (transactions: PaymentTransaction[]): PaymentStats => {
    const received = transactions
      .filter((t) => t.type === "received")
      .reduce((sum, t) => sum + parseFloat(t.formattedAmount), 0);

    const sent = transactions
      .filter((t) => t.type === "sent")
      .reduce((sum, t) => sum + parseFloat(t.formattedAmount), 0);

    // Calculate this month's transactions
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonth = transactions
      .filter((t) => {
        const txDate = new Date(t.timestamp);
        return (
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + parseFloat(t.formattedAmount), 0);

    return {
      totalReceived: `$${received.toFixed(2)}`,
      totalSent: `$${sent.toFixed(2)}`,
      pending: "$0.00", // No pending transactions in completed data
      thisMonth: `$${thisMonth.toFixed(2)}`,
    };
  };

  const {
    data: paymentsData,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["payments", address, chainId],
    queryFn: async () => {
      if (!address) {
        return {
          payments: [],
          stats: {
            totalReceived: "$0.00",
            totalSent: "$0.00",
            pending: "$0.00",
            thisMonth: "$0.00",
          },
        };
      }

      // Try different query formats based on the network/indexer
      let data;

      // Determine which query format to use based on chain ID
      const isGoldsky = chainId === liskSepolia.id; // Lisk Sepolia uses Goldsky
      const isHyperIndex = chainId === scrollSepolia.id || chainId === morphHolesky.id; // Scroll Sepolia or Morph Holesky use HyperIndex



      try {
        if (isGoldsky) {
          console.log("Using Goldsky format for Lisk Sepolia");
          // Use Goldsky format for Lisk Sepolia
          data = await processorClient.request(GET_USER_PAYMENTS, {
            creator: address.toLowerCase(),
            payer: address.toLowerCase(),
            first: 100,
          });

        } else if (isHyperIndex) {

          // Use HyperIndex format for Scroll Sepolia and Morph Holesky
          data = await processorClient.request(GET_USER_PAYMENTS_HYPERINDEX, {
            creator: address.toLowerCase(),
            payer: address.toLowerCase(),
            first: 100,
          });

        } else {
          // Default to Goldsky format and fallback to HyperIndex
          try {
            data = await processorClient.request(GET_USER_PAYMENTS, {
              creator: address.toLowerCase(),
              payer: address.toLowerCase(),
              first: 100,
            });
          } catch (goldSkyError) {

            data = await processorClient.request(GET_USER_PAYMENTS_HYPERINDEX, {
              creator: address.toLowerCase(),
              payer: address.toLowerCase(),
              first: 100,
            });
          }
        }
      } catch (error) {
        console.error("Payment query failed:", error instanceof Error ? error.message : String(error));

        // Return empty data instead of throwing to prevent app crash
        return {
          payments: [],
          stats: {
            totalReceived: "$0.00",
            totalSent: "$0.00",
            pending: "$0.00",
            thisMonth: "$0.00",
          },
        };
      }

      const processedPayments = processPaymentData(data as Parameters<typeof processPaymentData>[0]);
      const calculatedStats = calculateStats(processedPayments);

      return {
        payments: processedPayments,
        stats: calculatedStats,
      };
    },
    enabled: !!address, // Only run query when address is available
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Disable aggressive refetching
    refetchOnMount: false, // Only refetch if stale
    // Remove refetchInterval to stop constant polling
    retry: (failureCount, error) => {
      // Don't retry if it's a GraphQL schema error
      if (error instanceof Error && (
        error.message.includes("field") && error.message.includes("not found") ||
        error.message.includes("Cannot query field") ||
        error.message.includes("validation-failed")
      )) {
        console.log("Schema error detected, not retrying:", error.message);
        return false;
      }
      return failureCount < 1; // Reduce retries to prevent spam
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return {
    payments: paymentsData?.payments || [],
    stats: paymentsData?.stats || {
      totalReceived: "$0.00",
      totalSent: "$0.00",
      pending: "$0.00",
      thisMonth: "$0.00",
    },
    isLoading,
    isRefetching,
    error: error?.message || null,
    refetch,
  };
}
