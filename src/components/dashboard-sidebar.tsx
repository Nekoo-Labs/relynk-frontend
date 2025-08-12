"use client";

import {
  BarChart3,
  ArrowLeftRight,
  Home,
  Link as LinkIcon,
  Settings,
  User,
  LogOut,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { CreateLinkLauncher } from "@/components/payment/create-link-launcher";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useSiweAuth } from "@/hooks/use-siwe-auth";
import SwitchNetwork from "./ui/switch-network";
import { Button } from "./ui/button";

// Menu items for the dashboard
const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Links",
    url: "/dashboard/links",
    icon: LinkIcon,
  },
  {
    title: "Transactions",
    url: "/dashboard/payments",
    icon: ArrowLeftRight,
  },
  {
    title: "Earnings",
    url: "/dashboard/earnings",
    icon: Wallet,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { address, logout } = useSiweAuth();

  return (
    <Sidebar>
      <SidebarHeader className="border-b-2 border-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-base bg-main text-main-foreground font-heading">
            💰
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-heading">Relynk</span>
            <span className="text-xs text-foreground/60">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className={`w-full transition-all duration-200 ${
                      pathname === item.url
                        ? "bg-main text-main-foreground shadow-shadow rounded-base"
                        : "hover:bg-main hover:rounded-base"
                    }`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Admin menu removed for security - end users should not have access to admin functions */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <CreateLinkLauncher />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t-2 border-border">
        <SidebarMenu className="sm:hidden">
          <SidebarMenuItem>
            <div className="flex flex-col items-center gap-3">
              <SwitchNetwork variant="neutral" size="sm" className="w-full" />
              <div className="bg-main/20 w-full flex items-center gap-2 px-3 py-1.5 rounded-base border border-border">
                <User className="h-4 w-4 text-foreground/60" />
                <span className="text-sm text-center mx-auto text-foreground/80 font-mono">
                  {address
                    ? `${address.slice(0, 6)}...${address.slice(-4)}`
                    : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="hover:bg-main/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
