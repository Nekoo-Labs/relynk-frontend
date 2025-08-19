"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import {
  FileText,
  Eye,
  TrendingUp,
  Copy,
  Wallet,
  Clock,
  BookOpen,
  Video,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";

interface ContentLink {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorUsername: string;
  type: string;
  price: string;
  clicks: number;
  sales: number;
  createdAt: string;
  isActive: boolean;
  thumbnail: string;
}

interface ContentGridProps {
  content: ContentLink[];
  searchTerm: string;
  sortBy: string;
  onPayClick: (content: ContentLink) => void;
  isConnected: boolean;
}

const getContentTypeIcon = (title: string) => {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('video') || titleLower.includes('tutorial')) {
    return <Video className="w-4 h-4" />;
  }
  if (titleLower.includes('audio') || titleLower.includes('podcast')) {
    return <Headphones className="w-4 h-4" />;
  }
  return <BookOpen className="w-4 h-4" />;
};

const getContentDuration = () => {
  // Mock duration - in real app this would come from content metadata
  const durations = ["5 min read", "15 min video", "30 min course", "2 hour series"];
  return durations[Math.floor(Math.random() * durations.length)];
};

export function ContentGrid({ 
  content, 
  searchTerm, 
  sortBy, 
  onPayClick, 
  isConnected 
}: ContentGridProps) {
  const filteredContent = content.filter((item) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.creatorUsername.toLowerCase().includes(searchLower)
    );
  });

  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.clicks - a.clicks;
      case "sales":
        return b.sales - a.sales;
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const copyToClipboard = (contentId: string) => {
    navigator.clipboard.writeText(`https://relynk.app/pay/${contentId}`);
    toast.success("Content link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="text-sm text-foreground/60">
        {sortedContent.length} content item{sortedContent.length !== 1 ? 's' : ''} found
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedContent.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{item.thumbnail}</div>
                    <div>
                      <CardTitle className="text-lg line-clamp-1">
                        {item.title}
                      </CardTitle>
                      <p className="text-sm text-foreground/60">
                        by @{item.creatorUsername}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Content
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-foreground/70 text-sm line-clamp-3">
                  {item.description}
                </p>
                
                {/* Content Meta */}
                <div className="flex items-center gap-4 text-xs text-foreground/60">
                  <div className="flex items-center gap-1">
                    {getContentTypeIcon(item.title)}
                    <span>Educational</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getContentDuration()}
                  </div>
                </div>
                
                {/* Content Stats */}
                <div className="flex items-center justify-between text-sm text-foreground/60">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {item.clicks}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      {item.sales}
                    </div>
                  </div>
                  <div className="font-medium text-main text-lg">
                    {item.price}
                  </div>
                </div>

                {/* Content Features */}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    Premium Content
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Lifetime Access
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Downloadable
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyToClipboard(item.id)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onPayClick(item)}
                  >
                    <Wallet className="w-4 h-4 mr-1" />
                    {isConnected ? "Access Now" : "I Want This"}
                  </Button>
                </div>

                {/* Content Preview */}
                <div className="bg-secondary-background/50 rounded-base p-3 text-xs text-foreground/60">
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="w-3 h-3" />
                    <span className="font-medium">Preview Available</span>
                  </div>
                  <p>Get a sneak peek before purchasing this content</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {sortedContent.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-heading text-foreground mb-2">
            No content found
          </h3>
          <p className="text-foreground/60">
            {searchTerm.trim() 
              ? "Try adjusting your search terms" 
              : "No content available at the moment"
            }
          </p>
        </motion.div>
      )}
    </div>
  );
}
