"use client";

import { Button } from "./button";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { liskSepolia, scrollSepolia, morphHolesky } from "viem/chains";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SwitchNetworkProps = {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
};

// App-supported chains (extend here when adding more)
const APP_SUPPORTED_CHAINS = [liskSepolia, scrollSepolia, morphHolesky] as const;

export function SwitchNetwork({
  className,
  variant,
  size,
}: SwitchNetworkProps) {
  const { isConnected, chain: accountChain } = useAccount();
  const hookChainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const activeChainId = accountChain?.id ?? hookChainId;
  const isSupported = APP_SUPPORTED_CHAINS.some((c) => c.id === activeChainId);

  if (!isConnected) {
    return null;
  }

  const currentName = APP_SUPPORTED_CHAINS.find(
    (c) => c.id === activeChainId
  )?.name;

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          disabled={isPending}
          variant={variant}
          size={size}
          className={cn("", className)}
          aria-label="Switch Network"
        >
          {isSupported ? currentName : "Wrong network · Switch"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="flex flex-col gap-1">
          {APP_SUPPORTED_CHAINS.map((chain) => (
            <Button
              key={chain.id}
              variant={activeChainId === chain.id ? "default" : "neutral"}
              size="sm"
              disabled={isPending}
              className="justify-start"
              onClick={() => {
                try {
                  switchChain({ chainId: chain.id });
                } catch (err) {
                  console.error("Switch chain failed", err);
                }
              }}
            >
              {chain.name}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SwitchNetwork;
