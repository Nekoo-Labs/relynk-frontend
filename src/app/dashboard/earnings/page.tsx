"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { EarningsOverview } from "@/components/earnings/earnings-overview";
import { WithdrawEarnings } from "@/components/earnings/withdraw-earnings";
import { FeeConfiguration } from "@/components/earnings/fee-configuration";
import { WithdrawHistory } from "@/components/earnings/withdraw-history";

export default function EarningsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading text-foreground">
              💰 Earnings & Withdrawals
            </h1>
            <p className="text-foreground/60 mt-1">
              Manage your earnings, withdrawals, and fee settings.
            </p>
          </div>
        </div>

        {/* Earnings Overview */}
        <EarningsOverview />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Withdraw Earnings */}
          <WithdrawEarnings />

          {/* Fee Configuration */}
          <FeeConfiguration />
        </div>

        {/* Withdraw History */}
        <WithdrawHistory />
      </div>
    </DashboardLayout>
  );
}
