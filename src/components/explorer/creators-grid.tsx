"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import {
  User,
  Users,
  DollarSign,
  Link as LinkIcon,
  ExternalLink,
  Star,
  Calendar,
  MapPin,
} from "lucide-react";
import Link from "next/link";

interface Creator {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  address: string;
  followers: number;
  totalLinks: number;
  totalVolume: string;
  verified: boolean;
  avatar: string;
  joinedDate: string;
}

interface CreatorsGridProps {
  creators: Creator[];
  searchTerm: string;
}

export function CreatorsGrid({ creators, searchTerm }: CreatorsGridProps) {
  const filteredCreators = creators.filter((creator) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      creator.username.toLowerCase().includes(searchLower) ||
      creator.displayName.toLowerCase().includes(searchLower) ||
      creator.bio.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="text-sm text-foreground/60">
        {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''} found
      </div>

      {/* Creators Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCreators.map((creator, index) => (
          <motion.div
            key={creator.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 group">
              <CardContent className="p-6 space-y-4">
                {/* Creator Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-main/20 flex items-center justify-center text-2xl">
                      {creator.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg text-foreground">
                          {creator.displayName}
                        </h3>
                        {creator.verified && (
                          <Star className="w-4 h-4 text-blue-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-foreground/60">
                        @{creator.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-foreground/70 line-clamp-2">
                  {creator.bio}
                </p>

                {/* Stats */}
                {/* <div className="grid grid-cols-3 gap-4 py-3 border-t border-border/50">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-foreground/60" />
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {creator.followers.toLocaleString()}
                    </div>
                    <div className="text-xs text-foreground/60">Followers</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <LinkIcon className="w-4 h-4 text-foreground/60" />
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {creator.totalLinks}
                    </div>
                    <div className="text-xs text-foreground/60">Links</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="w-4 h-4 text-foreground/60" />
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      ${creator.totalVolume}
                    </div>
                    <div className="text-xs text-foreground/60">Volume</div>
                  </div>
                </div> */}

                {/* Joined Date */}
                {/* <div className="flex items-center gap-2 text-xs text-foreground/60">
                  <Calendar className="w-3 h-3" />
                  Joined {new Date(creator.joinedDate).toLocaleDateString()}
                </div> */}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/${creator.username}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <User className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                  </Link>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Navigate to creator's links
                      window.location.href = `/${creator.username}`;
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Links
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCreators.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-heading text-foreground mb-2">
            No creators found
          </h3>
          <p className="text-foreground/60">
            {searchTerm.trim() 
              ? "Try adjusting your search terms" 
              : "No creators available at the moment"
            }
          </p>
        </motion.div>
      )}
    </div>
  );
}
