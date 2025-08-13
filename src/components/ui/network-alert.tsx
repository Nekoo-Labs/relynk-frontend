"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAccount } from "wagmi";
import { liskSepolia, scrollSepolia, morphHolesky } from "viem/chains";
import { Button } from "./button";
import { SwitchNetwork } from "./switch-network";

// Keep this in sync with switch-network.tsx
const APP_SUPPORTED_CHAINS = [liskSepolia, scrollSepolia, morphHolesky] as const;

export function NetworkAlert() {
  const { isConnected, chain: accountChain } = useAccount();

  // Use the connected wallet's chain as the source of truth
  const activeChainId = accountChain?.id;
  const isSupported = useMemo(
    () => APP_SUPPORTED_CHAINS.some((c) => c.id === activeChainId),
    [activeChainId]
  );

  // Preferred default if user is on unsupported network
  const target = APP_SUPPORTED_CHAINS[0];

  const [visible, setVisible] = useState(true);
  useEffect(() => {
    // Reset visibility when chain changes
    setVisible(true);
  }, [activeChainId]);

  // Show when connected and the chain is unknown or unsupported
  const isUnsupported = !activeChainId || !isSupported;
  if (!isConnected || !isUnsupported || !visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-[calc(100%-2rem)] max-w-md sm:max-w-lg rounded-xl border border-red-200 bg-red-50/80 backdrop-blur p-3 sm:p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-red-800">Wrong network detected</p>
          <p className="text-sm text-red-700/80">
            Please switch your wallet to {target.name} to continue using Relynk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SwitchNetwork variant="default" size="sm" />
          <Button
            variant="neutral"
            size="sm"
            onClick={() => setVisible(false)}
            aria-label="Dismiss network alert"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NetworkOKBanner() {
  const { chain: accountChain } = useAccount();
  const chainId = accountChain?.id;
  const isSupported = chainId ? APP_SUPPORTED_CHAINS.some((c) => c.id === chainId) : false;
  if (!isSupported) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden md:flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 backdrop-blur px-3 py-2 text-emerald-800 shadow">
      <CheckCircle2 className="h-4 w-4" />
      <span className="text-sm">Network: {APP_SUPPORTED_CHAINS.find((c) => c.id === chainId)?.name}</span>
    </div>
  );
}
