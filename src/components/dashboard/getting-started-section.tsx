"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import {
  User,
  Palette,
  Link as LinkIcon,
  Users,
  DollarSign,
  Mail,
  Newspaper,
  TrendingUp,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useProfileRegistry } from "@/hooks/use-profile-registry";
import { useAccount } from "wagmi";
import { useAnalytics } from "@/hooks/use-analytics";
import { useUserPaymentLinks } from "@/hooks/use-payment-links";
import { GettingStartedIllustration } from "./getting-started-illustration";

interface GettingStartedCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted?: boolean;
  href?: string;
  onClick?: () => void;
  completedText?: string;
}

function GettingStartedCard({
  title,
  description,
  icon,
  isCompleted = false,
  href,
  onClick,
  completedText,
}: GettingStartedCardProps) {
  const cardContent = (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 group cursor-pointer ${
      isCompleted 
        ? "bg-main/10 border-main/30" 
        : "bg-secondary-background/50 border-border hover:border-main/50"
    }`}>
      <CardContent className="p-6">
        {/* Completion indicator */}
        {isCompleted && (
          <div className="absolute top-3 right-3">
            <div className="w-6 h-6 rounded-full bg-main flex items-center justify-center">
              <Check className="w-4 h-4 text-main-foreground" />
            </div>
          </div>
        )}
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
            isCompleted 
              ? "bg-main/20 text-main" 
              : "bg-foreground/10 text-foreground/60 group-hover:bg-main/20 group-hover:text-main"
          }`}>
            {icon}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-heading text-lg text-foreground">
              {title}
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {isCompleted && completedText ? completedText : description}
            </p>
          </div>
          
          {isCompleted && (
            <Badge variant="default" className="bg-main/20 text-main border-main/30">
              Completed ✨
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick}>
        {cardContent}
      </div>
    );
  }

  return cardContent;
}

export function GettingStartedSection() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { address } = useAccount();
  const { useGetProfileByOwner } = useProfileRegistry();

  // Get user's profile to check completion status
  const { data: profileResult } = useGetProfileByOwner(address!);
  const [profile, username] = (profileResult as [unknown, string] | undefined) || [null, ""];
  const hasProfile = !!profile;

  // Get user's analytics and payment links data
  const { stats } = useAnalytics();
  const { data: userLinks = [] } = useUserPaymentLinks();

  // Check completion status based on real data
  const hasCreatedLinks = userLinks.length > 0;
  const hasMadeSales = stats.totalPayments > 0;
  const hasClicks = stats.totalClicks > 0;
  const hasEarnings = parseFloat(stats.totalVolumeUSD || "0") > 0;

  const gettingStartedItems = [
    {
      title: "Welcome aboard",
      description: "Create your Relynk account and connect your wallet.",
      completedText: "Your wallet is connected and ready to go!",
      icon: <User className="w-8 h-8" />,
      isCompleted: !!address,
      href: undefined,
    },
    {
      title: "Make an impression",
      description: "Customize your profile and set up your username.",
      completedText: `Your profile @${username} is looking great!`,
      icon: <Palette className="w-8 h-8" />,
      isCompleted: hasProfile,
      href: "/dashboard/profile",
    },
    {
      title: "Create your first link",
      description: "Create your first payment link or product.",
      completedText: "You've created your first link! Keep going!",
      icon: <LinkIcon className="w-8 h-8" />,
      isCompleted: hasCreatedLinks,
      href: "/dashboard/links",
    },
    {
      title: "Money inbound",
      description: "Set up your payment preferences and withdrawal methods.",
      completedText: "Your payment settings are configured perfectly!",
      icon: <TrendingUp className="w-8 h-8" />,
      isCompleted: hasEarnings, // Using earnings as a proxy for payment setup
      href: "/dashboard/earnings",
    },
    {
      title: "Making waves",
      description: "Share your links and start building your audience.",
      completedText: "Your content is making waves across the web!",
      icon: <Newspaper className="w-8 h-8" />,
      isCompleted: hasClicks && hasCreatedLinks, // Has both links and engagement
      href: "/dashboard/links",
    },
  ];

  const completedCount = gettingStartedItems.filter(item => item.isCompleted).length;
  const totalCount = gettingStartedItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-6 bg-secondary-background/30 rounded-2xl border border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-heading text-foreground">
            Getting started
          </h2>
          <p className="text-foreground/60">
            Complete these steps to make the most of Relynk
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="text-sm text-foreground/60">
              {completedCount}/{totalCount} completed
            </div>
            <div className="w-24 h-2 bg-secondary-background rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-main rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
          
          {/* Collapse/Expand button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            Show {isExpanded ? "less" : "more"}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {gettingStartedItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <GettingStartedCard {...item} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Illustration */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <GettingStartedIllustration />
        </motion.div>
      )}
    </motion.div>
  );
}
