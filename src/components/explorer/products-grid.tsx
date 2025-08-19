"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import {
  ShoppingBag,
  Eye,
  TrendingUp,
  Copy,
  Wallet,
  Star,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface ProductLink {
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

interface ProductsGridProps {
  products: ProductLink[];
  searchTerm: string;
  sortBy: string;
  onPayClick: (product: ProductLink) => void;
  isConnected: boolean;
}

export function ProductsGrid({ 
  products, 
  searchTerm, 
  sortBy, 
  onPayClick, 
  isConnected 
}: ProductsGridProps) {
  const filteredProducts = products.filter((product) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      product.title.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.creatorUsername.toLowerCase().includes(searchLower)
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
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

  const copyToClipboard = (productId: string) => {
    navigator.clipboard.writeText(`https://relynk.app/pay/${productId}`);
    toast.success("Product link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="text-sm text-foreground/60">
        {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''} found
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{product.thumbnail}</div>
                    <div>
                      <CardTitle className="text-lg line-clamp-1">
                        {product.title}
                      </CardTitle>
                      <p className="text-sm text-foreground/60">
                        by @{product.creatorUsername}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    Product
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-foreground/70 text-sm line-clamp-3">
                  {product.description}
                </p>
                
                {/* Product Stats */}
                <div className="flex items-center justify-between text-sm text-foreground/60">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {product.clicks}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      {product.sales}
                    </div>
                  </div>
                  <div className="font-medium text-main text-lg">
                    {product.price}
                  </div>
                </div>

                {/* Rating/Quality Indicator */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-foreground/20'
                      }`} 
                    />
                  ))}
                  <span className="text-xs text-foreground/60 ml-1">
                    4.0 ({product.sales} reviews)
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyToClipboard(product.id)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onPayClick(product)}
                  >
                    <Wallet className="w-4 h-4 mr-1" />
                    {isConnected ? "Buy Now" : "I Want This"}
                  </Button>
                </div>

                {/* Product Features */}
                <div className="flex flex-wrap gap-1 pt-2">
                  <Badge variant="outline" className="text-xs">
                    Digital Product
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Instant Access
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Secure Payment
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {sortedProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🛍️</div>
          <h3 className="text-xl font-heading text-foreground mb-2">
            No products found
          </h3>
          <p className="text-foreground/60">
            {searchTerm.trim() 
              ? "Try adjusting your search terms" 
              : "No products available at the moment"
            }
          </p>
        </motion.div>
      )}
    </div>
  );
}
