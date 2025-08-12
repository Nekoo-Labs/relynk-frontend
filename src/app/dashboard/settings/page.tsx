"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletInfo } from "@/components/wallet-info";
import { FeeConfiguration } from "@/components/earnings/fee-configuration";
import {
  CreditCard,
  Shield,
  Bell,
  Palette,
  Link,
  Trash2,
  Save,
  Wallet,
  ExternalLink,
  Percent,
} from "lucide-react";
import NextLink from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("fees");
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading text-foreground">
              ⚙️ Settings
            </h1>
            <p className="text-foreground/60 mt-1">
              Manage your account preferences and configurations.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { id: "fees", icon: Percent, label: "Platform Fees" },
                  { id: "billing", icon: CreditCard, label: "Billing" },
                  { id: "security", icon: Shield, label: "Security" },
                  { id: "notifications", icon: Bell, label: "Notifications" },
                  { id: "appearance", icon: Palette, label: "Appearance" },
                  { id: "domains", icon: Link, label: "Domains" },
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "neutral"}
                    className={`w-full justify-start ${
                      activeTab === item.id
                        ? "bg-main text-main-foreground shadow-shadow"
                        : "hover:bg-secondary-background"
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Platform Fees Tab */}
            {activeTab === "fees" && (
              <>
                {/* Wallet Connection */}
                <WalletInfo />

                {/* Platform Fee Configuration */}
                <FeeConfiguration />
              </>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Billing & Payment Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-base text-foreground/80 mb-2 block">
                      Default Currency
                    </label>
                    <Select defaultValue="usdc">
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usdc">USDC</SelectItem>
                        <SelectItem value="usdt">USDT</SelectItem>
                        <SelectItem value="idrx">IDRX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-base text-foreground/80 mb-2 block">
                      Minimum Payment Amount
                    </label>
                    <Input
                      type="number"
                      placeholder="1.00"
                      className="border-2 border-border shadow-shadow"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-base">
                    <div>
                      <p className="font-heading text-foreground">
                        Earnings & Withdrawals
                      </p>
                      <p className="text-sm text-foreground/60">
                        Manage your earnings, withdrawals, and fee settings
                      </p>
                    </div>
                    <Button variant="neutral" size="sm" asChild>
                      <NextLink
                        href="/dashboard/earnings"
                        className="flex items-center gap-2"
                      >
                        <Wallet className="h-4 w-4" />
                        Manage
                        <ExternalLink className="h-3 w-3" />
                      </NextLink>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Tabs - Coming Soon */}
            {(activeTab === "security" ||
              activeTab === "notifications" ||
              activeTab === "appearance" ||
              activeTab === "domains") && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {activeTab === "security" && <Shield className="h-5 w-5" />}
                    {activeTab === "notifications" && (
                      <Bell className="h-5 w-5" />
                    )}
                    {activeTab === "appearance" && (
                      <Palette className="h-5 w-5" />
                    )}
                    {activeTab === "domains" && <Link className="h-5 w-5" />}
                    {activeTab.charAt(0).toUpperCase() +
                      activeTab.slice(1)}{" "}
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-foreground/60">
                    <div className="text-6xl mb-4">🚧</div>
                    <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                    <p>This settings section is under development.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone - Add to Security tab later */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
