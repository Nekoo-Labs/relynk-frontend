"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { SupportedToken } from "@/types/relynk";
import { ChevronDown, Search, Check } from "lucide-react";
import { Address, formatUnits } from "viem";
import { useBalance } from "wagmi";

// Supported tokens for Relynk payment processing
export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    address: "0xA0b86a33E6441E6C5C7C8E0C3C8C8C8C8C8C8C8C" as Address,
    symbol: "USDC",
    name: "USD Coin (Mock)",
    decimals: 6,
    isNative: false,
    chainId: 1, // Ethereum mainnet
  },
  {
    address: "0xB0b86a33E6441E6C5C7C8E0C3C8C8C8C8C8C8C8C" as Address,
    symbol: "USDT",
    name: "Tether USD (Mock)",
    decimals: 6,
    isNative: false,
    chainId: 1, // Ethereum mainnet
  },
  {
    address: "0xC0b86a33E6441E6C5C7C8E0C3C8C8C8C8C8C8C8C" as Address,
    symbol: "IDRX",
    name: "Indonesian Rupiah Token (Mock)",
    decimals: 2,
    isNative: false,
    chainId: 1, // Ethereum mainnet
  },
];

interface TokenSelectorProps {
  selectedToken?: SupportedToken;
  onTokenSelect: (token: SupportedToken) => void;
  userAddress?: `0x${string}`;
  className?: string;
  disabled?: boolean;
}

export function TokenSelector({
  selectedToken,
  onTokenSelect,
  userAddress,
  className,
  disabled = false,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTokens = SUPPORTED_TOKENS.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTokenSelect = (token: SupportedToken) => {
    onTokenSelect(token);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="neutral"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedToken ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                  {selectedToken.symbol.charAt(0)}
                </div>
                <span>{selectedToken.symbol}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedToken.name}
                </Badge>
              </div>
            ) : (
              "Select token..."
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No tokens found
              </div>
            ) : (
              filteredTokens.map((token) => (
                <TokenOption
                  key={token.address}
                  token={token}
                  isSelected={selectedToken?.address === token.address}
                  onSelect={() => handleTokenSelect(token)}
                  userAddress={userAddress}
                />
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface TokenOptionProps {
  token: SupportedToken;
  isSelected: boolean;
  onSelect: () => void;
  userAddress?: `0x${string}`;
}

function TokenOption({
  token,
  isSelected,
  onSelect,
  userAddress,
}: TokenOptionProps) {
  const { data: balance } = useBalance({
    address: userAddress,
    token: token.isNative ? undefined : token.address,
  });

  return (
    <button
      className="w-full p-3 hover:bg-muted/50 flex items-center justify-between transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
          {token.symbol.charAt(0)}
        </div>
        <div className="text-left">
          <div className="font-medium">{token.symbol}</div>
          <div className="text-sm text-muted-foreground">{token.name}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {balance && (
          <div className="text-right">
            <div className="text-sm font-medium">
              {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(
                4
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {balance.symbol}
            </div>
          </div>
        )}
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </div>
    </button>
  );
}

// Simple token selector for forms
interface SimpleTokenSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SimpleTokenSelector({
  value,
  onValueChange,
  className,
  disabled = false,
}: SimpleTokenSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select token" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_TOKENS.map((token) => (
          <SelectItem key={token.address} value={token.address}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                {token.symbol.charAt(0)}
              </div>
              <span>{token.symbol}</span>
              <span className="text-muted-foreground">- {token.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
