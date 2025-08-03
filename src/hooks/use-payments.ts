"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { processorClient } from "@/services/graphql";
import { formatUnits } from "viem";
import { SUPPORTED_TOKENS } from "@/lib/contracts";

// GraphQL Queries
const GET_USER_PAYMENTS = `
  query GetUserPayments($creator: String!, $payer: String!, $first: Int!) {
    # Payments received by the user
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
    
    # Payments sent by the user
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
    
    # Donations received
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
    
    # Donations sent
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

  const getTokenInfo = (tokenAddress: string) => {
    const token = Object.values(SUPPORTED_TOKENS).find(
      (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    return token || { symbol: "UNKNOWN", decimals: 18 };
  };

  const formatTokenAmount = (amount: string, tokenAddress: string): string => {
    const token = getTokenInfo(tokenAddress);
    const formatted = formatUnits(BigInt(amount), token.decimals);
    return parseFloat(formatted).toFixed(2);
  };

  const processPaymentData = (data: any): PaymentTransaction[] => {
    const transactions: PaymentTransaction[] = [];

    // Process received payments
    data.received?.forEach((payment: any) => {
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
    data.sent?.forEach((payment: any) => {
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
    data.donationsReceived?.forEach((donation: any) => {
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
    data.donationsSent?.forEach((donation: any) => {
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
    queryKey: ["payments", address],
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

      const data = await processorClient.request(GET_USER_PAYMENTS, {
        creator: address.toLowerCase(),
        payer: address.toLowerCase(),
        first: 100, // Fetch last 100 transactions
      });

      const processedPayments = processPaymentData(data);
      const calculatedStats = calculateStats(processedPayments);

      return {
        payments: processedPayments,
        stats: calculatedStats,
      };
    },
    enabled: !!address, // Only run query when address is available
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 3, // Retry failed requests 3 times
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
