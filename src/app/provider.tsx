"use client";

import { Config, cookieStorage, createStorage, WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { XellarKitProvider, defaultConfig, darkTheme } from "@xellar/kit";
import { liskSepolia } from "viem/chains";
import { SessionProvider } from "next-auth/react";
import { queryClient } from "@/services/api";

const config = defaultConfig({
  appName: "Xellar",
  // Required for WalletConnect
  walletConnectProjectId: "c0fa3bb10e007826b7f104092be2cf57",

  // Required for Xellar Passport
  xellarAppId: "429fe521-3fe4-4649-b90a-f09df8d41350",
  xellarEnv: "sandbox",
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  chains: [liskSepolia],
}) as Config;

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <XellarKitProvider theme={darkTheme}>{children}</XellarKitProvider>
          {/* Only show devtools in development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools 
              initialIsOpen={false}
              buttonPosition="bottom-right"
            />
          )}
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
