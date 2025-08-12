"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SiweAuthGuard } from "@/components/siwe-auth-guard";
import { useSiweAuth } from "@/hooks/use-siwe-auth";
import { Button } from "@/components/ui/button";
import { SwitchNetwork } from "@/components/ui/switch-network";
import { LogOut, User } from "lucide-react";
import DashboardHeaderSheet from "./dashboard-header-sheet";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { logout, address } = useSiweAuth();

  return (
    <SiweAuthGuard>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <header className="sticky top-0 bg-background z-10 isolate py-8.5 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-border" />
              <h1 className="text-lg font-heading text-foreground">
                Dashboard
              </h1>
            </div>
            <DashboardHeaderSheet address={address} logout={logout} />
            {/* Network Switch, User Info and Logout */}
            <div className="hidden sm:flex items-center gap-3">
              <SwitchNetwork variant="neutral" size="sm" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-base bg-secondary-background/50 border border-border">
                <User className="h-4 w-4 text-foreground/60" />
                <span className="text-sm text-foreground/80 font-mono">
                  {address
                    ? `${address.slice(0, 6)}...${address.slice(-4)}`
                    : ""}
                </span>
              </div>
              <Button
                variant="neutral"
                size="sm"
                onClick={logout}
                className="glow-hover hover:scale-105 transition-all duration-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </SiweAuthGuard>
  );
}
