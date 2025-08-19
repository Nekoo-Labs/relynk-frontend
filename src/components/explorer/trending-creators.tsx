"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import {
  TrendingUp,
  User,
  ExternalLink,
  Crown,
  Star,
  DollarSign,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

interface Creator {
  username: string;
  address: string;
  links: number;
  volume: string;
  rank: number;
  avatar?: string;
  verified?: boolean;
}

interface TrendingCreatorsProps {
  creators: Creator[];
}

export function TrendingCreators({ creators }: TrendingCreatorsProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Star className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Star className="w-4 h-4 text-amber-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-foreground/60" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case 3:
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-secondary-background text-foreground border-border";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-main" />
          Trending Creators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {creators.map((creator, index) => (
          <motion.div
            key={creator.username}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-base border border-border/50 hover:border-main/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Badge className={`${getRankColor(creator.rank)} flex items-center gap-1`}>
                {getRankIcon(creator.rank)}
                #{creator.rank}
              </Badge>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-main/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-main" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">
                      @{creator.username}
                    </span>
                    {creator.verified && (
                      <Star className="w-3 h-3 text-blue-500 fill-current" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-foreground/60">
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      {creator.links} links
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${creator.volume}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Link href={`/${creator.username}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3 h-3 mr-1" />
                View
              </Button>
            </Link>
          </motion.div>
        ))}
        
        {creators.length === 0 && (
          <div className="text-center py-8 text-foreground/60">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No trending creators yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
