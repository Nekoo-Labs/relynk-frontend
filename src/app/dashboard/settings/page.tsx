"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletInfo } from "@/components/wallet-info";
import {
  User,
  CreditCard,
  Shield,
  Bell,
  Palette,
  Link,
  Trash2,
  Save,
} from "lucide-react";

export default function SettingsPage() {
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
                  { icon: User, label: "Profile", active: true },
                  { icon: CreditCard, label: "Billing", active: false },
                  { icon: Shield, label: "Security", active: false },
                  { icon: Bell, label: "Notifications", active: false },
                  { icon: Palette, label: "Appearance", active: false },
                  { icon: Link, label: "Domains", active: false },
                ].map((item, index) => (
                  <Button
                    key={index}
                    variant={item.active ? "default" : "neutral"}
                    className={`w-full justify-start ${
                      item.active
                        ? "bg-main text-main-foreground shadow-shadow"
                        : "hover:bg-secondary-background"
                    }`}
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
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-base text-foreground/80 mb-2 block">
                      First Name
                    </label>
                    <Input
                      placeholder="John"
                      className="border border-border shadow-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-base text-foreground/80 mb-2 block">
                      Last Name
                    </label>
                    <Input
                      placeholder="Doe"
                      className="border border-border shadow-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-base text-foreground/80 mb-2 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    className="border border-border shadow-shadow"
                  />
                </div>

                <div>
                  <label className="text-sm font-base text-foreground/80 mb-2 block">
                    Bio
                  </label>
                  <textarea
                    placeholder="Tell us about yourself..."
                    className="w-full min-h-[100px] px-3 py-2 border border-border rounded-base shadow-shadow bg-background text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-main"
                  />
                </div>

                <Button className="bg-main text-main-foreground hover:bg-main/90 shadow-shadow">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Wallet Connection */}
            <WalletInfo />

            {/* Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-base text-foreground/80 mb-2 block">
                    Default Currency
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-base shadow-shadow bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-main">
                    <option>USD ($)</option>
                    <option>USDC</option>
                    <option>USDT</option>
                    <option>IDRX</option>
                  </select>
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
                      Auto-withdraw
                    </p>
                    <p className="text-sm text-foreground/60">
                      Automatically withdraw funds when threshold is reached
                    </p>
                  </div>
                  <Button variant="neutral" size="sm">
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-red-200 rounded-base bg-red-50">
                  <h3 className="font-heading text-red-800 mb-2">
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-600 mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <Button
                    variant="neutral"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
