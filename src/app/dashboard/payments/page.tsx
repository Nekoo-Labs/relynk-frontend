"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayments } from "@/hooks/use-payments";
import { useAccount } from "wagmi";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CreditCard,
  ExternalLink,
  Filter,
  Search,
  RefreshCw,
  Wallet,
} from "lucide-react";

export default function PaymentsPage() {
  const { isConnected } = useAccount();
  const { payments, stats, isLoading, error, isRefetching, refetch } =
    usePayments();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "received" | "sent">(
    "all"
  );

  // Filter payments based on search term and type
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.linkTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || payment.type === filterType;

    return matchesSearch && matchesType;
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openEtherscan = (txHash: string) => {
    // You can customize this URL based on your network
    window.open(
      `${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/tx/${txHash}`,
      "_blank"
    );
  };

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Wallet className="h-12 w-12 text-foreground/40 mx-auto" />
            <h2 className="text-xl font-heading text-foreground">
              Connect Your Wallet
            </h2>
            <p className="text-foreground/60">
              Please connect your wallet to view your payment history.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading text-foreground">
              💰 Payments
            </h1>
            <p className="text-foreground/60 mt-1">
              Track all your payment transactions and history.
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            variant="neutral"
            className="border border-border shadow-shadow"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                isLoading || isRefetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>

        {/* Payment Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading || isRefetching ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Total Received"
                value={stats.totalReceived}
                icon={<ArrowDownLeft className="h-4 w-4 text-chart-4" />}
              />
              <StatCard
                title="Total Sent"
                value={stats.totalSent}
                icon={<ArrowUpRight className="h-4 w-4 text-chart-1" />}
              />
              <StatCard
                title="Pending"
                value={stats.pending}
                icon={<Clock className="h-4 w-4 text-chart-3" />}
              />
              <StatCard
                title="This Month"
                value={stats.thisMonth}
                icon={<CreditCard className="h-4 w-4 text-chart-2" />}
              />
            </>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/60" />
                  <Input
                    placeholder="Search by transaction hash, address, or link title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border border-border shadow-shadow"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground/60">
                  Filter by type:
                </span>
                <div className="flex gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "received", label: "Received" },
                    { key: "sent", label: "Sent" },
                  ].map((filter) => (
                    <Button
                      key={filter.key}
                      variant={
                        filterType === filter.key ? "default" : "neutral"
                      }
                      size="sm"
                      onClick={() => setFilterType(filter.key as any)}
                      className="border border-border"
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Transaction History ({filteredPayments.length})
              {error && (
                <Badge variant="destructive" className="ml-2">
                  Error loading data
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border border-border rounded-base bg-secondary-background"
                  >
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-base" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-foreground/60">
                  Failed to load payment history: {error}
                </div>
                <Button
                  onClick={() => refetch()}
                  variant="neutral"
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-foreground/60">
                  {payments.length === 0
                    ? "No payment transactions found."
                    : "No transactions match your search criteria."}
                </div>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-20rem)]">
                {filteredPayments.map((payment, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border border-border rounded-base bg-secondary-background hover:bg-background transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-base ${
                          payment.type === "received"
                            ? "bg-chart-4/10 text-chart-4"
                            : "bg-chart-1/10 text-chart-1"
                        }`}
                      >
                        {payment.type === "received" ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-foreground">
                            {payment.amount}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {payment.currency}
                          </Badge>
                          <StatusBadge status={payment.status} />
                        </div>
                        <div className="text-sm text-foreground/60">
                          {payment.linkTitle}
                          {payment.message && (
                            <span className="text-foreground/40 ml-2">
                              • {payment.message}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-foreground/40">
                          {payment.timestamp}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm text-foreground/60">
                        From: {formatAddress(payment.from)}
                      </div>
                      <div className="text-sm text-foreground/60">
                        To: {formatAddress(payment.to)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground/40">
                        <span>{formatAddress(payment.txHash)}</span>
                        <Button
                          variant="neutral"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-main/10"
                          onClick={() => openEtherscan(payment.txHash)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
